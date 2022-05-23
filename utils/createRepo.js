const inquirer = require('inquirer')
const axios = require('axios')
const chalk = require('chalk')
// const { execSync, exec } = require('child_process')
// const { getTemplate } = require('./questionPrompts')
const { cloneTemplateRepository, createRepository } = require('./Mutations')
// const { NewLS } = require('./listandselectrepos')
// const { orgTeams } = require('./Queries')
const { githubGraphQl } = require('./api')
const checkBloxNameAvailability = require('./checkBloxNameAvailability')
const { getGitHeader } = require('./getHeaders')
const { configstore } = require('../configstore')
const { GitManager } = require('./gitmanager')

/**
 *
 * @param {String} username User name stored in config (git user name)
 * @param {String} ownerId OrgId or UserId,
 * @param {("org" | "user")} ownerType Type of owner
 * @param {String|null} [orgName] Name of organization
 * @param {String} prefix Prefix to be added to cloned repo local folder name
 * @param {String} bloxShortName Available short name for blox
 */
// eslint-disable-next-line consistent-return
async function createRepo(username, ownerId, ownerType, orgName, prefix, bloxShortName, _fromPull, clonePath) {
  /**
   * @type { Null|String} The user selected template repo
   */
  const template = null
  // if (!fromPull) {
  //   template = await getTemplate()
  // }
  const questions = [
    // {
    //   type: 'input',
    //   name: 'reponame',
    //   message: 'Name for repo',
    // },
    {
      // TODO - should give option to skip
      type: 'input',
      name: 'description',
      message: 'Description of repo',
    },
    {
      type: 'list',
      name: 'visibility',
      message: 'visibility of repo',
      choices: ['PRIVATE', 'PUBLIC'],
    },
  ]

  // if creating in organization and not from a template,
  // then need to send team id that should be given access,
  // might need to change to multiple select if can pass multiple team ids
  // if (ownerType === 'org' && !template) {
  //   questions.push({
  //     type: 'list',
  //     message: 'select team to give access',
  //     name: 'selectTeam',
  //     choices: () => new NewLS(orgTeams.Q, orgTeams.Tr).sourceAll(orgName),
  //   })
  // }
  const ans = await inquirer.prompt(questions)

  // console.log(ans, bloxShortName)
  // process.exit(0)

  // console.log('DETAILS:')
  // console.log({
  //   name: PREFIXED_BLOXNAME,
  //   owner: ownerId,
  //   templateRepo: template,
  //   template: false,
  //   description: ans.description,
  //   visibility: ans.visibility,
  //   team: ans.selectTeam || null,
  // })
  // const apiGraph = ' https://api.github.com/graphql'
  const headersV4 = getGitHeader()
  try {
    /**
     * bloxFinalName is used here because, the passed name might be available in registry,
     * but _prefix_availablename might be already present, so we are changing the blox name
     * from here calling checkBloxNameAvailability .. to account for that change return the
     * newly selected name (which we will store in bloxFinalName) we send it back !!
     */
    let bloxFinalName = ''

    const data = await (async function callToGitHub(checkThisName) {
      console.log(chalk.dim(`\nchecking name availability of ${checkThisName}\n`))
      bloxFinalName = checkThisName
      const PREFIXED_BLOXNAME = `${clonePath !== '.' ? `_${prefix}_` : ``}${checkThisName}`
      // console.log(PREFIXED_BLOXNAME)
      const { data: innerData } = await axios.post(
        githubGraphQl,
        {
          query: template ? cloneTemplateRepository.Q : createRepository.Q,
          variables: {
            name: PREFIXED_BLOXNAME,
            owner: ownerId,
            templateRepo: template,
            template: false,
            description: ans.description,
            visibility: ans.visibility,
            team: ans.selectTeam || null,
          },
        },
        { headers: headersV4 }
      )
      if (innerData.errors) {
        // TODO -- write data.errors.message to combined log here

        // TODO -- if errored because repo name already taken..prompt for a
        // new availbale blox short name and try again
        if (innerData.errors.length === 1 && innerData.errors[0].type === 'UNPROCESSABLE') {
          // await checkBloxNameAvailability('', true)
          // Could be repo name already exists error
          console.log(chalk.red(`Repo name ${PREFIXED_BLOXNAME} already exists\n`))
          const newShortName = await checkBloxNameAvailability('', true)
          return callToGitHub(newShortName)
        }
        throw new Error(`Something went wrong with query,\n${JSON.stringify(innerData)}`)
      }
      return innerData
    })(bloxShortName)

    // eslint-disable-next-line no-unused-vars
    const { url, sshUrl, name } = template ? cloneTemplateRepository.Tr(data) : createRepository.Tr(data)

    // console.log('ssh and url')
    // console.log(sshUrl)
    // console.log(url)
    // const repoUrl = await checkSSH()
    //   .then((r) => {
    //     if (r === username) {
    //       // go with ssh to clone
    //       // return template
    //       //   ? cloneTemplateRepository.Tr(data).sshUrl
    //       //   : createRepository.Tr(data).sshUrl
    //       return sshUrl
    //     }
    //     console.log(chalk.blueBright(`Please sign into ${r}'s account for a seemless developer experience`))
    //     console.log(`Use ${chalk.blueBright('blox connect github -f')} to restart github login`)
    //     throw new Error('Key of different user')
    //   })
    //   // Log error here
    //   .catch((err) => {
    //     console.log(err)
    //     // TODO for the time being only clone with ssh. dont use http
    //     // return url
    //     process.exit(1)
    //   })

    // execSync(`git clone ${repoUrl} ${clonePath}/${name}`, {
    //   stdio: 'ignore',
    // })
    const repoUrl = configstore.get('prefersSsh') ? sshUrl : url
    const git = new GitManager('.', name, repoUrl, configstore.get('prefersSsh'))

    await git.clone(`${clonePath}/${name}`)
    console.log(`cloning to ${clonePath}/${name} from ${repoUrl}`)
    console.log(chalk.green('Successfully Cloned!'))
    // console.log('dafdasfa', data)
    // return cloneTemplateRepository.Tr(data)
    return template
      ? { bloxFinalName, ...cloneTemplateRepository.Tr(data) }
      : { bloxFinalName, ...createRepository.Tr(data) }
  } catch (err) {
    // if cloning failed, set sync points and later sysnc
    console.log(err)
    console.log(chalk.red(`<<${err.message}>>`))
  }
}

module.exports = createRepo

// function checkSSH() {
//   return new Promise((res, rej) => {
//     exec('ssh -T git@github.com', (error, stdout, stderror) => {
//       if (error.code < 2) {
//         // res(stderror.match(/Hi (\w+)!/)[1])
//         res(stderror.match(/(?<=Hi ).*(?=!)/)[0])
//       }
//       rej(new Error('Failed connection:SSH set up'))
//     })
//   })
// }
