/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const inquirer = require('inquirer')
const { userRepos } = require('./Queries')
const { NewLS } = require('./listandselectrepos')
const customList = require('./customList')
const { bloxTypes } = require('./bloxTypes')
const { configstore } = require('../configstore')
const GitPaginator = require('./paginateGitRest')
const CustomListV2 = require('./cutomListV2')
const customSelect = require('./multiSelect')

inquirer.registerPrompt('customList', customList)
inquirer.registerPrompt('CustomListV2', CustomListV2)
inquirer.registerPrompt('customSelect', customSelect)

function getBloxShortName(bloxName) {
  const question = {
    type: 'input',
    name: 'bloxShortName',
    message: `Enter a short name for blox,default is ${bloxName}`,
  }
  return inquirer
    .prompt(question)
    .then((ans) => ans.bloxShortName || bloxName)
    .catch((err) => console.log(err))
}
function getBloxName() {
  const question = {
    type: 'input',
    name: 'bloxName',
    message: 'Enter name of blox',
    validate: function test(ans) {
      const regex = /^[a-zA-Z-_0-9]+$/
      if (regex.test(ans)) {
        return true
      }
      return 'Blox name should only contain alphabets, _ , -'
    },
  }
  return inquirer
    .prompt(question)
    .then((ans) => ans.bloxName || 'test')
    .catch((err) => console.log(err))
}

function getMergeConfirmation() {
  // TODO : provide options to accept only the removals, or addition and also a manual edit with
  //        vscode/text-editor integration
  const questions = [
    {
      type: 'list',
      name: 'syncIncoming',
      message: 'Should I add incoming data and write the new config',
      choices: [
        { name: 'Merge with incoming', value: true },
        { name: 'Ignore incoming config', value: false },
      ],
    },
  ]
  return inquirer
    .prompt(questions)
    .then((ans) => ans.syncIncoming)
    .catch((err) => console.log('o_0', err))
}

function getBloxType() {
  const questions = [
    {
      type: 'list',
      name: 'bloxType',
      message: 'Select the type of blox',
      choices: bloxTypes.reduce((acc, v) => {
        if (v[0] !== 'appBlox') return acc.concat({ name: v[0], value: v[1] })
        return acc
      }, []),
    },
  ]
  return inquirer
    .prompt(questions)
    .then((ans) => ans.bloxType)
    .catch((err) => console.log('somte', err))
}

/**
 * To prompt user to enter a prefix string for blox
 * @param {String} d
 * @returns {Promise} User entered string or passed default
 */
function getPrefix(d) {
  const questions = [
    {
      type: 'input',
      name: 'subModulePrefix',
      message: `Enter the preferred prefix for submodules, will default to ${d}`,
    },
  ]
  return inquirer
    .prompt(questions)
    .then((ans) => ans.subModulePrefix || d)
    .catch((err) => console.log(err, 'lll'))
}

function getTemplate() {
  const questions = [
    {
      type: 'confirm',
      name: 'createFromTemplate',
      message: 'Create repo from a template',
    },
    {
      type: 'customList',
      name: 'selectTemplate',
      message: 'select a template repo',
      choices: [], // give empty list, custom list loads from api
      source: new NewLS(userRepos.Q, userRepos.Tr_t).sourceAll,
      pageSize: 22,
      loop: false,
      when: (ans) => ans.createFromTemplate,
    },
  ]
  return inquirer
    .prompt(questions)
    .then((ans) => ans.selectTemplate || null)
    .catch((err) => console.log(err, 'lll'))
}

/**
 * Prompts user for template repo selection
 * @returns {String|Null}
 */
// eslint-disable-next-line no-unused-vars
function getOrgId() {
  const question = [
    {
      // type: 'customList',
      type: 'CustomListV2',
      name: 'selectOrg',
      message: 'select a organization',
      choices: [], // give empty list, loads initial set
      // source: new NewLS(userOrgs.Q, userOrgs.Tr).sourceB,
      source: new GitPaginator('user/orgs', (v) => ({
        name: v.login,
        // split("/") -- To get name of org so it can be used
        // to get team list of organization in later prompt,
        // TODO -- if possible change choice object of inquirer to accomodate this,
        // and return ans with name and not just answer
        value: `${v.login}/${v.node_id}`,
      })),
      pageSize: 22,
    },
  ]
  return inquirer.prompt(question).then((ans) => {
    console.log('\n')
    // TODO -- if there are no organization returned from call,
    // nothing will be listed, and user entering return in that case
    // might cause inquirer to run into error, which is not handled
    // and if there are no organizations, ask user whether to create in
    // user git itself.

    // ans will have display name followed by Id seperated by "/"
    return ans.selectOrg.split('/')
  })
}

