#!/usr/bin/env node

const { Command } = require('commander')
const { readFileSync } = require('fs')
const chalk = require('chalk')
const axios = require('axios')
const { getBloxDetails } = require('../utils/registryUtils')
const { ensureUserLogins } = require('../utils/ensureUserLogins')
const { appBloxAddBloxMapping } = require('../utils/api')
const { spinner } = require('../loader')
const { getShieldHeader } = require('../utils/getHeaders')

const program = new Command()

program
  .option('-d,--dependency <bloxes...>', 'Create dependency')
  .option('-c,--composability <bloxes...>', 'Create composability')

const mark = async (args) => {
  program.parse(args)
  const { dependency, composability } = program.opts()
  // console.log(dependency, composability)

  spinner.start('Starting..')
  let bloxOne
  let bloxTwo
  let relationType

  if (dependency) {
    if (dependency.length > 2) {
      console.log(chalk.italic.dim('Only the first two bloxes will be used.'))
    }

    relationType = 1
    ;[bloxOne, bloxTwo] = dependency
  } else if (composability) {
    if (composability.length > 2) {
      console.log(chalk.italic.dim('Only the first two bloxes will be used.'))
    }

    relationType = 2
    ;[bloxOne, bloxTwo] = composability
  } else {
    console.log('\nNo option provided')
    console.log(`Use ${chalk.italic.dim('--dependency')} or ${chalk.italic.dim('--composability')} `)
    console.log(`\nUse ${chalk.italic.dim('blox mark --help')} to learn to use mark command`)

    process.exit(0)
  }

  // console.log(bloxOne, bloxTwo, relationType)
  let appConfig

  spinner.start('Checking auths..')
  await ensureUserLogins()
  try {
    appConfig = JSON.parse(readFileSync('appblox.config.json'))
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(chalk.red(`appblox.config.json missing`))
      process.exit(1)
    }
    console.log('Something went wrong\n')
    console.log(err)
    process.exit(1)
  }
  const appblox = appConfig.name
  const { dependencies } = appConfig
  if (dependencies) {
    if (!dependencies[bloxOne]) {
      console.log(`Can't find ${bloxOne} in ${appblox}'s depenedencies..`)
      process.exit(1)
    }
    if (!dependencies[bloxTwo]) {
      console.log(`Can't find ${bloxTwo} in ${appblox}'s depenedencies..`)
      process.exit(1)
    }
  }

  const bloxNames = [bloxOne, bloxTwo, appblox]
  const bloxMetaDatas = {}

  await Promise.all(bloxNames.map((v) => getBloxDetails(v)))
    .then((values) => {
      values.forEach((v, i) => {
        if (v.status === 204) {
          console.log(`\n ${chalk.whiteBright(bloxNames(i))} doesn't exist in blox repository!`)
          process.exit(1)
        } else {
          if (v.data.err) {
            console.log(v.data.msg)
            process.exit(1)
          }
          bloxMetaDatas[bloxNames[i]] = v.data.data
        }
      })

      // console.log(bloxMetaDatas)
    })
    .catch((err) => console.log(err))
  // console.log('bloxone type', bloxMetaDatas[bloxOne].BloxType)
  // console.log('bloxtwo type', bloxMetaDatas[bloxTwo].BloxType)

  let isAPI = false
  if ([4, 6].includes(bloxMetaDatas[bloxOne].BloxType) || [4, 6].includes(bloxMetaDatas[bloxTwo].BloxType)) {
    // console.log('one in fn')
    if ([2, 3].includes(bloxMetaDatas[bloxOne].BloxType) || [2, 3].includes(bloxMetaDatas[bloxTwo].BloxType)) {
      // console.log('one in ui as well')
      isAPI = true
    }
  }

  const data = {
    blox_id: bloxMetaDatas[bloxOne].ID,
    related_blox_id: bloxMetaDatas[bloxTwo].ID,
    app_blox_id: bloxMetaDatas[appblox].ID,
    is_api: isAPI,
    relation_type: relationType,
  }

  // console.log(data)
  const headers = getShieldHeader()
  spinner.start('Connecting to registry')
  try {
    const resp = await axios.post(appBloxAddBloxMapping, { ...data }, { headers })
    if (resp.data.err) {
      console.log(`\n Somthing went wrong at our end\n`)
      console.log(resp.data.msg)
    } else {
      spinner.succeed('done')
      console.log(chalk.green('Successfully mapped..'))
    }
  } catch (err) {
    console.log('Something went south while creating blox mapping')
    console.log(err.message)
  }
}
// To avoid calling push twice on tests
if (process.env.NODE_ENV !== 'test') mark(process.argv)
