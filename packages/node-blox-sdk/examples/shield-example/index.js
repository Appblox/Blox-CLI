import { functions, shield, internals } from '../../index.js'

import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve() + '.env' })

// Initializes sdk with credentials
internals.initialize({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
})

// Hanlde that uses shield getUser method
const hanldeGetUserDetails = async (req, res, next) => {
  try {
    // Get user details using shield
    const userDetails = await shield.getUser(req)
    sendResponse(res, 200, 'Success', userDetails)
  } catch (error) {
    sendResponse(res, 400, 'Failed', { error })
  }
}

// Hanlde that uses shield getUID method
const handleGetUserId = async (req, res, next) => {
  try {
    // Get user uid using shield
    const userUID = await shield.getUID(req)
    sendResponse(res, 200, 'Success', { userUID })
  } catch (error) {
    sendResponse(res, 400, 'Failed', { error })
  }
}

// Simple handler that uses shield methods
const shieldHandler = async (req, res, next) => {
  try {
    // Path to get user details
    if (req.url === '/get-user-details') {
      await hanldeGetUserDetails(req, res, next)
    }
    // Path to get user uid
    else if (req.url === '/get-user-uid') {
      await handleGetUserId(req, res, next)
    }
    // Not specified path
    else {
      sendResponse(res, 404, 'Path not found', {})
    }
  } catch (error) {
    sendResponse(res, 400, 'Failed', { error })
  }
}

// Helper funtion to send response
const sendResponse = (res, code, message, data) => {
  res.writeHead(code, 'Content-Type', 'application/json')
  res.write(JSON.stringify({ success: code >= 400 ? false : true, message, data }))
  res.end()
}

// Run the function handler
functions.run(shieldHandler)
