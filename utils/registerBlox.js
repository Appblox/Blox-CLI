/* eslint-disable camelcase */
const axios = require('axios')
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

    console.log('Blox registered succesfully')
    // console.log(res.data)
    return res.data
  } catch (err) {
    console.log(err)
    console.log('Something went wrong! in registerblox')
  }
}

module.exports = registerBlox
