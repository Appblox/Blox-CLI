const { default: axios } = require('axios')
const { appRegistryAssignCategories } = require('../utils/api')
const { getShieldHeader } = require('../utils/getHeaders')
const { readInput } = require('../utils/questionPrompts')
const { spinnies } = require('../loader')
const { appConfig } = require('../utils/appconfigStore')
const { getCategories } = require('../utils/categoriesUtil')

const addCategories = async (options) => {
  try {
    appConfig.init()

    const { all } = options
    const { dependencies } = appConfig.getAppConfig()
    const { name: appBloxName, categories: appBloxCategories } = appConfig.getAppConfig()

    const appBloxId = await appConfig.getBloxId(appBloxName)

    const bloxesList = await Promise.all(
      Object.values(dependencies).map(async (depVal) => {
        const {
          meta: { name, categories },
        } = depVal

        const bloxId = await appConfig.getBloxId(name)
        return {
          blox_name: name,
          blox_id: bloxId,
          categories: categories || [],
        }
      })
    )

    bloxesList.unshift({
      blox_name: appBloxName,
      blox_id: appBloxId,
      categories: appBloxCategories || [],
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
              categories: blox.categories,
            },
          })),
          validate: (input) => {
            if (!input || input?.length < 1) return `Please select a blox`
            return true
          },
        })

    const categoriesList = await getCategories()

    const categoryIds = await readInput({
      type: 'customSelect',
      name: 'categoryIds',
      message: 'Select the categories',
      customChoices: categoriesList,
      validate: (input) => {
        if (!input || input?.length < 1) return `Please select a category`
        return true
      },
      getSubChoice: async (value) => {
        const cL = await getCategories(value)
        return cL
      },
      customDefaultChoices: [],
    })

    spinnies.add('at', { text: 'Adding categories ' })

    const categoriesData = selectedBloxes.reduce((acc, { blox_id }) => {
      const categoryLists = categoryIds.map((categoryId) => ({
        blox_id,
        category_id: categoryId,
      }))

      return acc.concat(categoryLists)
    }, [])

    const addCategoriesRes = await axios.post(
      appRegistryAssignCategories,
      { bloxes: categoriesData },
      {
        headers: getShieldHeader(),
      }
    )

    const { data } = addCategoriesRes.data

    await Promise.all[
      selectedBloxes.forEach(async ({ blox_name, blox_id }) => {
        const updateCategoriesValue = data[blox_id]?.split(',')
        if (blox_id === appBloxId) {
          appConfig.updateAppBlox({ categories: updateCategoriesValue })
        } else {
          await appConfig.updateBlox(blox_name, { categories: updateCategoriesValue })
        }
      })
    ]

    spinnies.succeed('at', { text: 'Categories added successfully' })
  } catch (err) {
    spinnies.add('at')
    spinnies.fail('at', { text: err.message })
    console.error(err)
  }
}

module.exports = addCategories
