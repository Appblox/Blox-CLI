// const fs = require('fs')
// const fsPromise = require('fs/promises')

// const liveDataFile = '/.appblox.live.json'
// const configManager = require('./config-manager')

// async function checkLive() {
//   console.log('checking live....')
//   await validateLogsDir()
//   await validateLiveData()
// }
// async function validateLogsDir() {
//   console.log('checking if logs dir are there....')
//   if (fs.existsSync('./logs')) {
//     console.log('logs dir exist')
//     // enter the code to excecute after the folder is there.
//   } else {
//     console.log('creating logs.dirs....')
//     // Below code to create the folder, if its not there
//     fs.mkdirSync('logs/out', { recursive: true })
//     fs.mkdirSync('logs/err', { recursive: true })
//   }
// }
// async function getLiveBloxData(rootDir) {
//   console.log('getting live blox data.......')
//   let liveBloxData = null
//   try {
//     liveBloxData = JSON.parse(
//       await fsPromise.readFile(rootDir + liveDataFile, 'utf8')
//     )
//   } catch (e) {
//     console.log('error in getting live blox data...', e)
//     liveBloxData = null
//   }

//   return liveBloxData
// }
// async function validateLiveData() {
//   console.log('validating live data.....')
//   const liveData = await getLiveBloxData('.')
//   if (liveData) {
//     console.log('live data found....')
//     let noChange = true
//     let blox
//     for (const bloxName of Object.keys(liveData)) {
//       blox = liveData[bloxName]
//       if (!blox.log) {
//         console.log('logs dir not configured for', bloxName)
//         noChange = false
//         blox.log = {
//           out: `./logs/out/${blox.meta.name}.log`,
//           err: `./logs/err/${blox.meta.name}.log`,
//         }
//       }
//     }
//     if (!noChange) {
//       console.log('updating live data with log configs.....')
//       fs.writeFileSync(`.${liveDataFile}`, JSON.stringify(blox), {
//         encoding: 'utf8',
//       })
//     }
//   } else {
//     console.log('not found live data....')
//     await writeLiveData()
//   }
// }
// async function writeLiveData() {
//   console.log('writing livedata from config....')
//   const config = await configManager.getAppbloxConfig('.')
//   if (config) {
//     console.log('found appblox config....')
//     const dependencies = config.dependencies || {}
//     for (const bloxName of Object.keys(dependencies)) {
//       const blox = dependencies[bloxName]
//       if (!blox.log) {
//         blox.log = {
//           out: `./logs/out/${blox.meta.name}.log`,
//           err: `./logs/err/${blox.meta.name}.log`,
//         }
//       }
//     }
//     console.log('formed livedata and updating to live data file...')
//     fs.writeFileSync(`.${liveDataFile}`, JSON.stringify(dependencies), {
//       encoding: 'utf8',
//     })
//   }
// }
// async function updateLiveBlox(rootDir, bloxName, data) {
//   const liveBloxData = await getLiveBloxData(rootDir)
//   console.log('name = ', bloxName)
//   console.log('UPDATE LIVE MANAGE CALLED')
//   let blox = liveBloxData[bloxName]
//   if (!blox) {
//     throw new Error('blox not found!', bloxName, liveBloxData)
//   }
//   blox = { ...liveBloxData, [bloxName]: { ...liveBloxData[bloxName], ...data } }
//   fs.writeFileSync(rootDir + liveDataFile, JSON.stringify(blox), {
//     encoding: 'utf8',
//   })
// }
// module.exports = { getLiveBloxData, updateLiveBlox, checkLive }
