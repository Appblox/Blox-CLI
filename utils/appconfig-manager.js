/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-async-promise-executor */
const { readFileSync, writeFile } = require('fs')
const path = require('path')
const { EventEmitter } = require('events')
const { getBloxDetails } = require('./registryUtils')

function debounce(func, wait, immediate) {
  let timeout

  return function executedFunction() {
    const context = this
    // eslint-disable-next-line prefer-rest-params
    const args = arguments

    // eslint-disable-next-line func-names
    const later = function () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)

    timeout = setTimeout(later, wait)

    if (callNow) func.apply(context, args)
  }
}
/**
 * Expects to find a webpack config at the given path, reads and returns port set in devServer or 300
 * @param {String} dir Directory path to blox
 * @returns {Number} Port Number
 */
const getPortFromWebpack = async (dir) => {
  let wb = ''
  // NOTE: Since webpack is mostly ESM, only way to import to
  // CJS(this is CJS) is to use dynamic import, CAN'T USE REQUIRE
  try {
    wb = await import(path.resolve(dir, 'webpack.config.js'))
  } catch (err) {
    // console.log(err)
    wb = { default: { devServer: { port: 3000 } } }
  }
  return wb.default.devServer.port || 3000
}
class AppbloxConfigManager {
  constructor() {
    // eslint-disable-next-line no-bitwise
    this.Id = Math.floor(Math.random() * 10 ** 18 + (1 << (Math.random() * 90)))
    this.bloxConfigName = 'blox.config.json'
    this.configName = 'appblox.config.json'
    this.liveConfigName = '.appblox.live.json'
    this.liveDetails = {}
    this.cwd = '.'
    this.events = new EventEmitter()
    // this.events.on('write', () => this._write())
    this.events.on('write', debounce(this._write, 800).bind(this))
    // this.events.on('liveChanged', () => this._writeLive())
    this.events.on('liveChanged', debounce(this._writeLive, 800).bind(this))

    // this.events.on('updateBloxWrite', debounce(this._updateBloxWrite, 800).bind(this))

    this.config = ''
  }

  // ------------------------------ //
  // -----------GETTERS------------ //
  // ------------------------------ //

  get appConfig() {
    return this.getAppConfig()
  }

  get prefix() {
    if (this.config?.bloxPrefix) return this.config.bloxPrefix
    return ''
  }

  set prefix(val) {
    this.config.bloxPrefix = val
  }

  get liveBloxes() {
    const filter = (blox) => blox.isOn
    return this.getDependencies(true, filter)
  }

  get nonLiveBloxes() {
    const filter = (blox) => !blox.isOn
    return this.getDependencies(true, filter)
  }

  get uiBloxes() {
    const filter = (blox) => ['ui-container', 'ui-elements'].includes(blox.meta.type)
    return this.getDependencies(false, filter)
  }

  get fnBloxes() {
    const filter = (blox) => ['function'].includes(blox.meta.type)
    return this.getDependencies(false, filter)
  }

  get allBloxNames() {
    const picker = (blox) => blox.meta.name
    return this.getDependencies(false, null, picker)
  }

  get env() {
    if (this.config.env) return this.config.env
    return null
  }

  // ------------------------------ //
  // -----------SETTERS------------ //
  // ------------------------------ //

  set env(envObj) {
    if (typeof envObj === 'object') this.config.env = { ...envObj }
    else {
      throw new TypeError(`Expected env to be an Object, received env is of type ${typeof envObj}`)
    }
  }

  set stopBlox(bloxname) {
    const stop = {
      pid: null,
      isOn: false,
    }
    this.liveDetails[bloxname] = { ...this.liveDetails[bloxname], ...stop }
    this.events.emit('liveChanged')
  }

  set startedBlox({ name, pid, port, log }) {
    const start = {
      pid,
      port,
      isOn: true,
      ...(log && { log }),
    }
    this.liveDetails[name] = { ...this.liveDetails[name], ...start }
    this.events.emit('liveChanged')
  }

  async init(cwd, configName, subcmd) {
    if (this.config) {
      return
    }
    this.configName = configName || 'appblox.config.json'
    this.cwd = cwd || '.'
    this.subcmd = subcmd || null

    // console.log(path.resolve(this.cwd, this.configName))

    try {
      this.readAppbloxConfig()
      // console.log('Config Read:')
      // console.log(this.config)
      // console.log('\n')

      await this.readLiveAppbloxConfig()
      // console.log('Live Config Read:')
      // console.log(this.liveDetails)
      // console.log('\n')
    } catch (err) {
      if (this.subcmd === 'create') {
        throw err
      } else {
        console.log(err.message)
        process.exit(1)
      }
    }
  }

