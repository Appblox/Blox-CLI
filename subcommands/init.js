/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-case-declarations */
const { execSync } = require('child_process')
const { readFile, writeFile, rename } = require('fs/promises')
const { readFileSync, writeFileSync, renameSync, readdirSync, statSync } = require('fs')
// const { readFileSync } = require('fs')
const path = require('path')
const chalk = require('chalk')
const { createFileSync, createDirForType, ensureDirSync, isDirEmpty } = require('../utils/fileAndFolderHelpers')
const {
  getBloxName,
  setWithTemplate,
  wantToCreateNewVersion,
  wouldLikeToRegisterTemplateBloxesAsNewBlox,
  sourceUrlOptions,
  readInput,
} = require('../utils/questionPrompts')
const createBlox = require('../utils/createBlox')
const { bloxTypeInverter } = require('../utils/bloxTypeInverter')
const checkBloxNameAvailability = require('../utils/checkBloxNameAvailability')
const { checkAndSetGitConfigNameEmail } = require('../utils/gitCheckUtils')
const templateConfig = require('./templateappblox.json')
const { appConfig } = require('../utils/appconfigStore')
const create = require('./create')
const { configstore } = require('../configstore')
const { GitManager } = require('../utils/gitmanager')
const convertGitSshUrlToHttps = require('../utils/convertGitUrl')

