/* eslint-disable no-unused-expressions */
const axios = require('axios')
const { checkAndSetAuth } = require('./checkAndSetAuth')
const { githubGetDeviceCode, githubClientID } = require('./api')
const handleGithubAuth = require('./handleGithubAuth')
const checkAuth = require('./checkAuth')
const { loginWithAppBlox } = require('../auth')
const { getAppBloxSignedInUser } = require('./getSignedInUser')
const { configstore } = require('../configstore')

async function ensureUserLogins(spinnies, name) {
  // await login()
  spinnies?.update(name, { text: 'Checking Git auths' })
  const { redoAuth } = await checkAndSetAuth()
  if (redoAuth) {
    spinnies.update(name, {
      text: 'Git not logged in',
      status: 'stopped',
      color: 'yellow',
    })

    const response = await axios.post(githubGetDeviceCode, {
      client_id: githubClientID,
      scope: 'repo,read:org',
    })
    await handleGithubAuth(decodeURIComponent(response.data))
  }

  spinnies?.add(name, { text: 'Git auth done' })

  const { redoShieldAuth } = await checkAuth()
  if (redoShieldAuth) {
    spinnies?.update(name, {
      text: 'Shield not logged in',
      status: 'stopped',
      color: 'yellow',
    })
    const { data } = await loginWithAppBlox(true)
    configstore.set('appBloxUserToken', data.access_token)
    const user = await getAppBloxSignedInUser(data.access_token)
    configstore.set('appBloxUserName', user.user)
  }
  spinnies?.add(name, { text: 'Shield auth done' })
}
module.exports = { ensureUserLogins }
