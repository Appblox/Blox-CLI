const { default: axios } = require('axios')
const { readInput } = require('../utils/questionPrompts')
const { appRegistryAssignTags } = require('../utils/api')
const { getShieldHeader } = require('../utils/getHeaders')
const { spinnies } = require('../loader')
const { appConfig } = require('../utils/appconfigStore')

const addTags = async (options) => {
  appConfig.init()

  const { all } = options
  const { dependencies } = appConfig.getAppConfig()
  const { name: appBloxName, tags: appBloxTags } = appConfig.getAppConfig()

  const appBloxId = await appConfig.getBloxId(appBloxName)

  try {
    const bloxesList = await Promise.all(
      Object.values(dependencies).map(async (depVal) => {
        const {
          meta: { name, tags },
        } = depVal

        const bloxId = await appConfig.getBloxId(name)
        return {
          blox_name: name,
          blox_id: bloxId,
          tags: tags || [],
        }
      })
    )

    bloxesList.unshift({
      blox_name: appBloxName,
      blox_id: appBloxId,
      tags: appBloxTags || [],
    })

    if (!bloxesList.length) {
      spinnies.fail('at', { text: 'No bloxes found' })
      process.exit(1)
    }

    const selectedBloxes = all
      ? bloxesList
      : await readInput({
          name: 'bloxes',
          type: 'checkbox',
          message: 'Select the bloxes',
          choices: bloxesList.map((blox) => ({
            name: blox.blox_name,
            value: {
              blox_name: blox.blox_name,
              blox_id: blox.blox_id,
              tags: blox.tags,
            },
          })),
          validate: (input) => {
            if (!input || input?.length < 1) return `Please select a blox`
            return true
          },
        })

    let isInitial = true

    const tagNames = await readInput({
      name: 'tagNames',
      message: 'Enter the tags ( space seperated )',
      default: appBloxTags?.join(' '),
      validate: (input) => {
        // TODO : Remove once better method is found to set initial values for the input (Like inquirer custom class)
        if (isInitial && input === appBloxTags?.join(' ')) {
          isInitial = false
          return `Edit default tags or press enter to continue ?`
        }

        if (!input || input?.length < 3) return `Tag should containe atleast 3 characters`
        return true
      },
    })
    spinnies.add('at', { text: 'Adding tags' })

    const tagsArray = [...new Set(tagNames.split(' '))]

    const tagsData = tagsArray.reduce((acc, tag) => {
      const tagLists = selectedBloxes.map(({ blox_id }) => ({
        blox_id,
        tag_name: tag,
      }))

      return acc.concat(tagLists)
    }, [])

    selectedBloxes.forEach(({ blox_name, blox_id, tags }) => {
      if (blox_id === appBloxId) {
        appConfig.updateAppBlox({
          tags: [...new Set(tags.concat(tagsArray))],
        })
      } else {
        appConfig.updateBlox(blox_name, {
          tags: [...new Set(tags.concat(tagsArray))],
        })
      }
    })

    await axios.post(
      appRegistryAssignTags,
      { bloxes: tagsData },
      {
        headers: getShieldHeader(),
      }
    )

    spinnies.succeed('at', { text: 'Tags added successfully' })
  } catch (err) {
    spinnies.add('at')
    spinnies.fail('at', { text: err.message })
    console.error(err)
  }
}

module.exports = addTags
