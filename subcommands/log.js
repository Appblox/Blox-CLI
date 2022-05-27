const { createReadStream, watchFile } = require('fs')
const path = require('path')
const { appConfig } = require('../utils/appconfigStore')

const log = async (bloxname) => {
  appConfig.init()
  if (!appConfig.has(bloxname)) {
    console.log('Blox Doesnt exists')
    return
  }
  if (!appConfig.isLive(bloxname)) {
    console.log(`${bloxname} is not live.`)
    console.log(`Run blox start ${bloxname} to start the blox.`)
    return
  }
  console.log(`Showing log of ${bloxname}`)

  const appLiveData = appConfig.getBloxWithLive(bloxname)
  // console.log(appLiveData)
  // TODO : avoid using .meta.type, write a func like typeof() so,
  // even if data shape changes, it can be fixed easily
  const logPath = appLiveData.meta.type === 'function' ? path.resolve('logs/out/functions.log') : appLiveData.log.out

  const ReadLog = (start, end) => {
    const stream = createReadStream(logPath, {
      encoding: 'utf8',
      autoClose: false,
      start,
      end,
    })
    stream.on('data', (d) => console.log(d))
  }

  watchFile(logPath, (currStat, prevStat) => {
    // console.log(currStat)
    // console.log(prevStat)
    ReadLog(prevStat.size, currStat.size)
  })

  // const res = readFileSync(appConfig.getBloxWithLive(bloxname).log.out, (v) => {
  //   console.log(v)
  // })
  // console.log(res)
}

module.exports = log
