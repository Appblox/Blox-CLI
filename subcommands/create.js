/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable consistent-return */
const path = require('path')
const { readFileSync, writeFileSync, mkdirSync } = require('fs')
// const { execSync } = require('child_process')
// const { transports } = require('winston')
const chalk = require('chalk')
const checkBloxNameAvailability = require('../utils/checkBloxNameAvailability')
const createBlox = require('../utils/createBlox')
const { createFileSync } = require('../utils/fileAndFolderHelpers')
const {
  getBloxType,
  // getBloxShortName,
  getBloxName,
  getGitConfigNameEmail,
} = require('../utils/questionPrompts')
const { bloxTypeInverter } = require('../utils/bloxTypeInverter')
const { checkAndSetGitConfigNameEmail } = require('../utils/gitCheckUtils')
// const { logger } = require('../utils/logger')
const { appConfig } = require('../utils/appconfigStore')

const {
  generateIndex,
  generateGitIgnore,
  generatePackageJson,
} = require('../templates/createTemplates/function-templates')
const {
  generateUiContainerIndexHtml,
  generateUiContainerWebpack,
  generateUiContainerIndexJs,
  generateUiContainerStoreJs,
  generateUiContainerBootstrapJs,
  generateUiContainerAppJs,
  generateUiContainerPackageJson,
  generateUiContainerSystemJs,
} = require('../templates/createTemplates/uiContainer-templates')
const {
  generateUiElementIndexHtml,
  generateUiElementWebpack,
  generateUiElementIndexJs,
  generateUiElementBootstrapJs,
  generateUiElementAppJs,
  generateUiElementPackageJson,
  generateUiElementJs,
} = require('../templates/createTemplates/uiElement-templates')
const { GitManager } = require('../utils/gitmanager')
const { configstore } = require('../configstore')

// logger.add(new transports.File({ filename: 'create.log' }))

/**
 * @typedef createCommandOptions
 * @property {String} type
 */

/**
 *
 * @param {String} userPassedName Commander passes the first argument value to this
 * @param {createCommandOptions} options The options
 * @param {import('commander').Command} _ This is the Command object, if calling from anywhere else, pass empty object
 * @param {Boolean} returnBeforeCreatingTemplates
 * @param {import('fs').PathLike} cwd
 * @returns
 */
const create = async (userPassedName, options, _, returnBeforeCreatingTemplates, cwd) => {
  let componentName = userPassedName
  const regex = /^[a-zA-Z-_0-9]+$/
  let { type } = options
  // logger.info(`Create called with ${componentName} and ${type || 'no type'}`)
  try {
    if (!regex.test(componentName)) {
      console.log('only alphabets and - and _ allowed for blox name!')
      componentName = await getBloxName()
    }
    // logger.info(`changed name to ${componentName}`)
    if (!type) {
      type = await getBloxType()
      // logger.info(`Prompted user for a type and got back ${type}`)
    } else {
      type = bloxTypeInverter(type)
      // logger.info(`Converted type from name to number-${type}`)
    }
    const availableName = await checkBloxNameAvailability(componentName)
    // logger.info(
    //   `${componentName} checked against registry and ${availableName} is finalized`
    // )
    await appConfig.init()
    // const shortName = await getBloxShortName(availableName)
    const { bloxSource, cloneDirName, clonePath, bloxFinalName } = await createBlox(
      availableName,
      availableName,
      type,
      '',
      false,
      cwd || '.'
    )

    // logger.info(`${componentName} created and registered as ${availableName}`)

    // logger.info(`bloxSource - ${bloxSource}`)
    // logger.info(`cloneDirName - ${cloneDirName}`)
    // logger.info(`clonePath - ${clonePath}`)
    // logger.info(`bloxFinalName - ${bloxFinalName}`)

    const bloxDetails = {
      name: bloxFinalName,
      type: bloxTypeInverter(type),
      source: {
        ...bloxSource,
      },
      language: 'nodejs',
      start: 'npx webpack-dev-server',
      build: 'npx webpack',
      postPull: 'npm i',
    }
    // execSync(`cd ${cloneDirName}`)
    createFileSync(path.resolve(clonePath, cloneDirName, `blox.config.json`), bloxDetails)

    // logger.info(
    //   `blox config created at ${path.resolve(
    //     clonePath,
    //     cloneDirName,
    //     `blox.config.json`
    //   )}`
    // )
    // logger.info(bloxDetails)

    console.log(chalk.dim('Blox config created'))

    if (returnBeforeCreatingTemplates) return { clonePath, cloneDirName, bloxDetails }

    appConfig.addBlox({
      directory: path.relative('.', path.resolve(clonePath, cloneDirName)),
      meta: JSON.parse(readFileSync(path.resolve(clonePath, cloneDirName, 'blox.config.json'))),
    })

    // This is a temp setup
    // This is to avoid pushing empty repo, which will cause issues on
    // pulling the same and trying to create new with it

    const entry = path.resolve(clonePath, cloneDirName)

    // logger.info(`Entry path - ${entry}`)

    try {
      console.log('Please enter git username and email')
      console.log(
        chalk.dim.italic(
          `If i can't find name and email in global git config,\nI'll use these values on making commits..`
        )
      )
      // TODO-- store these values in config and dont ask everytime, can be used in pull aswell
      const { gitUserName, gitUserEmail } = await getGitConfigNameEmail()
      await checkAndSetGitConfigNameEmail(entry, { gitUserEmail, gitUserName })
      console.log(`Git local config updated with ${gitUserName} & ${gitUserEmail}`)

      /**
       * -------------------------------------------------------------------------
       */
      if (type === 4) {
        // function
        const indexString = generateIndex(componentName)
        writeFileSync(`${entry}/index.js`, indexString)
        const packageJsonString = generatePackageJson(componentName)
        writeFileSync(`${entry}/package.json`, packageJsonString)
        const gitIgnoreString = generateGitIgnore()
        writeFileSync(`${entry}/.gitignore`, gitIgnoreString)
      } else if (type === 2) {
        // ui-container
        createUiContainerFolders(entry, componentName)
      } else if (type === 3) {
        // ui-element
        createUiElementFolders(entry, componentName)
      }

      /**
       * -------------------------------------------------------------------------
       */

      const prefersSsh = configstore.get('prefersSsh')
      const originUrl = prefersSsh ? bloxSource.ssh : bloxSource.https
      const Git = new GitManager(entry, cloneDirName, originUrl, prefersSsh)

      await Git.newBranch('main')
      await Git.stageAll()
      await Git.commit('initial commit')
      await Git.push('main')
      // execSync(
      //   `cd ${entry} &&
      //    git checkout -b main &&
      //    git add -A &&
      //    git commit -m "initial commit" &&
      //    git push origin main`
      // )
    } catch (err) {
      console.log('err:', err)
    }
  } catch (err) {
    console.log(err)
    console.log('Something went wrong while creating!')
    // logger.info('ERROR')
    // logger.error(err)
    throw new Error('create failed')
  }
}

