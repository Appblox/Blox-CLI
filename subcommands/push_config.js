const { default: axios } = require('axios')
const chalk = require('chalk')
const Spinnies = require('spinnies')
const { appBloxUpdateAppConfig } = require('../utils/api')
const { appConfig } = require('../utils/appconfigStore')
const { getShieldHeader } = require('../utils/getHeaders')
const { getBloxDetails } = require('../utils/registryUtils')

const push_config = async () => {
  await appConfig.init()

  const spinnies = new Spinnies()

  const name = appConfig.getName()

  spinnies.add('pushConfig', { text: `Getting details of ${name}` })

  // TODO - write a utility function wrapping getBloxDetails, should be able to call getBloxID
  const ID = await getBloxDetails(name)
    .then((res) => {
      if (res.status === 204) {
        spinnies.fail('pushConfig', { text: `${name} not found in registry.` })
        process.exit(1)
      }
      if (res.data.err) {
        spinnies.fail('pushConfig', { text: `Error getting details from registry.` })
        process.exit(1)
      }
      // Make sure it is registered as appBlox, else unregistered
      if (res.data.data.BloxType !== 1) {
        spinnies.fail('pushConfig', { text: `${name} is not registered as appblox` })
        process.exit(1)
      }
      // eslint-disable-next-line no-param-reassign
      return res.data.data.ID
    })
    .catch((err) => {
      spinnies.fail('pushConfig', { text: `Something went terribly wrong...` })
      console.log(err)
      process.exit(1)
    })

  spinnies.update('pushConfig', { text: 'Preparing config to upload' })
  const data = {
    blox_id: ID,
    app_config: appConfig.getAppConfig(),
  }
  const headers = getShieldHeader()
  spinnies.update('pushConfig', { text: 'Pushing..' })
  try {
    await axios.post(appBloxUpdateAppConfig, { ...data }, { headers })
    spinnies.succeed('pushConfig', { text: 'Appconfig pushed!' })
  } catch (err) {
    spinnies.fail('pushConfig', { text: 'Failed!' })
    console.log(chalk.dim(err.message))
    console.log(chalk.red(`Couldn't upload ..try again later`))
  }
  spinnies.remove('pushConfig')
}

module.exports = push_config
