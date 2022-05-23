const { AppBloxError } = require('./baseError')

class GitError extends AppBloxError {
  constructor(path, message, resetHead, operation, options) {
    super(message)
    this.operation = operation
    this.options = options
    this.gitDirPath = path
    this.resetHead = resetHead
  }
}

module.exports = { GitError }
