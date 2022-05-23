#!/usr/bin/env node
const path = require('path')
const { readFileSync, writeFileSync } = require('fs')
const { Command } = require('commander')

const program = new Command()

const create = async (args) => {
  program.parse(args)
  //   let componentName = program.args[0]
  //   let { type } = program.opts()
  const appConfig = JSON.parse(readFileSync('appblox.config.json'))
  console.log(appConfig)
  for (const blox in appConfig.dependencies) {
    if (Object.hasOwnProperty.call(appConfig.dependencies, blox)) {
      console.log('blox name:', blox)
      const bloxMeta = appConfig.dependencies[blox]
      console.log('resolved path', path.resolve(bloxMeta.directory, 'README.md'))
      writeFileSync(path.resolve(bloxMeta.directory, 'README.md'), new Date().toString())
    }
  }
}

// To avoid calling create twice on tests
if (process.env.NODE_ENV !== 'test') create(process.argv)

module.exports = { create }
