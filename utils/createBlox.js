/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const chalk = require('chalk')
// const { execSync } = require('child_process')
const { readFileSync, writeFileSync } = require('fs')
const path = require('path')
const { configstore } = require('../configstore')
const { bloxTypeInverter } = require('./bloxTypeInverter')
const convertGitSshUrlToHttps = require('./convertGitUrl')
const createComponent = require('./createComponent')
const { createDirForType } = require('./fileAndFolderHelpers')
const { GitManager } = require('./gitmanager')
// const { tryGitInit } = require('./gitCheckUtils')
const { getGitConfigNameEmail } = require('./questionPrompts')
const registerBlox = require('./registerBlox')

/**
 * @typedef returnObject
 * @type {Object}
 * @property {bloxSource} bloxSource URL to repository
 * @property {String} cloneDirName Name of the local cloned directory,(_prefix_bloxname)
 * @property {String} clonePath Path to local cloned directory
 * @property {String} bloxFinalName Name of the directory created in source control
 */

/**
 *
 * @param {String} bloxName Name of blox to be created
 * @param {String} bloxShortName Name of blox to be created
 * @param {Number} bloxTypeNo Type number of blox
 * @param {String} createFromExistinURL If a source is provided, a new repo is created from the source IMP:always should be ssh url
 * @param {Boolean} callingFromPullNoCreateNewRefactorMelater To stop halfway and return cloned directory path
 * @param {String} cwd To pass to directory creation function
 * @param {String} isAStandAloneBlox If user is trying to create a blox outside appblox context
 * @returns {returnObject}
 */
async function createBlox(
  bloxName,
  bloxShortName,
  bloxTypeNo,
  createFromExistinURL,
  callingFromPullNoCreateNewRefactorMelater,
  cwd,
  isAStandAloneBlox = false
) {
  if (arguments.length < 6) throw new Error('NotEnoughArguments in CreateBlox')

  /**
   * PREFIX IS NO LONGER NECESSARY
   * 
  const presentPrefix = appConfig.prefix
  if (!presentPrefix && bloxTypeNo > 1) {
    // If we are here from init, then appblox.config.json would not have been
    // created yet, so trying to set will cause problem,
    // to avoid that prompt only if bloxType is other than 1 i.e 'appBlox'
    const prefix = await getPrefix(appConfig.getName())
    appConfig.prefix = prefix
  }
  *
  */

  // if (!tryGitInit()) {
  //   throw new Error('Git not initialized')
  // }

  const clonePath = isAStandAloneBlox ? '.' : createDirForType(bloxTypeNo, cwd || '.')
  // console.log('clone path return from createDirForType', clonePath)
  if (callingFromPullNoCreateNewRefactorMelater) {
    return { clonePath }
  }

  const {
    description,
    visibility,
    url,
    sshUrl,
    name: cloneDirName,
    bloxFinalName,
  } = await createComponent(bloxShortName, createFromExistinURL, clonePath)

  if (createFromExistinURL) {
    try {
      // git username try
      const prefersSsh = configstore.get('prefersSsh')
      const parentRepoUrl = prefersSsh ? createFromExistinURL : convertGitSshUrlToHttps(createFromExistinURL)
      const sourceUrl = prefersSsh ? sshUrl : url
      const Git = new GitManager(`${clonePath}/${cloneDirName}`, cloneDirName, sourceUrl, prefersSsh)
      try {
        // execSync(`cd ${clonePath}/${cloneDirName} && git config --global user.name`)
        await Git.getGobalUsername()
      } catch (err) {
        console.log(chalk.dim('Git username and email not set!'))

        const { gitUserName, gitUserEmail } = await getGitConfigNameEmail()
        // execSync(`cd ${clonePath}/${cloneDirName} && git config --local user.name ${gitUserName}`)
        // execSync(`cd ${clonePath}/${cloneDirName} && git config --local user.email ${gitUserEmail}`)
        await Git.setLocalUsername(gitUserName)
        await Git.setLocalUseremail(gitUserEmail)

        console.log(
          chalk.dim(`\nGit local config updated with ${chalk.bold(gitUserName)} & ${chalk.bold(gitUserEmail)}\n`)
        )
      }
      //
      // error: pathspec 'master' did not match any file(s) known to git
      // create a commit to avoid below above error
      //
      //  echo '# ${bloxName} by ${configstore.get(
      // 'appBloxUserName'
      // )}' > README.md &&
      // execSync(
      //   `cd ${clonePath}/${cloneDirName} &&
      //   git checkout -b main &&
      //   git commit -m 'happy hacking from appblox team!' --allow-empty &&
      //   git push origin main
      //   `,
      //   { stdio: 'ignore' }
      // )
      await Git.newBranch('main')
      await Git.commit('happy hacking from appblox team!', '--allow-empty')
      await Git.push('main')

      // createFromExistinURL is always ssh url, if user doesnt prefer ssh, convert it to https

      // execSync(
      //   `cd ${clonePath}/${cloneDirName} &&
      // git checkout main &&
      // git remote add tempRemote ${parentRepoUrl} &&
      // git fetch tempRemote &&
      // git merge tempRemote/main --allow-unrelated-histories &&
      // git remote rm tempRemote`,
      //   { stdio: 'ignore' }
      // )

      // Create a temp remote and fetch and merge it to local main to get data from parent repo
      await Git.checkoutbranch('main')
      await Git.addRemote('tempRemote', parentRepoUrl)
      await Git.fetch('tempRemote')
      await Git.merge('tempRemote/main', '--allow-unrelated-histories')
      await Git.removeRemote('tempRemote')

      console.log(chalk.dim('Succesfully copied blox code to local..'))

      // Try to update blox config of pulled blox,
      // if not present add a new one
      let bloxConfig
      try {
        bloxConfig = JSON.parse(readFileSync(path.resolve(clonePath, cloneDirName, 'blox.config.json')))
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.log(chalk.dim('Pulled blox has no config file, adding a new one'))
          bloxConfig = {
            type: bloxTypeInverter(bloxTypeNo),
            language: 'nodejs',
            start: 'npx webpack-dev-server',
            build: 'npx webpack',
            postPull: 'npm i',
          }
        }
      }
      bloxConfig.name = bloxFinalName
      bloxConfig.source = { https: url, ssh: sshUrl }
      writeFileSync(path.resolve(clonePath, cloneDirName, 'blox.config.json'), JSON.stringify(bloxConfig))

      console.log(chalk.dim('Succesfully updated blox config..'))

      // execSync(
      //   `cd ${clonePath}/${cloneDirName} &&
      //   git add -A &&
      //   git commit -m 'initial commit' &&
      //   git push origin main
      //   `
      //   // { stdio: 'ignore' }
      // )

      await Git.stageAll()
      await Git.commit('initial commit')
      await Git.push('main')

      console.log(chalk.dim('Succesfully pushed new version code to git..'))
    } catch (err) {
      console.log('Something went wrong while pulling\n')
      console.log(err)
      process.exit(1)
    }
  }

  await registerBlox(bloxTypeNo, bloxFinalName, bloxFinalName, visibility === 'PUBLIC', sshUrl, description)

  return {
    bloxSource: { https: url, ssh: sshUrl },
    cloneDirName,
    clonePath,
    bloxFinalName,
  }
}

module.exports = createBlox
