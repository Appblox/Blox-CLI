const path = require('path')

const rootDir = null
function getAbsPath(relative) {
  return path.normalize(`${global.rootDir}/${relative}`)
}

module.exports = { getAbsPath, rootDir }