module.exports = create

// ui container
//
function createUiContainerFolders(componentpath, componentname) {
  const indexHtmlString = generateUiContainerIndexHtml(componentname)
  const webpackConfigString = generateUiContainerWebpack(componentname)
  const indexJsString = generateUiContainerIndexJs(componentname)
  const storeJsString = generateUiContainerStoreJs(componentname)
  const bootstrapString = generateUiContainerBootstrapJs(componentname)
  const appJsString = generateUiContainerAppJs(componentname)
  const packageJsonString = generateUiContainerPackageJson(componentname)
  const systemJsString = generateUiContainerSystemJs(componentname)
  const gitignore = generateGitIgnore()

  mkdirSync(`${componentpath}/public`)
  writeFileSync(`${componentpath}/public/index.html`, indexHtmlString)

  mkdirSync(`${componentpath}/src`)
  mkdirSync(`${componentpath}/src/components`)
  writeFileSync(`${componentpath}/src/index.js`, indexJsString)
  writeFileSync(`${componentpath}/src/bootstrap.js`, bootstrapString)
  writeFileSync(`${componentpath}/src/App.js`, appJsString)
  writeFileSync(`${componentpath}/src/System.js`, systemJsString)
  writeFileSync(`${componentpath}/src/store.js`, storeJsString)

  writeFileSync(`${componentpath}/package.json`, packageJsonString)
  writeFileSync(`${componentpath}/README.md`, `fill this`)
  writeFileSync(`${componentpath}/webpack.config.js`, webpackConfigString)
  writeFileSync(`${componentpath}/.gitignore`, gitignore)
}

// ui element
//
function createUiElementFolders(componentpath, componentname) {
  const indexHtmlString = generateUiElementIndexHtml(componentname)
  const webpackConfigString = generateUiElementWebpack(componentname)
  const indexJsString = generateUiElementIndexJs(componentname)
  const bootstrapString = generateUiElementBootstrapJs(componentname)
  const appJsString = generateUiElementAppJs(componentname)
  const packageJsonString = generateUiElementPackageJson(componentname)
  const uiElementString = generateUiElementJs(componentname)
  const gitignore = generateGitIgnore()

  mkdirSync(`${componentpath}/public`)
  writeFileSync(`${componentpath}/public/index.html`, indexHtmlString)

  mkdirSync(`${componentpath}/src`)
  mkdirSync(`${componentpath}/src/components`)
  writeFileSync(`${componentpath}/src/index.js`, indexJsString)
  writeFileSync(`${componentpath}/src/bootstrap.js`, bootstrapString)
  writeFileSync(`${componentpath}/src/App.js`, appJsString)
  writeFileSync(`${componentpath}/src/${componentname}.js`, uiElementString)
  // writeFileSync(`${componentpath}/src/System.js`, '')
  // writeFileSync(`${componentpath}/src/store.js`, '')

  writeFileSync(`${componentpath}/package.json`, packageJsonString)
  writeFileSync(`${componentpath}/README.md`, `fill this`)
  writeFileSync(`${componentpath}/webpack.config.js`, webpackConfigString)
  writeFileSync(`${componentpath}/.gitignore`, gitignore)
}
