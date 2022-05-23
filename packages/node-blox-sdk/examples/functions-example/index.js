import { functions } from '../../index.js'

// Simple test request handler
const requestHandler = (req, res, next) => {
  res.writeHead(200, 'Content-Type', 'application/json')
  res.write(JSON.stringify({ message: 'sample request handler' }))
  return 'sample request handler'
}

// Run the function handler
functions.run(requestHandler)
