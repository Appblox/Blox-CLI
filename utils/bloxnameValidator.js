function isValidBloxName(name) {
  const regex = /^[a-zA-Z-_0-9]+$/
  return regex.test(name)
}

module.exports = { isValidBloxName }
