/* eslint-disable */
const { execSync, exec, spawn } = require('child_process')
const { rm, readFile } = require('fs/promises')
const { promisify } = require('util')
const path = require('path')
const { appConfig } = require('../utils/appconfigStore')
const { GitManager } = require('../utils/gitmanager')
const { createReadStream, watch } = require('fs')
const { Stream } = require('stream')
const readline = require('readline')

const pexec = promisify(exec)

const test = async (name) => {
  appConfig.init()
  if (appConfig.has(name)) {
    const {
      directory,
      meta: {
        source: { https, ssh },
      },
    } = appConfig.getBlox(name)
    const git = new GitManager(path.resolve(directory), ssh.split(':')[1], https)
    // git.stageAll()
    try {
      const res = await git.push()

      console.log('res', res)
    } catch (err) {
      console.log('Somehh', err.message)
    } finally {
      console.log('COMPLETED')
    }
  }
}
const spawner = (cwd, cmd, opts) => {
  console.log(`Installing in ${cwd}`)
  return new Promise((res, rej) => {
    const bat = spawn(cmd, opts, { cwd, stdio: 'ignore' })

    // bat.stdout.on('data', (data) => {
    //   console.log(data.toString())
    // })

    // bat.stderr.on('data', (data) => {
    //   console.error(data.toString())
    // })
    bat.on('exit', (code) => {
      console.log(`Child  exited with code ${code}`)
      if (code === 1) rej(new Error('s'))
      else res(0)
    })
  })
}
const pnpmTest = async ({ del }) => {
  console.time('start')
  appConfig.init()
  if (del) {
    for (const blox of appConfig.allBloxNames) {
      console.log()
      await rm(path.resolve(appConfig.getBlox(blox).directory, 'node_modules'), { recursive: true, force: true })
      await rm(path.resolve(appConfig.getBlox(blox).directory, 'pnpm-locak.yaml'), { recursive: true, force: true })
      // await spawner(appConfig.getBlox(blox).directory, 'rm', ['-r', 'node_modules/', 'pnpm-lock.yaml'])
      // execSync('rm -r node_modules/ pnpm-lock.yaml', { stdio: 'inherit', cwd: appConfig.getBlox(blox).directory })
    }
  } else {
    const ps = []
    for (const blox of appConfig.allBloxNames) {
      console.log(appConfig.getBlox(blox).directory)
      ps.push(pexec('pnpm i', { cwd: appConfig.getBlox(blox).directory }))
      // ps.push(spawner(appConfig.getBlox(blox).directory, 'pnpm', ['i']))
      // exec('pnpm i', { stdio: 'inherit', cwd: appConfig.getBlox(blox).directory })
    }
    await Promise.allSettled(ps).then((res) => console.log(res))
  }
  console.timeEnd('start')
}

const checknpm = () => {
  try {
    const x = execSync('pnpm -v')
    console.log(x.toString())
  } catch (err) {
    console.log(err)
  }
}
const wr = () => {
  const c = watch('t.log', (e, f) => {
    console.log(`${f} changed ${e}`)
  })
  const outStream = new Stream()
  const dr = createReadStream('t.log', { autoClose: false, encoding: 'utf8' })
    .on('data', (d) => console.log(d))
    .on('close', (s) => {
      console.log('ss', s)
      c.close()
    })
  dr.resume()
  const rl = readline.createInterface(dr, outStream)
  rl.on('line', (line) => {
    // console.log(line)
    if (line.includes('ERROR')) {
      console.log(fileName)
      console.log(line)
    }

    if (line.length >= 1) {
      // console.log(`${line.length}:${line}`)
    }
    if (line.length === 1) {
      console.log(`${line.length}:${line}`)
      // resolve('')
    }
  })

  // rl.on('error', reject)

  rl.on('close', () => {
    console.log('closed interface')
    dr.destroy()
    // outStream.off('')
    // outStream.
    outStream.off()
    resolve('')
  })
}
const w = () => {
  watch('t.log', (e, f) => {
    console.log(`${f} changed ${e}`)
  })
}
const rea = () => {
  createReadStream('t.log', { autoClose: false, encoding: 'utf8' }).on('data', (d) => console.log(d))
}
const r = (fileName, minLength) => {
  const inStream = createReadStream(fileName)
  const outStream = new Stream()
  let ERROR = false
  const res = { lastLine: '', errors: [] }
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface(inStream, outStream)

    let lastLine = ''
    rl.on('line', (line) => {
      // console.log(line)
      if (line.includes('ERROR')) {
        ERROR = true
        console.log(line)
      } else {
        if (ERROR) {
          res.errors.push(line)
        }
        ERROR = false
      }
      if (line.length >= minLength) {
        res.lastLine = line
      }
    })

    rl.on('error', reject)

    rl.on('close', () => {
      resolve(res)
    })
  })
}
const error = async () => {
  // const f = await readFile('t.log', { encoding: 'utf8' })
  r('t.log', 1)
    .then((lastLine) => {
      console.log(lastLine)
    })
    .catch((err) => {
      console.error(err)
    })
}

module.exports = wr
