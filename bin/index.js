#!/usr/bin/env node

const inquirer = require('inquirer')
// const chalk = require('chalk')
const inquirerFileTree = require('inquirer-file-tree-selection-prompt')
const { Command, Option } = require('commander')
// const Spinnies = require('spinnies')
// const chalk = require('chalk')

// UTILS
const customList = require('../utils/customList')

const packageJson = require('../package.json')
const { bloxTypes } = require('../utils/bloxTypes')
const Init = require('../subcommands/init')
// const { isGitInstalled, isInGitRepository } = require('../utils/gitCheckUtils')
// const { ensureUserLogins } = require('../utils/ensureUserLogins')

const log = require('../subcommands/log')
const start = require('../subcommands/start')
// const { checkLogDirs } = require('../utils/preActionMethods/preAction-start')
const ls = require('../subcommands/ls')
const flush = require('../subcommands/flush')
const push = require('../subcommands/push')
const stop = require('../subcommands/stop')
const create = require('../subcommands/create')
// const BloxValidationRunner = require('../utils/bloxValidationRunner')
const sync = require('../subcommands/sync')
const pull = require('../subcommands/pull')
const push_config = require('../subcommands/push_config')
const exec = require('../subcommands/exec')
// const test = require('../subcommands/test')
const checkAndSetGitConnectionPreference = require('../utils/checkAndSetGitConnectionStrategy')
const pullAppblox = require('../utils/pullAppblox')
const addTags = require('../subcommands/addTags')
const addCategories = require('../subcommands/addCategories')
const { preActionChecks } = require('../utils/preActionRunner')
const publish = require('../subcommands/publish')

inquirer.registerPrompt('file-tree-selection', inquirerFileTree)
inquirer.registerPrompt('customList', customList)
process.global = { cwd: process.cwd() }
// let pathToENV = path.resolve('./.env')
// let pathToJSON = path.resolve('./appblox.config.json')
// let APPCONFIG

async function init() {
  // const spinnies = new Spinnies()
  const program = new Command().hook('preAction', async (_, actionCommand) => {
    const subcommand = actionCommand.parent.args[0]
    await preActionChecks(subcommand)
    await checkAndSetGitConnectionPreference()
  })

  // TODO -- get version properly
  program.version(packageJson.version)

  program.command('connect', 'to connect to service', {
    executableFile: '../subcommands/connect',
  })
  // program.command('logout', 'to logout of appblox', {
  //   executableFile: '../subcommands/logout',
  // })
  program.command('login', 'to login to appblox server', {
    executableFile: '../subcommands/login',
  })

  program
    .command('create')
    .argument('<component>', 'name of component')
    .addOption(
      new Option('-t, --type <component-type>', 'type  of comp').choices(
        bloxTypes.reduce((acc, v) => {
          if (v[0] !== 'appBlox') return acc.concat(v[0])
          return acc
        }, [])
      )
    )
    .description('to create components')
    .action(create)

  program.command('init').argument('<appblox-name>', 'Name of app').description('create an appblox').action(Init)

  program
    .command('log')
    .argument('<blox-name>', 'Name of a running blox')
    .description('Streams the logs of a running blox')
    .action(log)

  program.command('flush').description('To delete log files').action(flush)

  program.command('ls').description('List all running bloxes').action(ls)

  program
    .command('start')
    .argument('[name]', 'Name of blox to start')
    .option('--use-pnpm', 'use pnpm to install dependencies')
    .description('To start one or all bloxes')
    .action(start)

  program
    .command('stop')
    .argument('[name]', 'Name of blox to stop')
    .description('To stop one or all bloxes')
    .action(stop)

  program.command('sync').description('To sync all bloxes').action(sync)

  // program.command('emulate', 'to start blox', {
  //   executableFile: '../subcommands/emulate',
  // })
  // program.command('stop-emulator', 'to start blox', {
  //   executableFile: '../subcommands/stop-emulator',
  // })

  program.command('pull').argument('<component>', 'name of component').action(pull)

  program.command('pull_appblox').argument('<component>', 'name of component').action(pullAppblox)

  program.command('push-config').action(push_config)
  program
    .command('push')
    .argument('[blox name]', 'Name of blox to push')
    .option('-f, --force', 'commit and push all bloxes')
    .option('-m, --message <message>', 'commit message')
    .description('To commit and push bloxes')
    .action(push)

  program
    .command('exec')
    .argument('<command>', 'command to run in quotes.eg:"ls"')
    .option('-in,--inside <bloxes...>', 'inside which blox?')
    .action(exec)

  program.command('mark', 'to create dependencies', {
    executableFile: '../subcommands/mark',
  })

  program
    .command('add-tags')
    .option('-A, --all', 'Add tags to all bloxes')
    .description('blox add tags')
    .action(addTags)

  program
    .command('add-categories')
    .option('-A, --all', 'Add categories to all bloxes')
    .description('blox assign categories to bloxes')
    .action(addCategories)

  program
    .command('publish')
    .argument('<blox-name>', 'Name of blox to publish')
    .description('Publish blox or appblox')
    .action(publish)

  program.parseAsync(process.argv)
}

init()

process.on('SIGINT', () => {
  // console.log('force close --> cleaning up')
})

// process.on('exit', () => console.log(chalk.magenta(`\nExiting gracefully\n`)))
