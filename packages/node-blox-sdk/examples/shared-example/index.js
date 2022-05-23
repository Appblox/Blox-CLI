import { shared, functions } from '../../index.js'

// Simple test request handler
const requestHandler = async (req, res, next) => {
  /**
   * This sdk function will read export data from shared folder index inside function folder
   * (for testing, it also reads shared folder in relative path)
   */
  const sharedData = await shared.getShared()

  res.writeHead(200, 'Content-Type', 'application/json')
  res.write(JSON.stringify({ message: 'sample request handler', sharedData }))
  return 'sample request handler'
}

// Run the function handler
functions.run(requestHandler)
