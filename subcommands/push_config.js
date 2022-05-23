const { default: axios } = require('axios')
const chalk = require('chalk')
const { appBloxUpdateAppConfig } = require('../utils/api')
const { appConfig } = require('../utils/appconfigStore')
const { getShieldHeader } = require('../utils/getHeaders')
const { getBloxDetails } = require('../utils/registryUtils')

const push_config = async () => {
  appConfig.init()
  const name = appConfig.getName()
  // TODO - write a utility function wrapping getBloxDetails, should be able to call getBloxID
  const ID = await getBloxDetails(name)
    .then((res) => {
      if (res.status === 204) {
        console.log(`${name} not found in registry.`)
        process.exit(1)
      }
      if (res.data.err) {
        console.log(`Error getting details..`)
        process.exit(1)
      }
      // Make sure it is registered as appBlox, else unregistered
      if (res.data.data.BloxType !== 1) {
        console.log(`${name} is not registered as appblox`)
        process.exit(1)
      }
      // eslint-disable-next-line no-param-reassign
      return res.data.data.ID
    })
    .catch(() => {
      console.log('Something went terribly wrong...')
      process.exit(1)
    })

  const data = {
    blox_id: ID,
    app_config: appConfig.getAppConfig(),
  }
  const headers = getShieldHeader()
  try {
    const appconfig = await axios.post(appBloxUpdateAppConfig, { ...data }, { headers })
    console.log(appconfig)
    console.log('DONE')
  } catch (err) {
    console.log(chalk.dim(err.message))
    console.log(chalk.red(`Couldn't upload ..try again later`))
  }
}

module.exports = push_config
