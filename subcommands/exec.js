/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const chalk = require('chalk')
const { exec } = require('child_process')
const { appConfig } = require('../utils/appconfigStore')

function pexec(cmd, options, name) {
  return new Promise((resolve) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        resolve({ name, out: stderr.toString() })
        return
      }
      resolve({ name, out: stdout.toString() })
    })
  })
}
const appbloxexec = async (command, options) => {
  // const supportedCommands = ['git', 'ls', 'l']
  // const supportedArguments = { git: ['clone', 'pull', 'branch', 'push', 'fetch', 'status'], ls: ['-a'], l: ['-a'] }
  // const [cmd, args] = command.split(' ')
  // if (supportedCommands.findIndex((v) => v === cmd) === -1) {
  //   console.log(`Command ${chalk.whiteBright(cmd)} not supported..`)
  //   process.exit(1)
  // }
  // if (args && supportedArguments[cmd].findIndex((v) => v === args) === -1) {
  //   console.log(`Command argument ${chalk.whiteBright(args)} is not supported`)
  //   console.log(`Supported arguments for command ${chalk.whiteBright(cmd)} are:`)
  //   supportedArguments[cmd].forEach((v) => console.log(`- ${v}`))
  //   console.log('\n')
  //   process.exit(-1)
  // }
  await appConfig.init()
  const bloxes = options.inside || []
  const missingBloxes = []
  const promiseArray = []
  if (bloxes.length === 0) {
    console.log(chalk.cyan(`No bloxe names given, trying to run ${command} in all bloxes..`))
    for (const bloxname of appConfig.allBloxNames) {
      bloxes.push(bloxname)
    }
  }
  if (bloxes.length === 0) {
    console.log(chalk.red('No bloxes found...'))
  } else {
    console.log(chalk.cyan('Running command in :'))
    console.log(chalk.dim(bloxes))
    console.log('\n')
  }
  for (let i = 0; i < bloxes.length; i += 1) {
    const bloxName = bloxes[i]
    if (appConfig.has(bloxName)) {
      promiseArray.push(pexec(command, { cwd: appConfig.getBlox(bloxName).directory }, bloxName))
    } else {
      missingBloxes.push(bloxName)
    }
  }
  Promise.allSettled(promiseArray).then((res) => {
    if (missingBloxes.length !== 0) {
      console.log('\n')
      console.log(`${chalk.red(`Couldn't find following bloxes..`)}`)
      missingBloxes.forEach((v) => console.log(chalk.dim(v)))
      console.log('\n')
    }
    res.forEach((v) => {
      const colour = v.status === 'fulfilled' ? chalk.green : chalk.red
      console.log(colour(v.value.name))
      console.log(v.value.out)
      console.log('\n')
    })
  })
}

module.exports = appbloxexec
