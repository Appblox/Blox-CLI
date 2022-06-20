/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const chalk = require('chalk')
const fs = require('fs')
const { readdir, readFile, rename, rm } = require('fs/promises')
const path = require('path')
const { bloxTypes } = require('../utils/bloxTypes')
const { getBloxDirsIn } = require('../utils/fileAndFolderHelpers')
const { getBloxDetails, getAppConfigFromRegistry } = require('../utils/registryUtils')
const { confirmationPrompt, getBloxName, readInput } = require('../utils/questionPrompts')
const { isValidBloxName } = require('../utils/bloxnameValidator')
const checkBloxNameAvailability = require('../utils/checkBloxNameAvailability')
const registerBlox = require('../utils/registerBlox')
const { bloxTypeInverter } = require('../utils/bloxTypeInverter')
const { diffObjects } = require('../utils/diff')
const { diffShower, manualMerge } = require('../utils/syncUtils')
const convertGitSshUrlToHttps = require('../utils/convertGitUrl')
const createBlox = require('../utils/createBlox')

/*
 *
 *  HANDLE ->
 *  1. found bloxes without config files, REMOVE - DONE
 *  2. found unregistered bloxes, should i register?
 *  3. found bloxes with registered name but different source
 *  4. would you like to register the app?(register then..if yes)
 *  5. create appblox.config.json
 *  6. Validate blox.config.json with YUP, so it has all expected fields
 */

const moveFolders = async (list) => {
  // list is [] with {oldPath:'',newPath:'',name:''}
  const report = []
  for (let i = 0; i < list.length; i += 1) {
    const d = list[i]
    try {
      await rename(d.oldPath, d.newPath)
      report.push({ status: 'success', ...d })
      // await unlink(d.oldPath)
    } catch (err) {
      report.push({ status: 'failed', msg: err.message, ...d })
    }
  }
  console.log(report)
}

/**
 *
 * @param {[nrbt]} list
 * @returns
 */
const offerAndRegisterBloxes = async (list) => {
  console.log(JSON.stringify(list))
  if (list.length === 0) return []
  const ans = await confirmationPrompt({
    name: 'registerDirs',
    message: 'Should I register directories',
  })
  const report = []
  if (ans) {
    for (let i = 0; i < list.length; i += 1) {
      const blox = list[i].data.localBloxConfig
      // report.push({ name: list[i].name, registered: list[i].registered, ...list[i].data })
      report.push({ ...list[i] }) // all are pushed so that below i can use report[i]
      // console.log(blox)
      const regIndBlox = await confirmationPrompt({
        name: `register-${blox.name}`,
        message: `Should I register ${blox.name}${list[i].sourcemismatch ? chalk.dim(`(source mismatch)`) : ``}`,
      })
      if (regIndBlox) {
        if (isValidBloxName(blox.name)) {
          console.log(`${blox.name} is a valid name`)
        } else {
          blox.name = await getBloxName()
          // console.log(blox.name)
        }
        blox.name = await checkBloxNameAvailability(blox.name)
        console.log(`available blox name to register - ${blox.name}`)

        const isPublic = await confirmationPrompt({
          name: 'ispublic',
          message: `Is ${blox.source.ssh} a public repository`,
        })
        const bloxDesc = await readInput({
          name: 'bloxdesc',
          message: 'Add a description for new blox..(optional)',
          default: blox.name,
        })
        await registerBlox(bloxTypeInverter(blox.type), blox.name, blox.name, isPublic, blox.source.ssh, bloxDesc)
        report[i].newName = blox.name
        report[i].registered = true
      }
    }
  }
  console.log('Report:')
  report.forEach((v) => {
    if (v.registered) {
      console.log(chalk.green(`${chalk.greenBright(v.name)} is registered as ${chalk.cyanBright(v.newName)} `))
    }
  })
  console.log()
  console.log(chalk.whiteBright('Please make the necessary changes in source files'))
  return report
}

