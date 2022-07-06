/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */
const axios = require('axios')
const Spinnies = require('spinnies')
const { appBloxRegister } = require('./api')
const { getShieldHeader } = require('./getHeaders')

/**
 *
 * @param {Number} blox_type 1 or 2 or 3
 * @param {String} blox_name Long name of blox
 * @param {String} blox_short_name Preferred short name of blox
 * @param {Boolean} is_public Visibility of repo
 * @param {String} github_url Github repo url
 * @param {String} blox_desc Description same as github repo description
 */
// eslint-disable-next-line consistent-return
async function registerBlox(blox_type, blox_name, blox_short_name, is_public, github_url, blox_desc) {
  // ASK -- about short name flow
  // ASK -- isPublic flow? default false and an option in command..
  //     -- should it be always public in github?

  // console.log(process.env.NODE_ENV);
  //   console.log(blox_type, blox_name, blox_short_name, blox_desc, github_url)
  const spinnies = new Spinnies()

  spinnies.add('register', { text: `Registering ${blox_name}` })

  try {
    const headers = getShieldHeader()
    const res = await axios.post(
      appBloxRegister,
      {
        blox_type,
        blox_name,
        blox_short_name,
        is_public,
        blox_desc,
        github_url,
      },
      {
        headers,
      }
    )

    spinnies.succeed('register', { text: `${blox_name} registered successfully` })
    spinnies.remove('register')
    // console.log('Blox registered succesfully')
    // console.log(res.data)
    return res.data
  } catch (err) {
    spinnies.fail('register', { text: `${blox_name} registeration failed` })
    spinnies.remove('register')
    console.log(err)
    console.log('Something went wrong! in registerblox')
  }
}

module.exports = registerBlox
