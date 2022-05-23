#!/usr/bin/env node
const chalk = require('chalk')
const { Command } = require('commander')
const { loginWithAppBlox } = require('../auth')
const { configstore } = require('../configstore')
const { getAppBloxSignedInUser } = require('../utils/getSignedInUser')

const program = new Command()

program.option(' --no-localhost', 'copy and paste a code instead of starting a local server for authentication')

const login = async (args) => {
  program.parse(args)
  // const args = program.args;

  // Check if already logged in to shield
  const presentTOKEN = configstore.get('appBloxUserToken', '')

  if (presentTOKEN) {
    const user = await getAppBloxSignedInUser(presentTOKEN)
    if (user.user === configstore.get('appBloxUserName', '')) {
      console.log(`Already signed in as ${user.user}`)
      return
    }
  }
  const { localhost } = program.opts()
  const { data } = await loginWithAppBlox(localhost)
  configstore.set('appBloxUserToken', data.access_token)
  const user = await getAppBloxSignedInUser(data.access_token)
  configstore.set('appBloxUserName', user.user)

  console.log(chalk.green(`Successfully logged in as ${user.user}`))
  // console.log(user)
}

// To avoid calling create twice on tests
if (process.env.NODE_ENV !== 'test') login(process.argv)

// module.exports = login
