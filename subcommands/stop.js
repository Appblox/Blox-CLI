const chalk = require('chalk')
const { execSync } = require('child_process')
const { stopEmulator } = require('../utils/emulator-manager')
const { appConfig } = require('../utils/appconfigStore')

global.rootDir = process.cwd()

const stop = async (name) => {
  await appConfig.init()
  if (!name) {
    stopAllBlox()
  } else if (appConfig.has(name)) {
    if (appConfig.isLive(name)) {
      stopBlox(name)
    } else {
      console.log(`${chalk.whiteBright(name)} is not a live blox.`)
      console.log(`Use ${chalk.italic(`blox start ${name}`)} to start the blox`)
    }
  } else {
    // TODO -- throw a no blox found error and handle it in index by displaying all availbale live bloxes
    console.log(chalk.red(`No blox named ${chalk.bold(name)} found!`))
    console.log(`Currently live bloxes are:`)
    for (const {
      meta: { name: bloxname },
    } of appConfig.liveBloxes) {
      console.log(bloxname)
    }
  }
}

async function stopAllBlox() {
  if ([...appConfig.liveBloxes].length === 0) {
    console.log('\nNo bloxes are live!\n')
    process.exit(1)
  }
  for (const {
    meta: { name },
  } of appConfig.uiBloxes) {
    if (appConfig.isLive(name)) {
      await stopBlox(name)
    }
  }
  stopEmulator()
  // If Killing emulator is successfull, update all function blox configs..
  for (const {
    meta: { name },
  } of appConfig.fnBloxes) {
    appConfig.stopBlox = name
  }
}
async function stopBlox(name) {
  const liveDetails = appConfig.getLiveDetailsof(name)
  try {
    // process.kill(bloxToStart.pid, 'SIGKILL')
    execSync(`pkill -s ${liveDetails.pid}`)
    appConfig.stopBlox = name
  } catch (e) {
    console.log('Error in stopping blox process with pid ', liveDetails.pid)
    console.log(e)
  }

  console.log(`${name} stopped successfully!`)
}

module.exports = stop
// To avoid calling Init twice on tests
// if (process.env.NODE_ENV !== 'test') Init(process.argv)

// module.exports = Init
