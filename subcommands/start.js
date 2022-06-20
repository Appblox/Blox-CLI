/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Spinnies = require('spinnies')
const { createReadStream, watchFile } = require('fs')
const { Stream } = require('stream')
const readline = require('readline')
const path = require('path')
const chalk = require('chalk')
const { runBash, runBashLongRunning } = require('./bash')
const { getFreePorts } = require('./port-check')
const { getAbsPath } = require('../utils/path-helper')
const emulateNode = require('./emulate')
const { setupEnv } = require('../utils/env')
const { appConfig } = require('../utils/appconfigStore')
const { checkPnpm } = require('../utils/pnpmUtils')

global.rootDir = process.cwd()

const watchCompilation = (fileName) =>
  new Promise((resolve, reject) => {
    let ERROR = false
    const report = { errors: [] }
    const outStream = new Stream()
    watchFile(path.resolve(fileName), { persistent: false }, (currStat, prevStat) => {
      const inStream = createReadStream(path.resolve(fileName), {
        autoClose: false,
        encoding: 'utf8',
        start: prevStat.size,
        end: currStat.size,
      })
      const onLine = (line) => {
        if (line.includes('ERROR')) {
          ERROR = true
        } else if (ERROR) {
          report.errors.push(line)
          ERROR = false
        }
      }
      const onError = (err) => {
        report.errors.push(err.message.split('\n')[0])
        reject(report)
      }
      const onClose = () => {
        inStream.destroy()
        resolve(report)
      }
      const rl = readline.createInterface(inStream, outStream)
      rl.on('line', onLine)
      rl.on('error', onError)
      rl.on('close', onClose)
    })
  })
const spinnies = new Spinnies()
const start = async (bloxname, { usePnpm }) => {
  global.usePnpm = false
  if (!usePnpm) {
    console.info('We recommend using pnpm for package management')
    console.info('Start command might install dependencies before starting bloxes')
    console.info('For faster blox start, pass --use-pnpm')
  } else if (!checkPnpm()) {
    console.info('Seems like pnpm is not installed')
    console.warn(`pnpm is recommended`)
    console.info(`Visit https://pnpm.io for more info`)
  } else {
    global.usePnpm = true
  }

  await appConfig.init()
  // Setup env from appblox.config.json data
  const configData = appConfig.appConfig
  await setupEnv(configData)

  if (!bloxname) {
    let c = 0
    // eslint-disable-next-line no-unused-vars
    for (const _ of appConfig.nonLiveBloxes) {
      c += 1
    }
    if (c === 0) {
      console.log('\nAll bloxes are already live!\n')
    } else {
      await startAllBlox()
    }
  } else {
    if (!appConfig.has(bloxname)) {
      console.log('Blox not found')
      process.exit(1)
    }
    const port = await getFreePorts(appConfig, bloxname)
    await startBlox(bloxname, port)
  }
}

