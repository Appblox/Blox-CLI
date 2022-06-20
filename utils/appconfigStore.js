/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { AppbloxConfigManager } = require('./appconfig-manager')

const config = new AppbloxConfigManager()

module.exports = { appConfig: config }
