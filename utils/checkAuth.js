const { configstore } = require('../configstore')
const { getAppBloxSignedInUser } = require('./getSignedInUser')

/**
 * @typedef returnObject
 * @property {Boolean} redoShieldAuth
 */

/**
 * Checks if Shield auth is valid or needs re auth
 * @returns {returnObject}
 */
async function checkAuth() {
  const redo = { redoShieldAuth: true }
  const noredo = { redoShieldAuth: false }
  const token = configstore.get('appBloxUserToken', '')
  if (token) {
    try {
      const user = await getAppBloxSignedInUser(token)
      if (user.user === configstore.get('appBloxUserName', '')) {
        return noredo
      }
      return redo
    } catch (err) {
      console.log(`Something is wrong with shield\n${err}`)
      return redo
    }
  }
  return redo
}
module.exports = checkAuth
