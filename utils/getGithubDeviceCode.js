const axios = require('axios')
const { githubGetDeviceCode, githubClientID } = require('./api')

function getGithubDeviceCode() {
  return axios.post(githubGetDeviceCode, {
    client_id: githubClientID,
    scope: 'repo,read:org',
  })
}

module.exports = getGithubDeviceCode