  readAppbloxConfig() {
    try {
      // console.log(`Trying to read config file from ${path.resolve(this.cwd)}`)
      this.config = JSON.parse(readFileSync(path.resolve(this.cwd, this.configName)))
      // console.log('Config read ')
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`Couldnt find config file in ${path.resolve(this.cwd)}`)
      }
    }
  }

  async readLiveAppbloxConfig() {
    try {
      const existingLiveConfig = JSON.parse(readFileSync(path.resolve(this.cwd, this.liveConfigName)))
      for (const blox of this.dependencies) {
        // TODO -- if there are more bloxes in liveconfig json,
        // Log the details and if they are on, kill the processes
        const {
          meta: { name },
        } = blox
        if (existingLiveConfig[name]) {
          // console.log(`${name} exists in live as well:`)
          // console.log('\n')
          const { log, isOn, pid, port } = existingLiveConfig[name]
          this.liveDetails[name] = {
            log: log || {
              out: `./logs/out/${name}.log`,
              err: `./logs/err/${name}.log`,
            },
            isOn: isOn || false,
            pid: pid || null,
            port: port || null,
          }
        } else {
          // console.log(
          //   `Existing live config doesn't have details of ${blox.meta.name}`
          // )
          let p = 3000
          if (this.isUiBlox(name)) {
            p = await getPortFromWebpack(this.getBlox(name).directory)
          }
          this.liveDetails[name] = {
            log: {
              out: `./logs/out/${name}.log`,
              err: `./logs/err/${name}.log`,
            },
            isOn: false,
            pid: null,
            port: p,
          }
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('Couldnt find live config')
        // throw new Error(`Couldnt find liveconfig file in ${this.cwd}`)
        let entryCount = 0
        for await (const bloxname of this.allBloxNames) {
          entryCount += 1
          let p = 3000
          if (this.isUiBlox(bloxname)) {
            p = await getPortFromWebpack(this.getBlox(bloxname).directory)
          }
          console.log(p)
          this.liveDetails[bloxname] = {
            log: {
              out: `./logs/out/${bloxname}.log`,
              err: `./logs/err/${bloxname}.log`,
            },
            isOn: false,
            port: p,
            pid: null,
          }
        }
        if (entryCount) {
          console.log('formed livedata and updating to live data file...')
          await this._writeLive()
        }
      }
    }
  }

  _createLiveConfig() {
    const liveConfig = {}
    for (const blox of this.dependencies) {
      liveConfig[blox.meta.name] = {
        ...blox,
        ...this.liveDetails[blox.meta.name],
      }
    }
    return liveConfig
  }

  _writeLive() {
    // if (this.writeLiveSignal && !this.writeLiveSignal.aborted) {
    //   this.writeController.abort()
    // }
    // eslint-disable-next-line no-undef
    // this.writeController = new AbortController()
    // this.writeLiveSignal = this.writeController.signal
    writeFile(
      path.resolve(this.cwd, this.liveConfigName),
      JSON.stringify(this._createLiveConfig(), null, 2),
      { encoding: 'utf8' },
      (err) => {
        if (err && err.code !== 'ABORT_ERR') console.log('Error writing live data ', err)
      }
    )
  }

  /**
   *
   */
  _write() {
    // if (this.writeSignal && !this.writeSignal.aborted) {
    //   // console.log('Previous write in progress, aborting')
    //   this.writeController.abort()
    // }
    // eslint-disable-next-line no-undef
    // this.writeController = new AbortController()
    // this.writeSignal = this.writeController.signal
    writeFile(
      path.resolve(this.cwd, this.configName),
      JSON.stringify(this.config, null, 2),
      { encoding: 'utf8' },
      (_) => _
    )
  }

  /**
   * Write emiter for update blox in blox config and appblox config
   */
  async _updateBloxWrite(bloxDir, bloxMeta) {
    // Update appblox config
    return new Promise((resolve) => {
      writeFile(
        path.resolve(this.cwd, this.configName),
        JSON.stringify(this.config, null, 2),
        { encoding: 'utf8' },
        () => {
          // Update blox config
          writeFile(
            path.resolve(bloxDir, this.bloxConfigName),
            JSON.stringify(bloxMeta, null, 2),
            { encoding: 'utf8' },
            () => {
              resolve(true)
            }
          )
        }
      )
    })
  }

  /**
   *
   * @returns
   */
  getAppConfig() {
    return this.config
  }

  /**
   *
   * @param {*} bloxConfig
   */
  addBlox(bloxConfig) {
    // TODO -- use a validation function to validate bloxObj
    this.config.dependencies = { ...this.config.dependencies } // to initialize object if it is undefined
    this.config.dependencies[bloxConfig.meta.name] = { ...bloxConfig }
    this.events.emit('write')
  }

  /**
   *
   * @param {*} updateConfigData
   */
  updateBlox(name, updateConfigData) {
    return new Promise(async (resolve) => {
      this.config.dependencies = { ...this.config.dependencies }
      const { directory, meta } = this.config.dependencies[name]
      const newBloxConfigData = { ...meta, ...updateConfigData }
      this.config.dependencies[name].meta = newBloxConfigData
      await this._updateBloxWrite(directory, newBloxConfigData)
      resolve(true)
    })
  }

  /**
   *
   * @param {String} bloxName
   */
  // eslint-disable-next-line class-methods-use-this
  getBloxId(bloxName) {
    return new Promise(async (resolve) => {
      try {
        const resp = await getBloxDetails(bloxName)
        if (resp.status === 204) throw new Error(`${bloxName} doesn't exists in blox repository`).message

        const { data } = resp
        if (data.err) {
          throw new Error('Something went wrong from our side\n', data.msg).message
        }

        resolve(data.data.ID)
      } catch (err) {
        console.log(`Something went wrong while getting details of blox:${bloxName} -- ${err} `)
        resolve(null)
        process.exit(1)
      }
    })
  }

  /**
   *
   * @param {*} updateConfigData
   */
  updateAppBlox(updateConfigData) {
    this.config = { ...this.config, ...updateConfigData }
    this.events.emit('write')
  }

  get dependencies() {
    return this.getDependencies(false)
  }

  /**
   *
   * @param {Boolean} includeLive To include live details of blox in final result
   * @param {Function} filter
   * @param {Function} picker
   * @returns
   */
  *getDependencies(includeLive, filter, picker) {
    if (this.config?.dependencies) {
      for (const blox in this.config.dependencies) {
        if (Object.hasOwnProperty.call(this.config.dependencies, blox)) {
          const bloxDetails = includeLive ? this.getBloxWithLive(blox) : this.getBlox(blox)
          if (filter) {
            if (filter(bloxDetails)) {
              if (picker) {
                yield picker(bloxDetails)
              } else {
                yield bloxDetails
              }
            }
          } else if (picker) {
            yield picker(bloxDetails)
          } else {
            yield bloxDetails
          }
        }
      }
    } else {
      return []
    }
    return []
  }

  /**
   * Returns Null if blox is not found, else details
   * @param {String} bloxName Name of blox
   * @returns {Null|Object} Blox details
   */
  getBlox(bloxName) {
    if (!this.config?.dependencies) return null
    const {
      config: { dependencies },
    } = this
    if (dependencies[bloxName]) {
      return dependencies[bloxName]
    }
    return null
  }

  /**
   * To check if App has a blox registered in given name
   * @param {String} blox A blox name
   * @returns {Boolean} True if blox exists, else False
   */
  has(blox) {
    return !!this.config.dependencies[blox]
  }

  /**
   * To check if the given blox is live or not
   * @param {String} blox A blox name
   * @returns {Boolean} True if blox is live, else False
   */
  isLive(blox) {
    return this.liveDetails[blox].isOn
  }

  /**
   * To check if a blox is a ui blox or not (Doesn't check for existence)
   * @param {String} bloxname Name of blox to check if UI blox
   * @returns {Boolean}
   */
  isUiBlox(bloxname) {
    for (const blox of this.uiBloxes) {
      if (blox.meta.name === bloxname) return true
    }
    return false
  }

  /**
   *
   * @param {String} bloxname A blox name
   * @returns {Object}
   */
  getBloxWithLive(bloxname) {
    return { ...this.getBlox(bloxname), ...this.getLiveDetailsof(bloxname) }
  }

  /**
   *
   * @param {*} bloxname
   * @returns
   */
  getLiveDetailsof(bloxname) {
    return this.liveDetails[bloxname]
  }

  /**
   * To get the current appblox
   * @returns {String} Name of Appblox
   */
  getName() {
    return this.config.name || ''
  }

  getStatus() {
    console.log(this)
  }
}

module.exports = { AppbloxConfigManager }
