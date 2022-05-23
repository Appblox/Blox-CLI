const chalk = require('chalk')
const { exec } = require('child_process')
const { configstore } = require('../configstore')
const { readInput } = require('./questionPrompts')

async function checkAndSetGitConnectionPreference() {
  let pref = configstore.get('prefersSsh', '')
  if (pref === '') {
    const p = await getConnectionStrategyPreference()
    if (p === 'SSH') {
      pref = true
      configstore.set('prefersSsh', true)
    } else {
      pref = false
      configstore.set('prefersSsh', false)
    }
  }
  if (pref) {
    try {
      const presentName = configstore.get('githubUserName')
      const sshName = await checkSSH()
      if (sshName === presentName) {
        return true
      }
      console.log(chalk.blueBright(`Please sign into ${sshName}'s account for a seemless developer experience`))
      console.log(`Use ${chalk.blueBright('blox connect github -f')} to restart github login`)
      throw new Error('Key of different user')
    } catch (err) {
      console.log('Something went wrong')
      console.log(err.message)
      return false
    }
  }
  try {
    const gitPat = configstore.get('gitPersonalAccessToken', '')
    if (gitPat === '') {
      await getAndSetGitPat()
    }
  } catch (err) {
    console.log('Something went wrong while dealing with git PAT')
    console.log(err.message)
    return false
  }
  return true
}

async function getConnectionStrategyPreference() {
  const p = await readInput({
    type: 'list',
    name: 'connpref',
    message: 'Which connection do you prefer',
    choices: ['Personnel Access Token', 'SSH'],
  })
  return p
}
async function getAndSetGitPat() {
  const token = await readInput({ message: 'Drop PAT here..', name: 'gitPat' })
  await configstore.set('gitPersonalAccessToken', `${token.trim()}@github.com`)
}
/**
 * TODO -- this is repeated in createRepo
 */
function checkSSH() {
  return new Promise((res, rej) => {
    exec('ssh -T git@github.com', (error, stdout, stderror) => {
      if (error.code < 2) {
        // res(stderror.match(/Hi (\w+)!/)[1])
        res(stderror.match(/(?<=Hi ).*(?=!)/)[0])
      }
      rej(new Error('Failed connection:SSH set up'))
    })
  })
}

module.exports = checkAndSetGitConnectionPreference
