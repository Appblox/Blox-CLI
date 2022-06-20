/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable */

const getPrefix = jest.fn()
const getBloxName = jest.fn().mockResolvedValue('TODO')
const getBloxType = jest.fn()
const WipeAllConfirmation = jest.fn().mockResolvedValue({ wipeAll: true })

module.exports = {
  getPrefix,
  getBloxName,
  getBloxType,
  WipeAllConfirmation,
}
