import './dotenv.js'
import http from 'http'
import axios from 'axios'

const { APPBLOX_EMULATOR_URL, APPBLOX_EMULATOR_INITIALISED, FUNCTION_ENV } = process.env

/**
 * Function to get port passed as --port argument flag
 * @returns port value
 */
const getArgPortFlag = () => {
  return process.argv.find((arg) => arg.includes('--port='))?.replace('--port=', '')
}

/**
 * Funciton to get port
 * @param {*} functionName
 * @returns
 */
const getPort = async (functionName) => {
  try {
    // Return FUNCTION_PORT from env if production environment
    if (FUNCTION_ENV === 'APPBLOX_PROD_FUNCTION') return FUNCTION_PORT

    // Get port from argument flag
    const argPortFlag = getArgPortFlag()

    // Return port from flag if port is passed as --port=PortValue argument
    if (argPortFlag) return argPortFlag

    // Check if emulator is initialized else exit app
    if (APPBLOX_EMULATOR_INITIALISED !== 'INIT') {
      console.log('Please start appblox emulator before running blox.')
      process.exit(1)
    }

    // Get and return port from emulator
    console.log('=== Requesting to APPBLOX_EMULATOR_URL to get free port == ')
    const response = await axios.post(`${APPBLOX_EMULATOR_URL}/?functionName=${functionName}`)
    return response.data.port
  } catch (error) {
    console.log('Somthing went wrong')
    console.error(error)
    process.exit(1)
  }
}

/**
 * Run function that will run server for user handler funciton
 * @param {*} handler user request handler
 */
const run = async (handler) => {
  /**
   * Set port
   */
  const handlerFuncitonName = handler.name
  const port = await getPort(handlerFuncitonName)

  /**
   * Simple http server that passes request to handler
   */
  const server = http.createServer(async (req, res, next) => {
    try {
      // pass request data to handler
      console.log(' === Got a server request  ==== ')
      await handler(req, res, next)
    } catch (error) {
      // Handle unhandled error from invoked custom handler
      res.writeHead(500, 'Content-Type', 'application/json')
      const errResponse = {
        message: 'Something went wrong',
        errorMessage: error.message,
        error,
      }
      res.write(JSON.stringify(errResponse))
    } finally {
      // End response
      res.end()
    }
  })

  /**
   * Listen to Sever
   */
  server.listen(parseInt(port, 10), () => {
    console.log(`**** INVOKED FUNCTION ${handlerFuncitonName} **** RUNNING AT ${port}`)
  })
}

export default { run }