function getRepoURL() {
  const question = [
    {
      type: 'customList',
      name: 'selectRepo',
      message: 'select a repo',
      choices: [], // give empty list, loads initial set
      source: new NewLS(userRepos.Q, userRepos.Tr_URL).sourceAll,
      pageSize: 22,
    },
  ]
  return inquirer.prompt(question).then((ans) => ans.selectRepo)
}

function getDeviceCode() {
  return inquirer
    .prompt({
      type: 'input',
      name: 'code',
      message: 'Paste authorization code here:',
    })
    .then((ans) => ans.code)
}

function WipeAllConfirmation() {
  return inquirer.prompt({
    type: 'confirm',
    message: 'There are files,Do you want to wipe all',
    name: 'wipeAll',
  })
}

function getCommitMessage() {
  return inquirer
    .prompt({
      type: 'input',
      name: 'commitMessage',
      message: 'Please enter a commit message',
      validate: (ans) => {
        if (ans) return true
        return 'Commit message cannot be empty'
      },
    })
    .then((ans) => ans.commitMessage)
}

function wantToCreateNewVersion(name) {
  return inquirer
    .prompt({
      type: 'confirm',
      name: 'createNewBloxFrom',
      message: `Do you wish to create a new blox from ${name}?`,
    })
    .then((ans) => ans.createNewBloxFrom)
}

function wouldLikeToRegisterTemplateBloxesAsNewBlox() {
  return inquirer
    .prompt({
      type: 'confirm',
      name: 'registerTemplateAsNew',
      message: `Would you like to register some or all of template bloxes as new bloxes`,
    })
    .then((ans) => ans.registerTemplateAsNew)
}

function getGitConfigNameEmail() {
  const localGitName = configstore.get('localGitName', '')
  const localGitEmail = configstore.get('localGitEmail', '')

  const questions = [
    {
      type: 'confirm',
      name: 'useStoredCredentials',
      message: `Continue with ${localGitEmail} and ${localGitName}`,
      when: () => {
        if (localGitEmail && localGitName) {
          return true
        }
        return false
      },
    },
    {
      type: 'input',
      name: 'gitUserName',
      message: 'Enter git username',
      validate: (ans) => {
        if (ans) return true
        return 'Please enter a user name'
      },
      when: (ans) => {
        if (ans.useStoredCredentials) {
          return false
        }
        return true
      },
    },

    {
      type: 'input',
      name: 'gitUserEmail',
      message: 'Enter git email',
      validate: (ans) => {
        if (ans) return true
        return 'Please enter a user email'
      },
      when: (ans) => {
        if (ans.useStoredCredentials) {
          return false
        }
        return true
      },
    },
  ]

  return inquirer
    .prompt(questions)
    .then((ans) => {
      if (ans.useStoredCredentials) {
        return { gitUserEmail: localGitEmail, gitUserName: localGitName }
      }
      configstore.set('localGitEmail', ans.gitUserEmail)
      configstore.set('localGitName', ans.gitUserName)
      return ans
    })
    .catch((err) => console.log(err))
}

function setWithTemplate() {
  return inquirer.prompt({
    type: 'confirm',
    message: 'Do you want to set a sample project',
    name: 'useTemplate',
  })
}

function readInput({ type = 'input', name, message, ...options }) {
  const question = {
    type,
    name,
    message: message || `Enter ${name}`,
    ...options,
  }
  return inquirer
    .prompt(question)
    .then((ans) => ans[name])
    .catch((err) => console.log(err))
}

function confirmationPrompt(data) {
  return inquirer
    .prompt({
      type: 'confirm',
      ...data,
    })
    .then((ans) => ans[data.name])
}

module.exports = {
  WipeAllConfirmation,
  getOrgId,
  getRepoURL,
  getTemplate,
  getPrefix,
  getDeviceCode,
  getBloxShortName,
  getBloxName,
  getBloxType,
  getCommitMessage,
  wantToCreateNewVersion,
  wouldLikeToRegisterTemplateBloxesAsNewBlox,
  getGitConfigNameEmail,
  setWithTemplate,
  readInput,
  confirmationPrompt,
  getMergeConfirmation,
}
