const { configstore } = require('../configstore')
const { getGithubSignedInUser } = require('./getSignedInUser')

async function checkAndSetAuth() {
  const token = configstore.get('githubUserToken', '')
  if (token) {
    const { user } = await getGithubSignedInUser(token)
    const name = configstore.get('githubUserName')
    const id = configstore.get('githubUserId')

    if (name === user?.userName && id === user?.userId) {
      return { redoAuth: false }
    }
    // in else case inform user that stored name and id
    // doesn't match the token.
    // TODO
  }
  return { redoAuth: true }
}

module.exports = { checkAndSetAuth }
