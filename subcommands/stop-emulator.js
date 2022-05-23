#!/usr/bin/env node
const { stopEmulator } = require('../utils/emulator-manager')

global.rootDir = process.cwd()

const callStopEmulator = async () => {
  await stopEmulator()
}

console.log('-----------------------------------------------------------')
console.log('-------------------------------------------Calling stop emulator...----------------')
console.log('-----------------------------------------------------------')
callStopEmulator()
// To avoid calling Init twice on tests
// if (process.env.NODE_ENV !== 'test') Init(process.argv)

// module.exports = Init
module.exports = stopEmulator
