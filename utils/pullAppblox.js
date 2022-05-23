const chalk = require('chalk')
const path = require('path')
const pull = require('../subcommands/pull')
const { createFileSync } = require('./fileAndFolderHelpers')
const { checkAndSetGitConfigNameEmail, tryGitInit } = require('./gitCheckUtils')
const { confirmationPrompt } = require('./questionPrompts')
const { getBloxDetails, getAppConfigFromRegistry } = require('./registryUtils')

async function getConfigFromRegistry(id) {
  //   console.log(id)
  try {
    const res = await getAppConfigFromRegistry(id)
    if (res.status === 204) {
      console.log(`No appconfig found in registry.`)
      process.exit(1)
    }
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
const pullAppblox = async (name) => {
  const ID = await getBloxDetails(name)
    .then((res) => {
      if (res.status === 204) {
        console.log(`${name} not found in registry.`)
        process.exit(1)
      }
      if (res.data.err) {
        console.log(`Error getting details..`)
        process.exit(1)
      }
      // Make sure it is registered as appBlox, else unregistered
      if (res.data.data.BloxType !== 1) {
        console.log(`${name} is not registered as appblox`)
        process.exit(1)
      }
      // eslint-disable-next-line no-param-reassign
      return res.data.data.ID
    })
    .catch(() => {
      console.log('Something went terribly wrong...')
      process.exit(1)
    })

  const config = await getConfigFromRegistry(ID)
  if (!config) process.exit(1)

  //   const { bloxFinalName, bloxSource } = await createBlox(availableName, availableName, 1, '', false, '.')

  const [dir] = [config.name]
  const DIRPATH = path.resolve(dir)

  const CONFIGPATH = path.join(DIRPATH, 'appblox.config.json')
  createFileSync(CONFIGPATH, {
    name: config.name,
    type: 'appBlox',
    source: config.source,
    bloxPrefix: config.bloxPrefix,
  })

  tryGitInit()
  await checkAndSetGitConfigNameEmail(config.name)

  const reduced = { function: [], 'ui-elements': [], 'ui-container': [], 'shared-fn': [], data: [] }
  if (config.dependencies) {
    for (let index = 0; index < Object.keys(config.dependencies).length; index += 1) {
      const element = Object.keys(config.dependencies)[index]
      // console.log(element)
      const { meta } = config.dependencies[element]
      switch (meta.type) {
        case 'function':
          reduced.function.push({ ...config.dependencies[element] })
          break
        case 'ui-elements':
          reduced['ui-elements'].push({ ...config.dependencies[element] })
          break
        case 'ui-container':
          reduced['ui-container'].push({ ...config.dependencies[element] })
          break
        case 'data':
          reduced.data.push({ ...config.dependencies[element] })
          break
        case 'shared-fn':
          reduced['shared-fn'].push({ ...config.dependencies[element] })
          break
        default:
          break
      }
    }
  }
  for (let i = 0; i < Object.keys(reduced).length; i += 1) {
    const element = Object.keys(reduced)[i]
    const d = reduced[element]
    // console.log(d)
    if (d.length > 0) {
      const y = await confirmationPrompt({
        name: `pull-${element}`,
        message: `Found ${d.length} ${element} bloxes, Do you want to pull them `,
      })
      //   console.log(y)
      if (y) {
        for (let j = 0; j < d.length; j += 1) {
          const bloxData = d[j]
          const bloxMeta = bloxData.meta
          const z = await confirmationPrompt({
            name: `pull-${bloxMeta.name}`,
            message: `Do you want to pull ${bloxMeta.name} `,
          })
          if (z) {
            await pull(bloxMeta.name, { cwd: DIRPATH })
          }
        }
      }
    }
  }
}
module.exports = pullAppblox
