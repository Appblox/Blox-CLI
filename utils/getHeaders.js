const { configstore } = require('../configstore')

const getShieldHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${configstore.get('appBloxUserToken')}`,
})
const getGitHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `bearer ${configstore.get('githubUserToken')}`,
  Accept: 'application/vnd.github.v4+json',
})

const getGitRestHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${configstore.get('githubUserToken')}`,
  Accept: 'application/vnd.github.v3+json',
})

module.exports = { getGitHeader, getShieldHeader, getGitRestHeaders }
