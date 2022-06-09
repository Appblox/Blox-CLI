const chalk = require('chalk')
const { getCommitMessage, getGitConfigNameEmail } = require('../utils/questionPrompts')
const { pushBloxes } = require('../utils/pushBloxes')
const { appConfig } = require('../utils/appconfigStore')

const push = async (bloxname, options) => {
  const { force } = options
  let { message } = options

  await appConfig.init()

  if (!force && !bloxname) {
    console.log(chalk.red(`\nPlease provide a blox name or use -f to push all..`))
    process.exit(1)
  }

  if (!force && !appConfig.has(bloxname)) {
    console.log(chalk.red(`${chalk.italic(bloxname)} not found in dependencies`))
    console.log(`List of present bloxes:\n${chalk.gray(...appConfig.allBloxNames)}`)
    process.exit(1)
  }

  if (!message) {
    message = await getCommitMessage()
  }

  console.log('Please enter git username and email')
  console.log(
    chalk.dim.italic(`If i can't find name and email in global git config,\nI'll use these values on making commits..`)
  )
  // TODO-- store these values in config and dont ask everytime, can be used in pull aswell
  const { gitUserName, gitUserEmail } = await getGitConfigNameEmail()

  const bloxesToPush = force ? [...appConfig.dependencies] : [appConfig.getBlox(bloxname)]

  // console.log(bloxesToPush)

  console.log('\n')
  try {
    await pushBloxes(gitUserName, gitUserEmail, message, bloxesToPush)
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

module.exports = push
