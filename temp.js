/* eslint-disable */
const path = require('path')
const fs = require('fs')
const readline = require('readline')

!(function t() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question('Where do you live ? ', (country) => {
    console.log(country)
    const root = path.resolve(country, 'se')
    const parent = path.dirname(root)
    const appName = path.basename(root)
    console.log('parent', parent, root)
    try {
      const files = fs.readdirSync(root)
      if (files.includes('.env')) {
        console.log('Found env')
      }
      const ans = files.reduce(
        (acc, file) => {
          const p = path.resolve(file)
          const stat = fs.statSync(p)

          console.log(`${p} is ${stat.isDirectory() ? 'a ' : 'not a'} directory`)
          if (stat.isDirectory()) return { ...acc, dirs: acc.dirs + 1 }
          return { ...acc, files: acc.files + 1 }
        },
        { dirs: 0, files: 0 }
      )
      console.log(files.length)
      console.log(ans)
    } catch (e) {
      console.log(e)
      process.exit(1)
    }
    try {
      const ssstat = fs.statSync(root)
      console.log(ssstat.isDirectory())
      console.log(ssstat)
      const dir = fs.readdirSync(root)
    } catch (e) {
      console.log('error1', e)
    }
    try {
      const dir = fs.opendirSync(root)
    } catch (e) {
      console.log('error2', e)
    }
    console.log(root, appName)
    rl.close(country)
  })

  rl.on('close', () => {
    console.log('\nBYE BYE !!!')
    process.exit(0)
  })
})()

function demo() {
  inquirer.registerPrompt('file-tree-selection', require('inquirer-file-tree-selection-prompt'))
  inquirer.registerPrompt('customList', require('../utils/customList'))

  /**
   * @type {Subscriber}
   */
  let Emitter
  const stream = new Observable((obs) => {
    Emitter = obs
    obs.next({
      type: 'confirm',
      name: 'alreadyARepo',
      message: 'Already a repo',
    })
  })
  inquirer.prompt(stream).ui.process.subscribe({
    next: async (ans) => {
      const { name, answer } = ans
      switch (name) {
        case 'alreadyARepo':
          if (answer) {
            //
            // User says already a housing repo
            // Check for specific files that can confirm the claim
            // TODO--check if really a housing repo
            //
            Emitter.next({
              type: 'file-tree-selection',
              name: 'housingFolder',
              message: 'Point me to house folder',
              onlyShowDir: true,
            })
          } else {
            // TODO -- initialize files to make a housing folder
          }
          break
        case 'housingFolder':
          // console.log('selected Dir', answer);
          // TODO--set in env
          // TODO--check if .gitmodules folder is present
          Emitter.next({
            type: 'list',
            message: 'where to create repo',
            name: 'where',
            choices: [{ name: 'my git name', value: 'my git', short: 'sdfsdfsd' }, 'org git'],
          })
          break
        case 'where':
          // show  templates after selecting template
          // TODO--list only orgs with write access, change query in QUERIES accordingly
          if (answer === 'my git') {
            // create a repo
            createRepo(process.env.USERID, 'user', null)
            // if (template) {
            //   //TODO -- make call to create a repo from a template
            // } else {
            //   //TODO--create a repo,
            //   //    --Ask user if readme liscence etc need be created
            // }
          } else {
            /**
             * @type {String}
             */
            const [orgName, orgId] = await getOrgId()
            createRepo(orgId, 'org', orgName)
            // list orgs
          }
          break
        default:
          break
      }
    },
    error: () => {},
    complete: (c) => {
      console.log(c)
    },
  })
}

function CreateNewProject() {
  console.log('Creating new project')
  inquirer.registerPrompt('file-tree-selection', require('inquirer-file-tree-selection-prompt'))
  inquirer.registerPrompt('customList', require('../utils/customList'))

  /**
   * @type {Subscriber}
   */
  let Emitter
  const stream = new Observable((obs) => {
    Emitter = obs
    obs.next({
      type: 'list',
      message: 'where to create repo',
      name: 'where',
      choices: ['my git', 'org git'],
    })
  })
  inquirer.prompt(stream).ui.process.subscribe({
    next: async (ans) => {
      const { name, answer } = ans
      switch (name) {
        case 'where':
          // TODO--list only orgs with write access, change query in QUERIES accordingly
          if (answer === 'my git') {
            // create a repo
            createRepo(process.env.USERID, 'user', null)
            //   //TODO--create a repo,
            //   //    --Ask user if readme liscence etc need be created
          } else {
            /**
             * @type {String}
             */
            const [orgName, orgId] = await getOrgId()
            createRepo(orgId, 'org', orgName)
          }
          break
        default:
          break
      }
    },
    error: () => {},
    complete: (c) => {
      console.log(c)
    },
  })
}

const getAllFilesRecursively = function (dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath)
  arrayOfFiles = arrayOfFiles || []
  files.forEach((file) => {
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles = getAllFilesRecursively(`${dirPath}/${file}`, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, '/', file))
    }
  })
  return arrayOfFiles
}

