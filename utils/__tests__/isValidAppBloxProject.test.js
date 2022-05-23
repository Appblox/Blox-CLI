/* eslint-disable */

const fs = require('fs')
const isValidAppBloxProject = require('../isValidAppBloxProject')

const VALIDFILES = ['appblox.config.json']

jest.mock('fs')

afterEach(() => {
  jest.clearAllMocks()
})

test('Should call readDirSync with value passed to main fn', () => {
  fs.readdirSync.mockReturnValue(VALIDFILES)
  isValidAppBloxProject('dir')
  expect(fs.readdirSync).toHaveBeenCalledWith('dir')
})

test('Should check for appblox.config.json', () => {
  const spy = jest.spyOn(global.Array.prototype, 'includes')
  fs.readdirSync.mockReturnValue(VALIDFILES)
  isValidAppBloxProject('dir')
  expect(spy).toHaveBeenCalledWith('appblox.config.json')
  spy.mockRestore()
})

test('Should return false on ENOENT', () => {
  fs.readdirSync.mockImplementation(() => {
    let err = new Error('No such File or Directory')
    err.code = 'ENOENT'
    throw err
  })
  const res = isValidAppBloxProject('dir')
  expect(res).toBe(false)
})

test('Should check for type of project if config found', () => {})

test('Should validate mapping', () => {})