const offerAndDeleteStaleDirectories = async (list) => {
  if (list.length === 0) return
  const ans = await confirmationPrompt({
    name: 'delstale',
    message: 'Should I delete all stale directories',
    default: false,
  })
  if (ans) {
    const promiseArray = []
    list.forEach((dir) => {
      promiseArray.push(rm(dir, { recursive: true, force: true }))
    })
    await Promise.allSettled(promiseArray).then((v) => console.log(v))
  }
}

const offerAndMoveBloxes = async (list) => {
  // console.log(list)
  if (list.length === 0) return
  const ans = await confirmationPrompt({
    name: 'movebloxes',
    message: 'Should I move all bloxes to correct directories based on type',
    default: false,
  })
  if (!ans) return
  const promiseArray = list.map((v) => readFile(path.resolve(v, 'blox.config.json'), { encoding: 'utf8' }))
  const summary = await Promise.allSettled(promiseArray)
    .then((a) =>
      a.reduce(
        (acc, curr, idx) => {
          if (curr.status === 'rejected') {
            acc.failedReads = [...acc.failedReads, list[idx]]
          }
          acc.successfulReads = [
            ...acc.successfulReads,
            { foldername: path.relative('.', list[idx]), currentLocation: list[idx], ...JSON.parse(curr.value) },
          ]
          return acc
        },
        { failedReads: [], successfulReads: [] }
      )
    )
    .then((a) => {
      if (a.failedReads.length !== 0) {
        console.log('Failed to reads:')
        console.log(a.failedReads)
      }
      return a.successfulReads
    })
    .then((a) =>
      a.map(({ currentLocation, name, type, foldername }) => ({
        name,
        type,
        currentLocation,
        expectedLocation: `${bloxTypes[bloxTypes.findIndex((t) => t[0] === type)][2]}/${foldername}`,
      }))
    )

  console.log(summary)
  await moveFolders(
    summary.map((v) => ({ oldPath: v.currentLocation, newPath: path.resolve(v.expectedLocation), name: v.name }))
  )
}

function cb(acc, v) {
  // console.log(this, acc, v)
  console.log()
  return this.findIndex((p) => p === v) === -1 ? acc.concat(v) : acc
}

async function getAndCheckAppName() {
  let bloxDetails = ''
  await readInput({
    name: 'cablxnm',
    message: 'Enter the appname',
    validate: async function test(ans) {
      if (!ans) return 'Should not be empty'
      if (ans === 'exit') return true
      const r = await getBloxDetails(ans)
        .then((res) => {
          if (res.status === 204) {
            return `${ans} not found in registry.`
          }
          if (res.data.err) {
            return `Error getting details..`
          }
          // Make sure it is registered as appBlox, else unregistered
          if (res.data.data.BloxType !== 1) {
            return `${ans} is not registered as appblox`
          }
          // eslint-disable-next-line no-param-reassign
          bloxDetails = { ...res.data.data }
          return true
        })
        .catch(() => 'Something went terribly wrong...')
      return r
    },
  })
  return bloxDetails || 'exit'
}

async function getConfigFromRegistry(id) {
  try {
    const res = await getAppConfigFromRegistry(id)
    if (res.data.err) {
      console.log(chalk.dim(res.data.msg))
      console.log(chalk.red('Failed to fetch config file..'))
      console.log('Please try again after some time')
      // process.exit(1)
      return null
    }
    return res.data.data.app_config
  } catch (err) {
    console.log(chalk.dim(err.message))
    console.log('Something went wrong, Please try again later')
    // process.exit(1)
    return null
  }
}