function convert() {
  const gitsubmodules = fs.readFileSync(path.resolve('.thefile'), {
    encoding: 'utf-8',
  })
  // console.log(gitsubmodules);
  const regExp = /\[submodule\s*"(?<name>(.*?))"]\s*path\s=\s(?<path>[a-zA-Z_]+)\s*url\s=\s(?<url>[a-zA-Z_:/.-]+)/g
  const matches = gitsubmodules.matchAll(regExp)
  // console.log(matches);
  for (const iterator of matches) {
    // console.log(iterator);
    console.log(iterator.groups)
  }
}

// eslint-disable-next-line no-unused-vars
async function fieldTestOLD(dirName) {
  /**
   * @typedef DirData
   * @type {Object}
   * @property {Number} dirs
   * @property {Number} files
   */
  /**
   * @type {String|DirData}
   */
  const penv = isDirClean(path.resolve(dirName))
  /**
   * If an env file is found and has "appblox specific key" set
   * (Which is a TODO)
   * Then, ask whether to delete all files and create new project,
   * or continue
   */
  if (typeof penv === 'string') {
    try {
      const config = JSON.parse(fs.readFileSync(path.join(penv, 'appblox.config.json')))
      // const trr = dotEnv.config({ path: path.join(penv, '.env') })
      if (config) {
        const prname = process.env.PROJECT
        console.log(`Found project ${chalk.gray(prname)}`)
      }
    } catch (e) {
      console.log(e)
    }
  } else {
    // if the dir only contains directories and no files,
    // and user is trying to create project not in current dir then createnewproject.
    if (penv.files === 0 && penv.dirs) {
      if (dirName !== '.') return true
    }
    if (!penv.files && !penv.dirs) {
      console.log('target is clean,creating project..')
      return true
    }
  }
  /**
   * If not string, then must be a truthy value, so not 0
   */
  // if there are no files in the directory and a new directory is going to be created,
  // then no need to wipe.
  const { wipeAll } = await WipeAllConfirmation()
  if (wipeAll) {
    wipeAllFilesIn(process.cwd())
    return true
  }
  // TODO-- Display current project details here if existing project is found
  // Might not always contain projects, so handle the Update project logic here itself.
  // console.log("Current project details-")
  // console.log("User - ", process.env.USER)
  // console.log("Project - ", process.env.PROJECT)
  // console.log("Paths and such here")
  return false
}

async function fieldTest(dirName) {
  const penv = isDirClean(path.resolve(dirName))
  if (!penv) {
    const { wipeAll } = await WipeAllConfirmation()
    if (wipeAll) {
      wipeAllFilesIn(process.cwd())
      return true
    }
    return false
  }
  return true
}

function tryGitInit() {
  try {
    execSync('git --version', { stdio: 'ignore' })
    if (isInGitRepository()) {
      return false
    }

    execSync('git init', { stdio: 'ignore' })
    return true
  } catch (e) {
    console.warn('Git repo not initialized', e)
    return false
  }
}

const start = async (key, dir) => {
  try {
    // if a new project then env parent directory might be missing, to avoid error in OTPConfirmation
    if (key === 'newproject') {
      pathToJSON = path.resolve(dir, 'appblox.config.json')
      createFileSync(pathToJSON)
    } else {
      // we are executing all appblox commands inside appblox initiated projects,
      // which should be having config file
      pathToJSON = path.resolve('appblox.config.json')
      APPCONFIG = JSON.parse(fs.readFileSync(pathToJSON))
    }

    const { redoAuth } = await checkAndSetAuthOLD()
    if (redoAuth) {
      const response = await axios.post(githubGetDeviceCode, {
        client_id: githubClientID,
        scope: 'repo,read:org',
      })
      await handleAuth(decodeURIComponent(response.data))
    }
    switch (key) {
      case 'newproject':
        // console.log(dir)
        // since env is created by OTPConfirmation in process.cwd(),
        // pathToENV = path.resolve(dir, ".env")
        // createFileSync(pathToENV)
        createprojectstructure(dir)
        console.log(chalk.green('Project created successfully'))
        break
      case 'updateproject':
        updateProjectDetails()
        break
      case 'newcomponent':
        // get the config and check if prefix is set else set
        APPCONFIG = JSON.parse(fs.readFileSync(pathToJSON))
        if (!APPCONFIG.preFix) {
          APPCONFIG.preFix = await getPrefix(`__${APPCONFIG.appName}__`)
        }
        // write prefix to json
        process.env.PREFIX = APPCONFIG.preFix
        fs.writeFileSync(pathToJSON, JSON.stringify(APPCONFIG))
        process.chdir(process.env.CLIENTHOUSE)
        if (!isInGitRepository()) throw new Error('Git not initialized')
        await createComponent(APPCONFIG)
        break
      default:
        break
    }
  } catch (e) {
    console.log('Something went wrong', e)
    process.exit(0)
  }

  // cpf.on('exit',(c)=>console.log('exited,c',c))
}

