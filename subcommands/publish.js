/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { default: axios } = require('axios')
const semver = require('semver')
const Spinnies = require('spinnies')
const { configstore } = require('../configstore')
const { appBloxAddVersion } = require('../utils/api')
const { appConfig } = require('../utils/appconfigStore')
const convertGitSshUrlToHttps = require('../utils/convertGitUrl')
const { getShieldHeader } = require('../utils/getHeaders')
const { isClean, getLatestVersion, addTag } = require('../utils/gitCheckUtils')
const { GitManager } = require('../utils/gitmanager')
const { readInput } = require('../utils/questionPrompts')

const publish = async (bloxname) => {
  appConfig.init()
  const spinnies = new Spinnies()

  if (!appConfig.has(bloxname)) {
    console.log('Blox not found!')
    process.exit(1)
  }
  if (appConfig.isLive(bloxname)) {
    console.log('Blox is live, please stop before operation')
    process.exit(1)
  }
  // TODO - Check if there are any .sync files in the blox and warn
  const bloxDetails = appConfig.getBlox(bloxname)

  try {
    if (!isClean(bloxDetails.directory)) {
      console.log('Git directory is not clean, Please push before publish')
      process.exit(1)
    }

    const latestVersion = getLatestVersion(bloxDetails.directory)
    if (latestVersion) console.log(`Last published version is ${latestVersion}`)

    const version = await readInput({
      name: 'version',
      message: 'Enter the version',
      validate: (ans) => {
        if (semver.valid(ans)) {
          if (latestVersion && semver.lt(semver.clean(ans), semver.clean(latestVersion))) {
            return `Last published version is ${latestVersion}`
          }
          return true
        }
        return 'Invalid versioning'
      },
      default: latestVersion ? semver.inc(latestVersion) : '0.0.1',
    })

    const message = await readInput({
      name: 'tagMessage',
      message: 'Enter a message to add to tag.(defaults to empty)',
    })

    spinnies.add('p1', { text: `Publishing new version ${version}` })

    await addTag(bloxDetails.directory, version, message)

    const bloxSource = bloxDetails.meta.source
    const prefersSsh = configstore.get('prefersSsh')
    const repoUrl = prefersSsh ? bloxSource.ssh : convertGitSshUrlToHttps(bloxSource.ssh)
    const Git = new GitManager(bloxDetails.directory, 'Not very imp', repoUrl, prefersSsh)
    // await pushTags(bloxDetails.directory)
    await Git.pushTags()
    const bloxid = await appConfig.getBloxId(bloxname)

    const headers = getShieldHeader()
    const resp = await axios.post(
      appBloxAddVersion,
      {
        blox_id: bloxid,
        version_no: semver.parse(version).version,
        is_release: true,
        release_notes: message,
      },
      { headers }
    )

    const { data } = resp
    if (data.err) {
      throw new Error('Something went wrong from our side\n', data.msg).message
    }
    // const res = data.data
    spinnies.succeed('p1', { text: 'Success' })
  } catch (error) {
    spinnies.add('p1', { text: 'Error' })
    spinnies.fail('p1', { text: error.message })
    process.exit(1)
  }
}

const getPublishedVersion = (name, directory) => {
  try {
    if (!isClean(directory))
      return {
        success: false,
        msg: `Has uncommitted changes -> directory ${directory} `,
      }
    const latestVersion = getLatestVersion(directory)
    return { success: true, latestVersion }
  } catch (error) {
    return { success: false, msg: `${error.message} -> blox ${name} ` }
  }
}

module.exports = publish
const myExport = module.exports
myExport.getPublishedVersion = getPublishedVersion