async function startAllBlox() {
  // let containerBlox = null
  const emulateLang = 'nodejs'
  let emData

  // Build env for all bloxes
  const PORTS = await getFreePorts(appConfig)

  spinnies.add('emulator', { text: 'Staring emulator' })
  switch (emulateLang) {
    case 'nodejs':
      emData = await emulateNode(PORTS.emulator)
      break
    default:
      emData = await emulateNode(PORTS.emulator)
      break
  }
  if (emData.status === 'success') {
    for (const fnBlox of appConfig.fnBloxes) {
      appConfig.startedBlox = {
        name: fnBlox.meta.name,
        pid: emData.data.pid || null,
        isOn: true,
        port: emData.data.port || null,
        log: {
          out: `./logs/out/functions.log`,
          err: `./logs/err/functions.log`,
        },
      }
    }
    spinnies.succeed('emulator', { text: `emulator started at ${emData.data.port}` })
  } else {
    spinnies.fail('emulator', { text: `emulator failed to start ${chalk.gray(`(${emData.msg})`)}` })
  }
  const promiseArray = []

  for (const blox of appConfig.uiBloxes) {
    promiseArray.push(startBlox(blox.meta.name, PORTS[blox.meta.name]))
    if (blox.meta.type === 'ui-container') {
      // containerBlox = blox
    }
  }
  const reportRaw = await Promise.allSettled(promiseArray)
  // console.log(JSON.stringify(reportRaw))
  const reducedReport = reportRaw.reduce(
    (acc, curr) => {
      const { data } = curr.value
      const { name } = data
      switch (curr.value.status) {
        case 'success':
          acc.success.push({ name, reason: [] })
          break
        case 'failed':
          acc.failed.push({ name, reason: [curr.value.msg] })
          break
        case 'compiledwitherror':
          acc.startedWithError.push({ name, reason: curr.value.compilationReport.errors })
          break

        default:
          break
      }
      return acc
    },
    { success: [], failed: [], startedWithError: [], startedWithWarning: [] }
  )
  // console.log(reducedReport)
  for (const key in reducedReport) {
    if (Object.hasOwnProperty.call(reducedReport, key)) {
      const status = reducedReport[key]
      if (status.length > 0) {
        console.log(`${chalk.whiteBright(key)}`)
        status.forEach((b) => {
          console.log(`-${b.name}`)
          b.reason.forEach((r) => console.log(`--${r}`))
        })
      }
    }
  }
  // if (containerBlox) {
  //   console.log(`Visit url http://localhost:${containerBlox.port} to view the app`)
  // }
}
async function startBlox(name, port) {
  spinnies.add(name, { text: `Starting ${name}` })
  if (!appConfig.has(name)) {
    // console.log('Blox not found!')
    spinnies.fail(name, { text: 'Blox not found!' })
    process.exit()
  }
  const bloxToStart = appConfig.getBloxWithLive(name)
  let blox
  switch (bloxToStart.meta.language) {
    case 'nodejs': {
      blox = await startNodeProgram(bloxToStart, name, port)
      break
    }
    case 'js': {
      blox = await startJsProgram(bloxToStart, name, port)
      break
    }
    case 'go': {
      blox = await startGoProgram(bloxToStart, name, port)
      break
    }
    default:
      console.log('Do not support the configured language!')
      process.exit()
  }
  if (blox.status === 'success') {
    appConfig.startedBlox = blox.data
    spinnies.succeed(name, { text: `${name} started at ${blox.data.port}` })
    return blox
  }
  if (blox.status === 'compiledwitherror') {
    appConfig.startedBlox = blox.data
    const { errors } = blox.compilationReport
    spinnies.succeed(name, {
      text: `${name} started at ${blox.data.port} with ${errors.length} errors`,
      succeedColor: 'yellow',
    })
    return blox
  }
  spinnies.fail(name, { text: `${name} failed to start ${chalk.gray(`${blox.msg}`)}` })
  return blox
}
async function startNodeProgram(blox, name, port) {
  try {
    const directory = getAbsPath(blox.directory)
    spinnies.update(name, { text: `Installing dependencies in ${name}` })
    // await runBash(blox.meta.postPull, directory)
    const i = await runBash(global.usePnpm ? 'pnpm install' : blox.meta.postPull, path.resolve(blox.directory))
    if (i.status === 'failed') {
      throw new Error(i.msg)
    }
    spinnies.update(name, { text: `Dependencies installed in ${name}` })
    spinnies.update(name, { text: `Assigning port for ${name}` })
    // const port = await validateAndAssignPort(blox.port)
    spinnies.update(name, { text: `Assigned port ${chalk.whiteBright(port)} for ${name}` })

    spinnies.update(name, { text: `Starting ${name} with ${chalk.whiteBright(blox.meta.start)}` })
    const startCommand = `${blox.meta.start} --port=${port}`
    const childProcess = runBashLongRunning(startCommand, blox.log, directory)
    spinnies.update(name, { text: `Compiling ${name} ` })
    const updatedBlox = { name, pid: childProcess.pid, port, isOn: true }
    const compilationReport = await watchCompilation(blox.log.out)
    spinnies.update(name, { text: `${name} Compiled with ${compilationReport.errors.length}  ` })

    const status = compilationReport.errors.length > 0 ? 'compiledwitherror' : 'success'

    return { status, msg: '', data: updatedBlox, compilationReport }
  } catch (err) {
    // console.error(err)
    // console.log(`${name} start failed!`)
    return {
      status: 'failed',
      msg: err.message.split('\n')[0],
      data: { name, pid: null, port: null, isOn: false },
      compilationReport: {},
    }
  }
}
async function startJsProgram(blox, name, port) {
  try {
    const directory = getAbsPath(blox.directory)
    spinnies.update(name, { text: `Installing dependencies in ${name}` })
    // const i = await runBash(blox.meta.postPull, directory)
    const i = await runBash(global.usePnpm ? 'pnpm install' : blox.meta.postPull, path.resolve(blox.directory))
    if (i.status === 'failed') {
      throw new Error(i.msg)
    }
    spinnies.update(name, { text: `Dependencies installed in ${name}` })
    spinnies.update(name, { text: `Assigning port for ${name}` })
    spinnies.update(name, { text: `Assigned port ${chalk.whiteBright(port)} for ${name}` })
    const startCommand = `${blox.meta.start} --port=${port}`
    const childProcess = runBashLongRunning(startCommand, blox.log, directory)
    spinnies.update(name, { text: `Compiling ${name} ` })
    const updatedBlox = { name, pid: childProcess.pid, port, isOn: true }
    const compilationReport = await watchCompilation(blox.log.out)
    spinnies.update(name, { text: `${name} Compiled with ${compilationReport.errors.length}  ` })

    const status = compilationReport.errors.length > 0 ? 'compiledwitherror' : 'success'
    return { status, msg: '', data: updatedBlox, compilationReport }
  } catch (err) {
    return {
      status: 'failed',
      msg: err.message.split('\n')[0],
      data: { name, pid: null, port: null, isOn: false },
      compilationReport: {},
    }
  }
}
async function startGoProgram(blox) {
  try {
    getAbsPath(blox.directory)
    // await bloxPostPull();
    // const isDefaultPortAvailable = await checkPort(blox.port);
    // // ask, the configured port is busy, do you want start in another port and if yes
    // if (!isDefaultPortAvailable) {
    //   const [port] = await findFreePort(3000);
    //   const startCommand = `${blox.start} --port=${port}`;
    //   await bloxStart(startCommand);
    //   console.log(`${blox.name} started successfully!`)
    // }
    // await bloxStart();
  } catch (err) {
    console.error(err)
  }
}

module.exports = start
