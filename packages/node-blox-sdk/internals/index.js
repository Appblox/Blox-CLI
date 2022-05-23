/**
 * Initializes the blox config data
 * @param {*} config
 */
const initialize = (config) => {
  if (config == null) {
    return console.error('Appblox intitialiation failed! No config passed')
  }
  if (config.clientId && config.clientSecret) {
    global.BloxConfig = config
    return console.log('Blox initialized')
  }
  console.error('Appblox intitialiation failed! Invalid config passed')
  process.exit(1)
}

export default { initialize }