const sync = async () => {
  // INFO -- only surface level scanning, not recursively finding directories
  // If there are appbloxes as a dependency,
  // then they might contain bloxes and those would be needing a sync as well,
  // but this only deals with top layer of dependencies,
  // move to inner appblox directory and run sync to do the above

  // get details of app from user entered name if config missing
  // check if it is appblox type if show log and continue
  // if can't find ask till user exists..TODO
  // if exists get config and continue
  // finally once the local appblox config is built, compare
  // config from registry and make changes

  let appbloxIsRegistered = false
  /**
   * @type {bloxMetaData}
   */
  let appbloxDetails = ''
  let insideAppblox = false
  let appConfigFromRegistry = {}
  let appConfiginLocal = {}

  try {
    appConfiginLocal = await readFile('appblox.config.json', { encoding: 'utf8' }).then((d) => JSON.parse(d))
    console.log('Inside Appblox directory..')
    insideAppblox = true

    // console.log(appConfiginLocal.name, '\n 000')
    // TODO -- validate appblox config shape here
    const appid = await getBloxDetails(appConfiginLocal.name)
      .then((res) => {
        if (res.status === 204) {
          appbloxIsRegistered = false
          return null
        }
        if (res.data.err) {
          appbloxIsRegistered = false
          return null
        }
        // Make sure it is registered as appBlox, else unregistered
        if (res.data.data.BloxType !== 1) {
          return null
        }

        appbloxIsRegistered = true
        appbloxDetails = { ...res.data.data } // will change to actual config later
        return res.data.data.ID
      })
      .catch((err) => {
        console.log(err)
      })
    if (appbloxIsRegistered) {
      console.log(`\n${appConfiginLocal.name} is registered as an AppBlox.\n`)

      const config = await getConfigFromRegistry(appid)
      // console.log('---pulled config---')
      // console.log(config)
      if (!config) {
        console.log(`Couldn't find a config associated with your app..Try pushing config first`)
        // process.exit(1)
      }

      appbloxIsRegistered = true
      // eslint-disable-next-line no-unused-vars
      appConfigFromRegistry = config
    } else {
      console.log(`\n${appConfiginLocal.name} is not registered.\n`)
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      const ar = await confirmationPrompt({
        name: 'alreadyregistered',
        message: 'Are you trying to rebuild an already registered app',
      })
      if (ar) {
        const findAppBloxWithName = await getAndCheckAppName()
        if (findAppBloxWithName !== 'exit') {
          // console.log(findAppBloxWithName)
          appbloxDetails = findAppBloxWithName
          const config = await getConfigFromRegistry(findAppBloxWithName.ID)
          if (!config) process.exit(1)
          appbloxIsRegistered = true
          // eslint-disable-next-line no-unused-vars
          appConfigFromRegistry = config
        }
      }
    } else {
      console.log('Something went wrong!')
      console.log(err)
    }
  }

  const report = []

  const view = './view'
  const viewEl = './view/elements'
  const viewCo = './view/container'
  const fns = './functions'

  const vi = fs.existsSync(view)
  const vE = fs.existsSync(viewEl)
  const vC = fs.existsSync(viewCo)
  const f = fs.existsSync(fns)

  const pr = (...args) => path.resolve(args[0], args[1])
  const fm = (p) => pr.bind(null, p)

  if (!vi || !vE || !vC || !f) {
    console.log('I expect bloxes to be inside:')
    console.log(chalk.italic('./view'))
    console.log(chalk.italic(' - ./view/elements'))
    console.log(chalk.italic(' - ./view/container'))
    console.log(chalk.italic('./functions'))
    if (!vi) {
      console.log(chalk.red('./view missing'))
    }
    if (!vC) {
      console.log(chalk.red('./view/container missing'))
    }
    if (!vE) {
      console.log(chalk.red('./view/elements missing'))
    }
    if (!f) {
      console.log(chalk.red('./functions missing'))
    }
  }
  /**
   * List of all directories in root that could be bloxes
   * @type {Array<String>}
   */
  const allDirsInRoot = await readdir('.').then((l) => l.map(fm('.')))

  /**
   * List of all blox directories inside the root ( i.e where the sync command is being run )
   * @type {Array<String>}
   */
  const bloxDirectoriesInWrongLocation = getBloxDirsIn(allDirsInRoot)

  await offerAndMoveBloxes(bloxDirectoriesInWrongLocation)

  // INFO : find dirs inside /functions,/view/elements,/view/container only after
  //        offering to move blox dirs found in root, so no bloxes are missed.

  const pa = []
  if (vi && vE) pa.push(readdir(viewEl).then((l) => l.map(fm(viewEl))))
  if (vi && vC) pa.push(readdir(viewCo).then((l) => l.map(fm(viewCo))))
  if (f) pa.push(readdir(fns).then((l) => l.map(fm(fns))))
  /**
   * List of all directories that could be bloxes in paths -
   *  functions/* , view/container/* , and view/elements/*
   * @type {Array<String>}
   */
  const allDirectories = await Promise.all(pa)
    .then((l) => l.flatMap((v) => v))
    .catch((err) => {
      console.log(err)
      process.exit(1)
    })

  const bloxDirectories = getBloxDirsIn(allDirectories)

  // If bloxes count is not same as the number of directories found, then
  // there are some stale directories..

  // INFO : /function , /view/container , /view/elements are only expected to contain
  //        blox dirs, so all other dirs without blox config can be considered stale,
  //        not the case with root as it can contain valid other dirs..so staleDirsInRoot is wrong.
  // const staleDirsInRoot = allDirsInRoot.length - bloxDirectoriesInWrongLocation.length

  const staleDirsInsideApp = allDirectories.length - bloxDirectories.length

  if (staleDirsInsideApp > 0 || staleDirsInsideApp > 0) {
    // const cb = (b, acc, v) => (b.findIndex((p) => p === v) === -1 ? acc.concat(v) : acc)
    const staleDirectories = [
      ...allDirectories.reduce(cb.bind(bloxDirectories), []),
      // ...allDirsInRoot.reduce(cb.bind(bloxDirectoriesInWrongLocation), []),
    ]
    report.push({
      message: `Found ${staleDirectories.length} directories without blox.config.json`,
      data: staleDirectories,
    })
    console.log(report)
    await offerAndDeleteStaleDirectories(staleDirectories)
  }
  // console.log(bloxDirectories, '===========')
  const localBloxes = bloxDirectories.reduce((acc, cur) => {
    const b = JSON.parse(fs.readFileSync(path.resolve(cur, 'blox.config.json')))
    return acc.concat(b)
  }, [])

  const promiseArray = localBloxes.map((v, i) =>
    getBloxDetails(v.name)
      .then((res) => {
        if (res.status === 204) {
          return {
            name: v.name,
            directory: path.relative('.', bloxDirectories[i]),
            registered: false,
            sourcemismatch: false,
            data: { localBloxConfig: v, detailsInRegistry: null },
          }
        }
        if (res.data.err) {
          return {
            name: v.name,
            directory: path.relative('.', bloxDirectories[i]),
            registered: false,
            sourcemismatch: false,
            data: { detailsInRegistry: res.data.err, localBloxConfig: v },
          }
        }
        return {
          name: v.name,
          directory: path.relative('.', bloxDirectories[i]),
          registered: true,
          sourcemismatch: false,
          data: { detailsInRegistry: res.data.data, localBloxConfig: v },
        }
      })
      .catch((err) => {
        console.log(err)
      })
  )

  /**
   * @typedef dinob
   * @type {Object}
   * @property {bloxMetaData} detailsInRegistry
   * @property {Object} localBloxConfig
   */

  /**
   * @typedef nrbt
   * @type {Object}
   * @property {String} name
   * @property {Boolean} registered
   * @property {dinob} data
   * @property {Boolean} sourcemismatch
   */
  /**
   * @type {[nrbt]}
   */
  const res = await Promise.all(promiseArray)
  // console.log(res)

  const { nonRegisteredBloxes, alreadyRegisteredBloxes } = res.reduce(
    (acc, curr) => {
      if (!curr.registered) acc.nonRegisteredBloxes.push(curr)
      else if (curr.data.localBloxConfig.source.ssh !== curr.data.detailsInRegistry.GitUrl) {
        acc.nonRegisteredBloxes.push({ ...curr, sourcemismatch: true })
      } else {
        acc.alreadyRegisteredBloxes.push({ ...curr })
      }
      return acc
    },
    { nonRegisteredBloxes: [], alreadyRegisteredBloxes: [] }
  )

  report.push({
    message: `Found ${nonRegisteredBloxes.length} non registered bloxes..`,
    data: nonRegisteredBloxes,
  })

  console.log(report)
  const t = await offerAndRegisterBloxes(nonRegisteredBloxes)

  const newlyRegisteredBloxes = t.filter((v) => v.registered)
  const deps = [...alreadyRegisteredBloxes, ...newlyRegisteredBloxes].reduce((acc, curr) => {
    acc[curr.name] = { ...acc[curr.name], directory: curr.directory, meta: curr.data.localBloxConfig }
    return acc
  }, {})
  console.log()
  console.log('New dependencies')
  console.log(deps)

  // console.log('------')
  // console.log(appConfigFromRegistry)
  // await handleAppbloxSync();
  // syncing logic starts here
  // 4 cases - (no config,config) && not (registered,not registered)
  if (insideAppblox && appbloxIsRegistered) {
    // INFO : Found an appblox.config.json and also the app is registered
    if (!appConfigFromRegistry) {
      // INFO : Local config is present but couldn't find app config in the registry
      console.log(`${chalk.bgYellow('INFO')} Config not found in  Registry for ${appbloxDetails.BloxName}`)
      // Create a full config mixing newly created dependencies and other details from present local config
      const possibleNewConfig = { ...appConfiginLocal, dependencies: { ...deps } }
      const diffed_newlyCreatedConfig_with_PresentConfig = diffObjects(possibleNewConfig, appConfiginLocal)
      diffShower(diffed_newlyCreatedConfig_with_PresentConfig)
      // TODO : Provide automatic merge options
      // TODO : Inform the user to push the config once it is written in local
      // const c1 = await getMergeConfirmation()
      //   if (c1) {
      //   }
      const co = await manualMerge(diffed_newlyCreatedConfig_with_PresentConfig)
      fs.writeFileSync('appblox.config.json', JSON.stringify(co, null, 2))

      console.log(`${chalk.bgCyan('WARN')} Appblox config not pushed.`)
      console.log('DONE')
    } else {
      // INFO : Local config is present and so is config in registry,
      //        pull config from registry and compare with newly created config,
      //        also comapre with local config, display diffs,
      //        if a new config is created, push the same and write it loocally
      // compare applocal config dependencies with newly created dependencies
      // if matches -> display msg and exit
      // else display diffs and write new config
      // if user has access, push the new config or Display msg to push
      console.log(`${chalk.bgYellow('INFO')} Config found in Registry for ${appbloxDetails.BloxName}`)
      const diffed_configinlocal_with_newlybuilt = diffObjects(
        {
          ...appConfiginLocal,
          dependencies: { ...deps },
        },
        appConfiginLocal
      )
      diffShower(diffed_configinlocal_with_newlybuilt)
      // const c1 = await getMergeConfirmation()
      // if (c1) {
      // }

      console.log(`${chalk.bgYellow('INFO')} Config found Registry for ${appbloxDetails.BloxName}`)
      const co1 = await manualMerge(diffed_configinlocal_with_newlybuilt)
      const diffed_FromRegistry_with_Merge_of_newlyBuilt_and_LocalConfig = diffObjects(appConfigFromRegistry, co1)
      // TODO : accept incoming changes -> if there is a removal of blox, delete the local dir for that blox also
      // TODO : If there are dependencies present in local config, which the user needs to be merged with new config,
      //        Make an effort to pull the dependecy
      diffShower(diffed_FromRegistry_with_Merge_of_newlyBuilt_and_LocalConfig)
      /**
       * @type {appbloxConfigShape}
       */
      const co2 = await manualMerge(diffed_configinlocal_with_newlybuilt)

      fs.writeFileSync('appblox.config.json', JSON.stringify(co2, null, 2))

      console.log(`${chalk.bgCyan('WARN')} Appblox config not pushed.`)
      console.log('DONE')
    }
  } else if (insideAppblox && !appbloxIsRegistered) {
    // INFO : Has a local config file, but no config in registtry.
    //        Compare newly created config with present local config and display diffs,
    //        write diffs, Register app and push config
    // register appblox and push new config

    // Same as above case one, but also prompt to register app and push config
    // TODO::
    const possibleNewConfig = { ...appConfiginLocal, dependencies: { ...deps } }
    const diffed_newlyCreatedConfig_with_PresentConfig = diffObjects(possibleNewConfig, appConfiginLocal)
    diffShower(diffed_newlyCreatedConfig_with_PresentConfig)
    const co = await manualMerge(diffed_newlyCreatedConfig_with_PresentConfig)
    fs.writeFileSync('appblox.config.json', JSON.stringify(co, null, 2))

    console.log(`${chalk.bgCyan('WARN')} Appblox config not pushed.`)
    console.log('DONE')
  } else if (!insideAppblox && appbloxIsRegistered) {
    // INFO : we don't have local config but we pulled an appblox which could or could not have config.
    if (appConfigFromRegistry) {
      // INFO : We don't have a local config, but a new dpendency list we built, and a config from
      //        Registry, compare both.
      console.log(`${chalk.bgYellow('INFO')} Config found Registry for ${appbloxDetails.BloxName}`)
      const possibleNewConfig = { dependencies: { ...deps } }
      // INFO : always compare incoming with present, so diffShower works properly
      //        Passing possibleNewConfig first to diffObjects will result in showing incoming new
      //        addition in red colour opposed to being correctly shown in green colour
      const diffed_newlyCreatedPartialConfig_with_ConfigFromRegistry = diffObjects(
        appConfigFromRegistry,
        possibleNewConfig
      )

      diffShower(diffed_newlyCreatedPartialConfig_with_ConfigFromRegistry)

      const co = await manualMerge(diffed_newlyCreatedPartialConfig_with_ConfigFromRegistry)
      fs.writeFileSync('appblox.config.json', JSON.stringify(co, null, 2))

      console.log(`${chalk.bgCyan('WARN')} Appblox config not pushed.`)
      console.log('DONE')
    } else {
      console.log(`${chalk.bgYellow('INFO')} No config found in Registry`)
      // INFO : At this point we have a dependency list we created and details of the registered app,
      //        So create a new appblox config with those.

      const { BloxName, GitUrl } = appbloxDetails
      const source = { ssh: GitUrl, https: convertGitSshUrlToHttps(GitUrl) }
      const newAppbloxConfig = { name: BloxName, type: 'appBlox', source, dependencies: { ...deps } }

      console.log(`${chalk.bgYellow('INFO')} Writing new config`)
      console.log(newAppbloxConfig)
      fs.writeSync('appblox.config.json', JSON.stringify(newAppbloxConfig))
      console.log('New config written')
      console.log(`${chalk.bgCyan('WARN')} Appblox config not pushed.`)
      console.log('Please push the new config, If you have access')
      console.log('DONE')
    }
  } else if (!insideAppblox && !appbloxIsRegistered) {
    // INFO : Not registered so no cofig present in registry,
    //        need to register first, write newly created config,
    //        push newly created config
    console.log(`${chalk.bgYellow('INFO')} No Registered app, register one to continue..`)
    const componentName = await getBloxName()
    const availableName = await checkBloxNameAvailability(componentName)
    const { bloxFinalName, bloxSource } = await createBlox(availableName, availableName, 1, '', false, '.')

    fs.writeFileSync(
      'appblox.config.json',
      JSON.stringify(
        {
          name: bloxFinalName,
          type: 'appBlox',
          source: bloxSource,
          dependencies: { ...deps },
        },
        null,
        2
      )
    )

    console.log(`${chalk.bgCyan('WARN')} Appblox config not pushed.`)
    console.log('DONE')
  } else {
    console.log('OOPS!!')
  }
}

module.exports = sync
