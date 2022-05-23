const { AppBloxError } = require('./baseError')

class BloxPushError extends AppBloxError {
  constructor(path, blox, message, resetHead) {
    super(`${message} in ${path}`)
    this.bloxPath = path
    this.bloxName = blox
    this.resetHead = resetHead
  }
}

module.exports = { BloxPushError }
