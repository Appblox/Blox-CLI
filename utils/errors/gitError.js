/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
