/**
 * Takes string and returns object
 * @param {String} data URI encoded query string
 * @returns An object with key and values parsed from string
 */
function parseUriEncodedQueryString(data) {
  return data.split('&').reduce((acc, v) => {
    const [k, val] = v.split('=')
    acc[k] = val
    return acc
  }, {})
}

module.exports = parseUriEncodedQueryString
