#!/usr/bin/env node

const { transports } = require('winston')
const { configstore } = require('../configstore')
const convertGitSshUrlToHttps = require('./convertGitUrl')
const { BloxPushError } = require('./errors/bloxPushError')
const { GitError } = require('./errors/gitError')
const { ensureReadMeIsPresent, uploadReadMe } = require('./fileAndFolderHelpers')
const { checkAndSetGitConfigNameEmail, gitCommitWithMsg, gitStageAllIn } = require('./gitCheckUtils')
const { GitManager } = require('./gitmanager')
const { logger } = require('./logger')
const { getBloxDetails, updateReadme } = require('./registryUtils')

const start = async ({ bloxName, bloxPath, bloxSource, commitMessage, gitUserName, gitUserEmail }) => {
  try {
    process.send({ failed: false, message: 'Starting to push..' })
    logger.add(new transports.File({ filename: `./pushlogs/${bloxName}.log` }))

    // setup GitManager
    const prefersSsh = configstore.get('prefersSsh')
    const repoUrl = prefersSsh ? bloxSource.ssh : convertGitSshUrlToHttps(bloxSource.ssh)
    const Git = new GitManager(bloxPath, 'Not very imp', repoUrl, prefersSsh)

    // ------------------------------------------ //

    // TODO -- write a wrapper for process.send and reduce code
    const staged = await gitStageAllIn(bloxPath)
    if (staged.length === 0) {
      logger.info('No files to stage')
      throw new BloxPushError(bloxPath, bloxName, 'No Files to Stage', false)
      // process.exit(1)
    }
    process.send({ failed: false, message: 'Staging complete..' })
    logger.info({ stagedFiles: staged })

    // ------------------------------------------ //

    await checkAndSetGitConfigNameEmail(bloxPath, { gitUserEmail, gitUserName })
    logger.info(`Git local config updated with ${gitUserName} & ${gitUserEmail}`)

    // ------------------------------------------ //

    await gitCommitWithMsg(bloxPath, commitMessage)
    process.send({ failed: false, message: 'Commit complete' })

    // ------------------------------------------ //
    const [readmePath] = ensureReadMeIsPresent(bloxPath, bloxName, false)
    if (!readmePath) {
      logger.error('Make sure to add a README.md in your blox before pushing..')
      // process.send('No readme found..')
      throw new BloxPushError(bloxPath, bloxName, 'No readme found..', true)
    }

    // ------------------------------------------ //

    const res = await uploadReadMe(readmePath)
    if (res.status !== 200) {
      logger.error('Something went wrong while uploading readme..refer next entry for error info')
      logger.error(res.error)
      throw new BloxPushError(bloxPath, bloxName, res.error, false)
      // process.exit(1)
    }
    logger.info('Uploaded readme succesfully')
    process.send({ failed: false, message: 'Readme updated...' })

    // ------------------------------------------ //

    process.send({ failed: false, message: 'Pushing..' })
    // await gitPushAllIn(bloxPath)
    await Git.push('main')
    logger.info('Commits pushed succesfully')
    process.send({ failed: false, message: 'Commits pushed..' })

    // ------------------------------------------ //

    let metaData
    try {
      const resp = await getBloxDetails(bloxName)
      if (resp.status === 204) throw new Error(`${bloxName} doesn't exists in blox repository`).message

      const { data } = resp
      if (data.err) {
        // if (data.msg === 'NO RECORD FOUND') {
        //   throw new Error(`${bloxName} doesn't exists in blox repository`)
        // }
        // TODO -- throw a Registry error here
        throw new Error('Something went wrong from our side\n', data.msg).message
      }

      metaData = data.data
    } catch (err) {
      logger.error(`Something went wrong while getting details of blox:${bloxName} -- ${err} `)
      throw new BloxPushError(
        bloxPath,
        bloxName,
        `${err.message || 'Something went wrong'} while getting details of ${bloxName}`,
        false
      )
      // process.exit(1)
    }

    logger.info('Blox details fetched successfully')

    // ------------------------------------------ //

    // TODO -- move JsDoc typedefs to one file
    // console.log(metaData)
    process.send({ failed: false, message: 'Updating registry..' })
    const resp = await updateReadme(metaData.ID, res.key, metaData.IsPublic)
    if (!resp.data?.err) {
      logger.info('Registry updated succesfully')
      process.send({ failed: false, message: 'Updated registry..' })
    }
    // TODO -- catch updateReadme error here and throw as Registry error
    // console.log(resp)
    // ------------------------------------------ //

    process.exit(0)
  } catch (err) {
    if (err instanceof GitError) {
      // if errorCode=0 dont reset
      // if errorCode=1 reset head
      process.send({ failed: true, message: err.message, errorCode: Number(err.resetHead) })
    } else if (err instanceof BloxPushError) {
      logger.info(err.message)
      process.send({ failed: true, message: err.message, errorCode: Number(err.resetHead) })
    } else {
      process.send({ failed: true, message: err.message, errorCode: 0 })
    }
    process.exit(1)
  }
}

process.once('message', (args) => {
  //   console.log(args)
  start(args)
})
