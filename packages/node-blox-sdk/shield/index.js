import axios from 'axios'
import shieldConfig from '../config/shield.js'

const { SHIELD_URL } = shieldConfig

/**
 * Funciton to get port
 * @param {Request} req
 * @param {String} url
 * @returns
 */
const callShieldServer = async (req, url) => {
  try {
    // Get blox config from global
    const { clientId, clientSecret } = global.BloxConfig

    // Get bear token from req header
    const bearToken = req.headers['authorization']

    const headers = {
      Accept: 'application/json',
      Authorization: bearToken,
      'Content-Type': 'application/json',
      'Client-Id': clientId,
      'Client-Secret': clientSecret,
    }

    const response = await axios.post(url, {}, { headers })
    return response.data.data
  } catch (error) {
    console.error('==========Somthing went wrong =======\n')
    throw error
  }
}

/**
 * Function that gets user details from shield.
 * @param {Request} req http request
 * @return {Object | Error} user details /Error
 */
const getUser = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const userDetails = await callShieldServer(req, `${SHIELD_URL}/get-user`)
      return resolve(userDetails)
    } catch (error) {
      return reject(error.message || error)
    }
  })
}

/**
 * Function that gets user UID from shield.
 * @param {Request} req http request
 * @return {String | Error} user id / error
 */
const getUID = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const userIdRes = await callShieldServer(req, `${SHIELD_URL}/get-uid`)
      return resolve(userIdRes.user_id)
    } catch (error) {
      return reject(error.message || error)
    }
  })
}

export default { getUID, getUser }
