/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function isValidBloxName(name) {
  const regex = /^[a-zA-Z-_0-9]+$/
  return regex.test(name)
}

module.exports = { isValidBloxName }