function updateProjectDetails() {
  /**
   * @type {Subscriber}
   */
  let Emitter
  const stream = new Observable((obs) => {
    Emitter = obs
    obs.next({
      type: 'confirm',
      name: 'changeUser',
      message: 'Change Logged in User',
    })
  })
  inquirer.prompt(stream).ui.process.subscribe({
    next: async (ans) => {
      const { name, answer } = ans
      switch (name) {
        case 'changeUser':
          if (answer) {
            console.log('Will run auth again here')
          }
          Emitter.next({
            type: 'file-tree-selection',
            name: 'changeHousing',
            message: 'Point me to house folder',
            onlyShowDir: true,
          })
          break
        case 'changeHousing':
          process.env.HF = answer
          fs.appendFileSync(path.resolve('./.env'), `\nHF=${answer}`)
          console.log('Update env with path -', answer)
          Emitter.next({
            type: 'input',
            name: 'changePrefix',
            message: 'new prefix word',
          })
          break
        case 'changePrefix':
          console.log('Update prefix here with-', answer)
          Emitter.complete()
          break
        default:
          break
      }
    },
    error: () => {},
    complete: (c) => {
      console.log('Project updated successfully')
      console.log(c)
    },
  })
}

function createprojectstructure(name) {
  const root = path.resolve(name)
  const appName = path.basename(root)
  // TODO--Check if parent name is okay here
  ensureDirSync(root)
  process.chdir(root)
  if (isGitInstalled()) {
    try {
      const clientHousePath = path.resolve('HouseClient')
      // execSync('git init', { stdio: 'ignore' })
      // console.log('git initialised')
      fs.mkdirSync(clientHousePath)
      process.chdir(clientHousePath)
      execSync('git init', { stdio: 'ignore' })
      const config = JSON.parse(fs.readFileSync(pathToJSON))
      const c = {
        ...config,
        appName,
        clientHouse: [clientHousePath],
      }
      fs.writeFileSync(pathToJSON, JSON.stringify(c))
    } catch (e) {
      console.log(e)
    }
  } else {
    console.error('Git not installed')
  }
}

async function checkAndSetAuthOLD() {
  try {
    const r = JSON.parse(fs.readFileSync(pathToJSON))
    // set value to process env here.
    // TODO -- use json to env converting library or write one new
    process.env.TOKEN = r.token
    process.env.USER = r.user
    process.env.USERID = r.userId
    process.env.CLIENTHOUSE = r.clientHouse
    process.env.PREFIX = r.preFix
    // make call to check if the user has revoked access,
    // if not log the signed in name.
    // else redo auth
    const { user } = await getGithubSignedInUser(process.env.TOKEN)
    if (user && correctCredsInEnv(user.userName, user.userId)) {
      console.log(`Signed in as ${chalk.whiteBright(user.userName)}`)
      return { redoAuth: false }
    }
    console.log('Not signed in, redirecting to signin!')
    return { redoAuth: true }
  } catch (e) {
    // console.log(chalk.red("Error reading JSON file:\n"), e.message);
    fs.unlinkSync(pathToJSON)
    console.log(chalk.red('Not signed in!'))
    return { redoAuth: true }
  }
}

/**
 * Checks if Name and Id returned for given token is same as present in env
 * @param {string} name Login name returned from github for present token
 * @param {string} id Id for the token present in env
 * @returns {Boolean}
 */
function correctCredsInEnv(name, id) {
  return process.env.USER === name && process.env.USERID === id
}

const handleAuth = async (data) => {
  // INFO -- since the below code is not in try block,
  // if any part errors, process.exit in the outer catch might not kill
  // the timerThread.. "OTPExpired!!" might appear randomly
  // TODO -- kill unkilled thread
  const OTPresponse = parseResponse(data)
  const userCode = OTPresponse.user_code
  const expiresIn = OTPresponse.expires_in
  console.log('\n')
  console.log('Please go to https://github.com/login/device, and paste the below code.')
  await Figlet(userCode)
  console.log('\n')
  pbcopy(userCode)
  console.log('\n')
  const timerThread = TimerThread(expiresIn)
  // const timerThread={killed:true} -- for token expired testing.
  console.log(`Code expires in ${chalk.bold(expiresIn)} seconds `)
  console.log('\n\n')
  await open(githubDeviceLogin)
  const Cdata = {
    client_id: githubClientID,
    device_code: OTPresponse.device_code,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  }
  const done = await OTPConfirmation(Cdata, githubGetAccessToken, timerThread, pathToJSON)
  if (done) return

  console.log('something went wrong')
  process.exit(0)
}

function TimerThread(seconds) {
  const cpf = fork(path.join(__dirname, 'timer.js'), [seconds])
  // console.log('pid-',cpf.pid);
  // console.log('Thread started for ', seconds);
  cpf.on('message', (m) => {
    // console.log(m);
    if (m === 'STOP') {
      process.exit(0)
    }
  })
  // cpf.on('close',(c)=>console.log('timer stopped',c))
  // cpf.on('exit',(c)=>console.log('timer stopped',c))
  return cpf
}

function isInGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

function isGitInstalled() {
  try {
    execSync('git --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}
