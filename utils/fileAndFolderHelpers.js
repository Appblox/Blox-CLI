/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// eslint-disable-next-line no-unused-vars
const { default: axios } = require('axios')
const fs = require('fs')
const path = require('path')
const { noop } = require('rxjs')
const { appBloxGetPresignedUrlForReadMe } = require('./api')
const { BloxPushError } = require('./errors/bloxPushError')
const { getShieldHeader } = require('./getHeaders')

/**
 * Deletes files in a folder
 * @param {PathLike} dir Path to directory
 */
function wipeAllFilesIn(dir) {
  console.log('wiping in ', dir)
  const files = fs.readdirSync(dir)
  try {
    for (let i = 0; i < files.length; i += 1) {
      console.log('Removing ', path.join(dir, files[i]))
      fs.rmSync(path.join(dir, files[i]), { recursive: true, force: true })
    }
  } catch (e) {
    console.log('error deleting files')
  }
}

function isDirClean(dir) {
  try {
    const files = fs.readdirSync(dir)
    // console.log(files.length, 'klasdlaksd')
    if (files.length === 0) return true
    return false
  } catch (e) {
    if (e.code === 'ENOENT') return true
  }
  return false
}
/**
 * @param {PathLike} dir
 * @returns {String|Number} Path string if env is found, else object with number of directories and files
 */
function isDirCleanOLD(dir) {
  // const dir = process.cwd()
  try {
    const files = fs.readdirSync(dir)
    if (files.includes('appblox.config.json')) {
      return dir
    }
    return files.reduce(
      (acc, file) => {
        if (fs.statSync(path.resolve(file)).isDirectory()) return { ...acc, dirs: acc.dirs + 1 }
        return { ...acc, files: acc.files + 1 }
      },
      { dirs: 0, files: 0 }
    )
  } catch (e) {
    if (e.code === 'ENOENT') return { dirs: 0, files: 0 }
  }
  return { dirs: 0, files: 0 }
  // console.log(dir);
  // console.log(process.cwd());
  // if(dir===path.parse(process.cwd()).root) return
  // if(dir===path.parse(process.cwd()).root) return
  // try {
  //   const arrayOfFiles = fs.readdirSync(dir)
  //   console.log(arrayOfFiles)
  //   isDirClean(path.join(dir,"../"))
  // } catch(e) {
  //   console.log(e)
  // }
}

/**
 * Creates dir if not present
 * @param {PathLike} dir Path of directory
 * @returns
 */
function ensureDirSync(dir) {
  let stats
  try {
    stats = fs.statSync(dir)
  } catch {
    noop()
  }
  if (stats && stats.isDirectory()) return

  fs.mkdirSync(dir)
}

/**
 * Creates a file in the path provided, creates parent directory if
 * it is missing - not recursive, only one level
 * @param {String} filePath File path
 * @param {Object} [data] Data to be written
 * @returns
 */
function createFileSync(filePath, data) {
  let stats
  try {
    stats = fs.statSync(filePath)
  } catch {
    noop()
  }
  if (stats && stats.isFile()) return

  const dir = path.dirname(filePath)
  try {
    if (!fs.statSync(dir).isDirectory()) {
      // parent is not a directory
      // This is just to cause an internal ENOENT error to be thrown
      fs.readdirSync(dir)
    }
  } catch (err) {
    // If the stat call above failed because the directory doesn't exist, create it
    if (err && err.code === 'ENOENT') fs.mkdirSync(dir)
    else throw err
  }

  fs.writeFileSync(filePath, JSON.stringify(data))
}

function getBloxDirsIn(array) {
  const res = array.reduce((acc, v) => {
    try {
      const stat = fs.statSync(v)
      if (stat.isDirectory()) {
        const files = fs.readdirSync(v)
        // console.log('files in ' + v + ' are:\n', files)
        if (files.indexOf('blox.config.json') > -1) {
          return acc.concat(v)
        }
      }
    } catch (err) {
      console.log('Some thisn af', err)
    }
    return acc
  }, [])

  return res
}
function findBloxWithNameIn(name, dirs) {
  const res = dirs.reduce((acc, v) => {
    console.log('path name', path.resolve(v, 'blox.config.json'))
    try {
      const config = JSON.parse(fs.readFileSync(path.resolve(v, 'blox.config.json')))
      console.log(config, name)
      if (config.name === name) return acc.concat(v)
    } catch (err) {
      console.log('Something went wrong in bloxnamin', err)
    }
    return acc
  }, [])
  return res
}