const Init = async (appbloxName) => {
  const templatesPath = path.join(__dirname, '..', 'templates', 'appblox_todo_template_test')
  // const packagesPath = path.join(__dirname, '..', 'packages')
  const componentName = appbloxName || (await getBloxName())

  // if dir is clean, create a config file with name for configstore to
  // initialize..

  const availableName = await checkBloxNameAvailability(componentName)

  // Check if github user name or id is not set (we need both, if either is not set inform)
  const u = configstore.get('githubUserId', '')
  const t = configstore.get('githubUserToken', '')

  // If user is giving a url then no chance of changing this name
  let bloxFinalName = availableName
  let bloxSource
  let userHasProvidedRepoUrl = false

  if (u === '' || t === '') {
    console.log(`${chalk.bgCyan('INFO')}:Seems like you have not connected to any version manager`)
    const o = await sourceUrlOptions()
    // 0 for cancel
    // 2 for go to connect
    // 3 for let me provide url
    if (o === 0) process.exit(1)
    else if (o === 2) {
      // INFO connecting to github from here might cause the same token in memory issue
      console.log('Cant do it now!')
    } else {
      const s = await readInput({ message: 'Enter source ssh url here', name: 'sUrl' })
      bloxSource = { ssh: s.trim(), https: convertGitSshUrlToHttps(s.trim()) }
      userHasProvidedRepoUrl = true
    }
  } else {
    // const shortName = await getBloxShortName(availableName)
    // const { bloxSource, cloneDirName, clonePath, bloxFinalName } =
    const d = await createBlox(availableName, availableName, 1, '', false, '.')
    bloxFinalName = d.bloxFinalName
    bloxSource = d.bloxSource
  }

  const [dir] = [bloxFinalName]
  const DIRPATH = path.resolve(dir)

  const prefersSsh = configstore.get('prefersSsh')
  const originUrl = prefersSsh ? bloxSource.ssh : bloxSource.https
  // INFO - Git is set in current directory, it could be having other git, might cause issue
  //        user is adviced to run in a new directory
  const Git = new GitManager('.', bloxFinalName, originUrl, prefersSsh)
  if (userHasProvidedRepoUrl) {
    await Git.clone(DIRPATH)
    const emptyDir = await isDirEmpty(DIRPATH, '.git')
    if (!emptyDir) {
      console.log(`${chalk.bgRed('ERROR')}: Expected to find an empty repo`)
      process.exit(1)
    }
  }

  const CONFIGPATH = path.join(DIRPATH, 'appblox.config.json')
  createFileSync(CONFIGPATH, {
    name: bloxFinalName,
    type: 'appBlox',
    source: bloxSource,
  })

  await checkAndSetGitConfigNameEmail(bloxFinalName)

  // NOTE: bloxFinalName doesnt need to have a prefix here..it is an app
  // execSync(
  //   `git checkout -b main &&
  // git add -A &&
  // git commit -m 'initial commit' &&
  // git push origin main`,
  //   { cwd: path.resolve(bloxFinalName) }
  // )

  Git.cd(path.resolve(bloxFinalName)) // Change to git directory
  await Git.newBranch('main')
  await Git.stageAll()
  await Git.commit('initial app commit')
  await Git.push('main')

  appConfig.init(path.resolve(bloxFinalName))

  const { useTemplate } = await setWithTemplate()

  if (!useTemplate) return

  // if (!appConfig.prefix) {
  //   const prefix = await getPrefix(componentName)
  //   appConfig.prefix = prefix
  // }

  const fastForward = await wouldLikeToRegisterTemplateBloxesAsNewBlox()

  ;(async function installDependencies(l, config, relativeDir) {
    const level = l + 1
    // const indent = ''.padStart(level, '- ')
    let localDirName = ''
    const fnNameChanges = {
      addTodo: 'addTodo',
      listTodos: 'listTodos',
      removeTodo: 'removeTodo',
    }
    for (const blox in config.dependencies) {
      if (Object.hasOwnProperty.call(config.dependencies, blox)) {
        // console.log('CONFIG dependencies', config.dependencies.todoContainer)
        const bloxData = config.dependencies[blox]
        const bloxMeta = { ...bloxData.meta }
        // console.log(bloxMeta)
        localDirName = `${bloxMeta.name}`
        let p = createDirForType(bloxTypeInverter(bloxMeta.type), DIRPATH)

        const createCustomVersion = fastForward && (await wantToCreateNewVersion(bloxMeta.name))

        if (createCustomVersion) {
          const availableBloxName = await checkBloxNameAvailability(bloxMeta.name, true)
          const { cloneDirName, clonePath, bloxDetails } = await create(
            availableBloxName,
            { type: bloxMeta.type },
            {},
            true,
            path.resolve(bloxFinalName)
          )

          localDirName = cloneDirName
          p = clonePath

          bloxMeta.name = bloxDetails.name
          bloxMeta.source = bloxDetails.source
        }
        // console.log('localDir', localDirName)
        // console.log(path.resolve(p, localDirName))
        // console.log(p)
        // eslint-disable-next-line no-inner-declarations
        function capitalizeFirstLetter(string) {
          return string.charAt(0).toUpperCase() + string.slice(1)
        }

        try {
          ensureDirSync(path.resolve(p, localDirName))
          execSync(`cp -r ${path.join(templatesPath, bloxData.directory)}/. ${path.resolve(p, localDirName)}`)
          if (createCustomVersion) {
            switch (bloxMeta.type) {
              case 'ui-elements':
                // change the blox file name if new version
                // console.log(`copied ${bloxData.meta.name} to ${path.resolve(p, localDirName)}`)
                await rename(
                  path.resolve(p, localDirName, 'src', `${bloxData.meta.name}.js`),
                  path.resolve(p, localDirName, 'src', `${bloxMeta.name}.js`)
                )
                // execSync(`mv ${bloxData.meta.name}.js ${bloxMeta.name}.js`, {
                //   cwd: path.resolve(p, localDirName, 'src'),
                // })
                // console.log(`renamed ${bloxData.meta.name} to ${bloxMeta.name}`)

                // update in components in current config
                // eslint-disable-next-line no-param-reassign
                config.dependencies.todoContainer.components[bloxData.meta.name] = bloxMeta.name

                // Change function name and export to new name in componet file
                const bloxFile = await readFile(path.resolve(p, localDirName, 'src', `${bloxMeta.name}.js`), {
                  encoding: 'utf8',
                })
                const re = new RegExp(bloxData.meta.name, 'g')
                await writeFile(
                  path.resolve(p, localDirName, 'src', `${bloxMeta.name}.js`),
                  bloxFile.replace(re, capitalizeFirstLetter(bloxMeta.name)),
                  { encoding: 'utf8' }
                )

                // Change the name in App.js
                const AppJsFile = await readFile(path.resolve(p, localDirName, 'src', `App.js`), { encoding: 'utf8' })
                await writeFile(path.resolve(p, localDirName, 'src', `App.js`), AppJsFile.replace(re, bloxMeta.name), {
                  encoding: 'utf8',
                })
                // Change name in webpack.js
                const webpackJsFile = await readFile(path.resolve(p, localDirName, `webpack.config.js`), {
                  encoding: 'utf8',
                })
                await writeFile(
                  path.resolve(p, localDirName, `webpack.config.js`),
                  webpackJsFile.replace(re, bloxMeta.name),
                  { encoding: 'utf8' }
                )

                // Change name in package.json
                const packageJsonFile = await readFile(path.resolve(p, localDirName, `package.json`), {
                  encoding: 'utf8',
                })
                await writeFile(
                  path.resolve(p, localDirName, `package.json`),
                  packageJsonFile.replace(re, bloxMeta.name),
                  { encoding: 'utf8' }
                )
                break
              case 'function':
                // Note the new name change
                fnNameChanges[bloxData.meta.name] = bloxMeta.name

                // eslint-disable-next-line no-loop-func
                Object.keys(fnNameChanges).forEach((v) => {
                  const newFnName = fnNameChanges[v]
                  const regx = new RegExp(v, 'g')
                  if (v !== newFnName) {
                    // console.log('Function name change detected..')
                    // console.log(`${v} has changed to ${newFnName}`)

                    // eslint-disable-next-line no-unused-expressions
                    !(function getAllFiles(dirPath, arrayOfFiles) {
                      const files = readdirSync(dirPath)
                      // console.log(files)
                      // arrayOfFiles = arrayOfFiles || []

                      files.forEach((file) => {
                        if (statSync(`${dirPath}/${file}`).isDirectory()) {
                          if (file.charAt(0) !== '.') getAllFiles(`${dirPath}/${file}`, arrayOfFiles)
                        } else {
                          // arrayOfFiles.push(path.join(__dirname, dirPath, '/', file))
                          const filePath = path.resolve(dirPath, file)
                          // console.log(`Reading file ${filePath}`)
                          const tempFile = readFileSync(filePath, {
                            encoding: 'utf8',
                          })
                          if (regx.test(tempFile)) {
                            // console.log(`Found ${v} in ${filePath}, Replacing..`)
                            writeFileSync(filePath, tempFile.replace(regx, newFnName), { encoding: 'utf8' })
                            // console.log('Replaced!!')
                          }
                        }
                      })

                      return arrayOfFiles
                    })(DIRPATH, [])

                    delete fnNameChanges[v]
                  }
                })
                break

              default:
                break
            }
          }

          // Check if components used by container has changed names..
          // i.e if todoItem -> 123 or todoInput -> 321 etc..
          if (bloxMeta.type === 'ui-container') {
            // console.log('\nJust copied a container..')
            // console.log('Checking for component name changes..')
            const Components = config.dependencies.todoContainer.components
            // eslint-disable-next-line no-loop-func
            Object.keys(Components).forEach((v) => {
              if (Components[v] !== v) {
                // console.log(`\n!!! Name Change Detected`)
                // console.log(`${v} is changed to ${Components[v]}`)
                const re = new RegExp(v, 'gi')

                // Renaming in components folder
                renameSync(
                  path.resolve(p, localDirName, 'src', 'components', capitalizeFirstLetter(`${v}`)),
                  path.resolve(p, localDirName, 'src', 'components', capitalizeFirstLetter(`${Components[v]}`))
                )

                // Renaming the componet File
                renameSync(
                  path.resolve(
                    p,
                    localDirName,
                    'src',
                    'components',
                    capitalizeFirstLetter(`${Components[v]}`),
                    capitalizeFirstLetter(`${v}.js`)
                  ),
                  path.resolve(
                    p,
                    localDirName,
                    'src',
                    'components',
                    capitalizeFirstLetter(`${Components[v]}`),
                    capitalizeFirstLetter(`${Components[v]}.js`)
                  )
                )

                console.log(`Replacing ${v} inside componets to ${Components[v]}`)
                const componetJsFile = readFileSync(
                  path.resolve(
                    p,
                    localDirName,
                    'src',
                    'components',
                    capitalizeFirstLetter(`${Components[v]}`),
                    capitalizeFirstLetter(`${Components[v]}.js`)
                  ),
                  { encoding: 'utf8' }
                )
                writeFileSync(
                  path.resolve(
                    p,
                    localDirName,
                    'src',
                    'components',
                    capitalizeFirstLetter(`${Components[v]}`),
                    capitalizeFirstLetter(`${Components[v]}.js`)
                  ),
                  componetJsFile
                    .replace(re, Components[v])
                    .replace(`${Components[v]}`, capitalizeFirstLetter(Components[v])),
                  // The env is created as BLOX_ENV_URL_todoInput -> BLOX_ENV_URL_ANew if new name is aNew,
                  // That has to change to aNew, because env is generated as BLOX_ENV_URL_aNew
                  // Replace all first and then change the first occurence, as it should the export name
                  { encoding: 'utf8' }
                )

                // Replace inside the index file in component
                // Eg: index.js inside components/TodoInput/
                const indexInsideComponet = readFileSync(
                  path.resolve(
                    p,
                    localDirName,
                    'src',
                    'components',
                    capitalizeFirstLetter(`${Components[v]}`),
                    `index.js`
                  ),
                  { encoding: 'utf8' }
                )
                writeFileSync(
                  path.resolve(
                    p,
                    localDirName,
                    'src',
                    'components',
                    capitalizeFirstLetter(`${Components[v]}`),
                    `index.js`
                  ),
                  indexInsideComponet.replace(re, capitalizeFirstLetter(Components[v])),
                  { encoding: 'utf8' }
                )

                // Replace name inside App.js
                const cppjs = readFileSync(path.resolve(p, localDirName, 'src', 'App.js'), { encoding: 'utf8' })
                writeFileSync(
                  path.resolve(p, localDirName, 'src', 'App.js'),
                  cppjs.replace(re, capitalizeFirstLetter(Components[v])),
                  { encoding: 'utf8' }
                )
              }
            })
          }

          appConfig.env = config.env || {}
          appConfig.addBlox({
            directory: path.relative(relativeDir, path.resolve(p, localDirName)),
            meta: {
              ...bloxMeta,
            },
          })

          if (createCustomVersion) {
            await checkAndSetGitConfigNameEmail(path.resolve(p, localDirName))

            // Push the templates changes here
            Git.cd(path.resolve(p, localDirName))
            Git._createRemote(prefersSsh ? bloxMeta.source.ssh : bloxMeta.source.https, prefersSsh)
            await Git.newBranch('main')
            await Git.stageAll()
            await Git.commit('initial commit')
            await Git.push('main')
          }
        } catch (err) {
          console.log(err)
          console.log('Something went wrong while bootstrapping ', bloxMeta.name)
        }

        if (bloxMeta.dependencies) installDependencies(level, bloxMeta.dependencies, path.resolve(p, localDirName))
      }
    }
  })(1, templateConfig, path.resolve(DIRPATH))

  // execSync(`npm i -g ${path.join(packagesPath, 'node-blox-sdk')}`)
  // console.log('Use blox push after changing')
  console.log('Finished setting up template.')
  // await createBlox(componentName, componentName, 'appBlox', '')

  process.on('SIGINT', () => {
    // console.log('force close --> cleaning up')
    process.kill()
  })
}

// To avoid calling Init twice on tests
// if (process.env.NODE_ENV !== 'test') Init(process.argv)

module.exports = Init
