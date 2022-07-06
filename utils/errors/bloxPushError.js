/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
