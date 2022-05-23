const { readFileSync, writeFileSync } = require('fs')
const path = require('path')

const appConfig = readFileSync('appblox.config.json')

for (const blox in appConfig.dependencies) {
  if (Object.hasOwnProperty.call(appConfig.dependencies, blox)) {
    const bloxMeta = appConfig.dependencies[blox]
    writeFileSync(path.resolve(bloxMeta.directory, 'README.md'), new Date().toDateString())
  }
}
