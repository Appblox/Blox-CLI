const path = require('path')
const axios = require('axios')
const { readFileSync, writeFileSync } = require('fs')
const chalk = require('chalk')
const Spinnies = require('spinnies')

const createBlox = require('../utils/createBlox')

const { appBloxGetBloxDetails } = require('../utils/api')
const { wantToCreateNewVersion } = require('../utils/questionPrompts')
const checkBloxNameAvailability = require('../utils/checkBloxNameAvailability')
const { getShieldHeader } = require('../utils/getHeaders')
const { appConfig } = require('../utils/appconfigStore')
const convertGitSshUrlToHttps = require('../utils/convertGitUrl')
const { configstore } = require('../configstore')
const { GitManager } = require('../utils/gitmanager')
const { runBash } = require('./bash')
const { checkPnpm } = require('../utils/pnpmUtils')

const pull = async (componentName, { cwd = '.' }) => {
  // Pull must happen only inside an appBlox
  appConfig.init(cwd)

  const spinnies = new Spinnies()

  const headers = getShieldHeader()

  /**
   * @type {bloxMetaData}
   */
  let metaData

  spinnies.add('bloxExistsCheck', { text: `Searching for ${componentName}` })

  try {
    // TODO
    // Now if blox is not present 204 with empty data is send
    // This part needs refactoring
    const resp = await axios.post(
      appBloxGetBloxDetails,
      {
        blox_name: componentName,
      },
      { headers }
    )

    if (resp.status === 204) {
      spinnies.fail('bloxExistsCheck', { text: `${componentName} doesn't exists in blox repository` })
      // console.log(chalk.redBright(`${componentName} doesn't exists in blox repository`))
      process.exit(1)
    }

    const { data } = resp
    if (data.err) {
      throw new Error('Something went wrong from our side\n', data.msg).message
    }
    metaData = data.data

    if (metaData.BloxType === 1) {
      throw new Error(`Cannot pull appBloxes,\n ${chalk.yellow(metaData.BloxName)} is an appBlox`).message
    }
  } catch (err) {
    // console.log('Something went wrong while getting blox details..')
    spinnies.fail('bloxExistsCheck', { text: `${err}` })
    console.log('\n')
    console.log(err)
    process.exit(1)
  }

  spinnies.succeed('bloxExistsCheck', { text: `${componentName} is available` })
  spinnies.remove('bloxExistsCheck')
  // console.log(metaData, 'details')

  // if not errored continue

  /**
   * To try and run postPull script
   */
  let pulledBloxPath = ''

  try {
    // await ensureUserLogins()
    // const { prefix } = appConfig
    const createCustomVersion = await wantToCreateNewVersion(metaData.BloxName)
    // console.log(createCustomVersion)
    if (createCustomVersion) {
      const availableName = await checkBloxNameAvailability(metaData.BloxName, true)
      const { clonePath, cloneDirName } = await createBlox(
        availableName,
        availableName,
        metaData.BloxType,
        metaData.GitUrl,
        false,
        cwd
      )

      // TODO -- store new blox details in two branches and run addBlox way dow
      // n, so this code is only once!!
      // Maybe update config from createBlox itself
      appConfig.addBlox({
        directory: path.relative(cwd, path.resolve(clonePath, cloneDirName)),
        meta: JSON.parse(readFileSync(path.resolve(clonePath, cloneDirName, 'blox.config.json'))),
      })
      pulledBloxPath = path.resolve(clonePath, cloneDirName)
    } else {
      const existingBlox = appConfig.getBlox(componentName)
      if (existingBlox) {
        throw new Error(`${componentName} already exists at ${existingBlox.directory}`).message
      }
      const { clonePath } = await createBlox(
        metaData.BloxName,
        metaData.BloxName,
        metaData.BloxType,
        metaData.GitUrl,
        true,
        cwd
      )
      const localDirName = `_${appConfig.prefix}_${metaData.BloxName}`

      const prefersSsh = configstore.get('prefersSsh')
      const originUrl = prefersSsh ? metaData.GitUrl : convertGitSshUrlToHttps(metaData.GitUrl)
      const Git = new GitManager(path.resolve(), localDirName, originUrl, prefersSsh)

      await Git.clone(path.resolve(clonePath, localDirName))

      // execSync(`git clone ${metaData.GitUrl} ${path.resolve(clonePath, localDirName)}`, {
      //   stdio: 'ignore',
      // })

      console.log(chalk.dim('Succefully cloned'))

      // -------------------------------------------------
      // -------------------------------------------------
      // -------------BELOW CODE IS REPEATED--------------
      // -------------------------------------------------
      // -------------------------------------------------

      // Try to update blox config of pulled blox,
      // if not present add a new one

      // This is code also present on createBlox
      let bloxConfig
      try {
        bloxConfig = JSON.parse(readFileSync(path.resolve(clonePath, localDirName, 'blox.config.json')))
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.log(chalk.dim('Pulled blox has no config file, adding a new one'))
          bloxConfig = {
            type: metaData.BloxType,
            language: 'nodejs',
            start: 'npx webpack-dev-server',
            build: 'npx webpack',
            postPull: 'npm i',
          }
        }
      }
      bloxConfig.name = metaData.BloxName
      bloxConfig.source = { https: convertGitSshUrlToHttps(metaData.GitUrl), ssh: metaData.GitUrl }
      writeFileSync(path.resolve(clonePath, localDirName, 'blox.config.json'), JSON.stringify(bloxConfig))

      console.log(chalk.dim('Succesfully updated blox config..'))

      // -------------------------------------------------
      // -------------------------------------------------
      // -------------ABOVE CODE IS REPEATED--------------
      // -------------------------------------------------
      // -------------------------------------------------
      // go to pulled blox and add the blox config to appblo config

      appConfig.addBlox({
        directory: path.relative(cwd, path.resolve(clonePath, localDirName)),
        meta: JSON.parse(readFileSync(path.resolve(clonePath, localDirName, 'blox.config.json'))),
      })

      console.log(chalk.green(`${metaData.BloxName} pulled Successfully!`))

      pulledBloxPath = path.resolve(clonePath, localDirName)
    }
  } catch (err) {
    console.log('Something went wrong while pulling,please try again.\n')
    console.log(chalk.red(err))
  }

  // RUN the post pull script here
  // execSync(`cd ${pulledBloxPath} `)
  // TODO: use pnpm

  spinnies.add('npmi', { text: 'Checking for pnpm binary' })
  let usePnpm = false
  if (checkPnpm()) {
    usePnpm = true
  } else {
    spinnies.update('npmi', { text: 'pnpm is not installed', status: 'stopped' })
    console.log(`pnpm is recommended`)
    console.log(`Visit https://pnpm.io for more info`)
  }
  spinnies.add('npmi', { text: `Installing dependencies with ${usePnpm ? `pnpm` : 'npm'}` })
  const ireport = await runBash(usePnpm ? `pnpm install` : 'npm i', pulledBloxPath)
  if (ireport.status === 'failed') {
    spinnies.fail('npmi', { text: ireport.msg })
  } else {
    spinnies.succeed('npmi', { text: 'Dependencies installed' })
  }
  spinnies.remove('npmi')
}

module.exports = pull
