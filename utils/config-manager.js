const fsPromise = require('fs/promises')
const fs = require('fs')

const configFile = '/appblox.config.json'

async function getAppbloxConfig(rootDir) {
  const root = rootDir || '.'
  const appBloxData = JSON.parse(await fsPromise.readFile(root + configFile, 'utf8'))
  return appBloxData
}

async function addBlox(name, bloxData) {
  const root = '.'
  const appConfig = await getAppbloxConfig()
  if (!appConfig.dependencies) {
    appConfig.dependencies = {}
  }
  appConfig.dependencies = {
    ...appConfig.dependencies,
    [name]: bloxData,
  }
  fs.writeFileSync(root + configFile, JSON.stringify(appConfig), {
    encoding: 'utf8',
  })
}

async function upsertAppBloxConfig(name, bloxData) {
  const root = '.'
  const appConfig = await getAppbloxConfig()
  appConfig[name] = bloxData
  fs.writeFileSync(root + configFile, JSON.stringify(appConfig), {
    encoding: 'utf8',
  })
}

module.exports = { getAppbloxConfig, addBlox, upsertAppBloxConfig }
