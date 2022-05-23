/**
 * Converts git@github.com:<username>/<repo-name>.git ->
 * https://github.com/<username>/<repo-name>.git
 * @param {String} url Git SSH url
 * @returns {String} Https git url
 */
function convertGitSshUrlToHttps(url) {
  return `https://github.com/${url.split(':')[1]}`
}

module.exports = convertGitSshUrlToHttps