/**
 *
 * @param {String} dir Path to dir
 * @param {String} bloxname Name of blox where fn is operating
 * @param {Boolean} showLogs To show internal messages
 * @returns Returns an array with path to readme in given dir
 */
function ensureReadMeIsPresent(dir, bloxname, showLogs) {
  const files = fs.readdirSync(dir)
  const readmes = files.reduce((acc, v) => {
    if (v.toLocaleLowerCase() === 'readme.md') return acc.concat(path.resolve(dir, v))
    return acc
  }, [])

  if (readmes.length > 1) {
    if (showLogs) {
      console.log('Found more than one readme.\n')
      console.log(readmes)
      console.log('Please keep only one and try again..')
    }
    throw new BloxPushError(dir, bloxname, 'Found Multiple readmes to push')
  } else if (readmes.length === 0) {
    throw new BloxPushError(dir, bloxname, 'No readme found..')
  } else {
    return readmes
  }
}

/**
 * @typedef uploadReadMeReturn
 * @property {String} status
 * @property {String} key
 * @property {String|Null} error
 */
/**
 *
 * @param {String} filePath File path
 * @returns {uploadReadMeReturn}
 */
async function uploadReadMe(filePath) {
  const result = { status: 'failed', key: '', error: '' }
  try {
    const {
      data: { url, key },
    } = await axios.post(
      appBloxGetPresignedUrlForReadMe,
      {},
      {
        headers: getShieldHeader(),
      }
    )
    result.key = key

    const file = fs.readFileSync(filePath, { encoding: 'utf8' })

    const res = await axios.put(url, file, {
      headers: {
        'content-type': 'text/markdown',
      },
    })
    if (res.status === 200) {
      result.status = 200
      result.error = null
    } else {
      result.status = res.status
      result.error = res.data.msg
    }
  } catch (err) {
    // console.log(err)
    // TODO -- throw a ShieldError from here
    result.error = err.response.data?.msg || err.message
    return result
  }
  return result
}

/**
 * Return a path string where to put blox of type in
 * @param {(1 | 2 | 3 | 4)} type Blox type
 * @returns dir path to pull blox to
 */
function createDirForType(type, cwd) {
  let dirPath = '.'
  switch (type) {
    case 1:
      break
    case 2:
      // ensureDirSync can create only one level if not present
      // so call for each level to make sure
      // TODO -- make ensureDirSync recursive (n level)
      ensureDirSync(path.resolve(cwd, 'view'))
      ensureDirSync(path.resolve(cwd, 'view', 'container'))
      // console.log('testpath', path.resolve(cwd, 'view', 'container'))
      dirPath = path.resolve(cwd, 'view', 'container')
      break
    case 3:
      ensureDirSync(path.resolve(cwd, 'view'))
      ensureDirSync(path.resolve(cwd, 'view', 'elements'))
      // console.log('testpath', path.resolve(cwd, 'view', 'elements'))
      dirPath = path.resolve(cwd, 'view', 'elements')
      break
    case 4:
      ensureDirSync(path.resolve(cwd, 'functions'))
      // console.log('testoath', path.resolve(cwd, 'functions'))
      dirPath = path.resolve(cwd, 'functions')
      break
    case 5:
      // console.log('you have entered unknown territory')
      process.exit(1)
      break
    case 6:
      ensureDirSync(path.resolve(cwd, 'functions'))
      ensureDirSync(path.resolve(cwd, 'functions', 'shared-fns'))
      // console.log('testpath', path.resolve(cwd, 'functions', 'shared-fns'))
      dirPath = path.resolve(cwd, 'functions', 'shared-fns')
      break
    default:
      console.log('Unknown type')
      process.exit(1)
  }
  return dirPath
}
/**
 *
 * @param {String} dirname
 * @param  {...any} acceptedItems List of accepted file or folder names
 * @returns {Boolean}
 */
function isDirEmpty(dirname, ...acceptedItems) {
  return fs.promises.readdir(dirname).then((files) => {
    console.log(acceptedItems)
    console.log(files)
    if (files.length === 0) {
      return true
    }
    if (files.some((item) => !acceptedItems.includes(item))) {
      return false
    }
    return true
  })
}

module.exports = {
  ensureDirSync,
  wipeAllFilesIn,
  createFileSync,
  isDirClean,
  isDirCleanOLD,
  getBloxDirsIn,
  findBloxWithNameIn,
  ensureReadMeIsPresent,
  uploadReadMe,
  createDirForType,
  isDirEmpty,
}
