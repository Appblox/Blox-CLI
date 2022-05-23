import { run, env } from '../../index.js'

/**
 * Initalize env
 * currently gets the env.functions for functions modules
 * or gets the env.view inside view modules
 * or .env
 */
env.init()

// Simple test request handler
const requestHandler = (req, res, next) => {
  // can access envs
  const envs = process.env

  res.writeHead(200, 'Content-Type', 'application/json')
  res.write(JSON.stringify({ message: 'sample request handler', envs }))
  return 'sample request handler'
}

// Run the function handler
run(requestHandler)
