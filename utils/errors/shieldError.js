/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { AppBloxError } = require('./baseError')

class ShieldError extends AppBloxError {}

module.exports = { ShieldError }
