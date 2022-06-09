const chalk = require('chalk')
const Table = require('cli-table')
const { appConfig } = require('../utils/appconfigStore')

const ls = async () => {
  await appConfig.init()
  const table = new Table({
    head: ['Blox Name', 'Type', 'PID', 'Port', 'Log', 'Status'].map((v) => chalk.cyanBright(v)),
  })
  for (const blox of appConfig.allBloxNames) {
    const g = appConfig.getBloxWithLive(blox)
    if (appConfig.isLive(blox)) {
      table.push([chalk.whiteBright(blox), g.meta.type, g.pid, g.port, g.log.out, chalk.green('LIVE')])
    } else {
      table.push([chalk.whiteBright(blox), g.meta.type, 'Null', 'Null', '...', chalk.red('OFF')])
    }
  }
  console.log(table.toString())
}

module.exports = ls
