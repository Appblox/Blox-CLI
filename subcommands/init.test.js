/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable */

const path = require('path')
const fs = require('fs')
const { isDirClean, wipeAllFilesIn, createFileSync } = require('../utils/fileAndFolderHelpers')
const isValidAppBloxProject = require('../utils/isValidAppBloxProject')
const { getBloxType, getBloxName, WipeAllConfirmation } = require('../utils/questionPrompts')
const Init = require('./init')
const createBlox = require('../utils/createBlox')

const [p1, p2, ...rest] = process.argv
const ARGSWITHOUTTYPE = [p1, p2, 'TODO']
const ARGSWITHTYPE = [p1, p2, 'TODO', '--type', 'uicontainer']
const DIRPATH = path.resolve('.')
const CONFIGPATH = path.join(DIRPATH, 'appblox.config.json')

jest.mock('../utils/questionPrompts')
jest.mock('../utils/fileAndFolderHelpers')
jest.mock('../utils/isValidAppBloxProject')
jest.mock('../utils/createBlox')

afterAll(() => jest.clearAllMocks())
afterEach(() => {
  WipeAllConfirmation.mockClear()
  getBloxType.mockClear()
  getBloxName.mockClear()
  createBlox.mockClear()
})
// order of tests is very important here,
// for first two tests, type is not cleared so calling with type first will
// fail the next test,
// mock of isDirClean returns false first and true second

test('Should prompt for type', async () => {
  isDirClean.mockReturnValue(true)
  await Init(ARGSWITHOUTTYPE)
  expect(getBloxType).toHaveBeenCalledTimes(1)
})
test('Should try to create config file', async () => {
  createFileSync.mockReset()
  getBloxName.mockResolvedValue('test1')
  getBloxType.mockResolvedValue('test2')
  const d = {
    name: 'test1',
    type: 'test2',
  }
  await Init(ARGSWITHOUTTYPE)
  expect(createFileSync).toHaveBeenCalledWith(CONFIGPATH, d)
})
test('Should not prompt for type', async () => {
  isDirClean.mockReturnValue(true)
  await Init(ARGSWITHTYPE)
  expect(getBloxType).not.toBeCalled()
})

test('Should prompt for blox name', async () => {
  isDirClean.mockReturnValue(true)
  await Init(ARGSWITHTYPE)
  expect(getBloxName).toBeCalled()
})

test('Should check if Dir is clean', async () => {
  await Init(ARGSWITHTYPE)
  expect(isDirClean).toHaveBeenCalled()
})

describe('If Dir is clean', () => {
  beforeAll(() => {
    isDirClean.mockClear()
    isValidAppBloxProject.mockReset()
  })
  test('Should not call isValidAppBloxProject', async () => {
    isDirClean.mockReturnValue(true)
    await Init(ARGSWITHTYPE)
    expect(isDirClean).toHaveReturnedWith(true)
    expect(isValidAppBloxProject).not.toHaveBeenCalled()
  })
})

describe('In unclean directory', () => {
  beforeAll(() => {
    isDirClean.mockClear()
    isDirClean.mockReturnValue(false)
  })

  test('Should call isValidAppBloxProject', async () => {
    await Init(ARGSWITHTYPE)
    expect(isDirClean).toHaveReturnedWith(false)
    expect(isValidAppBloxProject).toHaveBeenCalled()
  })

  describe('for valid appblox project', () => {
    beforeAll(() => {
      isValidAppBloxProject.mockClear()
      isValidAppBloxProject.mockReturnValue(true)

      fs.writeFileSync('appblox.config.json', JSON.stringify({ name: 'test', type: 'testType' }))
    })
    afterAll(() => {
      fs.rmSync('appblox.config.json')
    })
    test('Should not ask for wiping confirmation', async () => {
      await Init(ARGSWITHTYPE)
      expect(WipeAllConfirmation).not.toBeCalled()
      expect(getBloxType).not.toBeCalled()
      expect(getBloxName).not.toBeCalled()
    })
    test('Should call createBlox with test and testType', async () => {
      await Init(ARGSWITHTYPE)
      expect(WipeAllConfirmation).not.toBeCalled()
      expect(getBloxType).not.toBeCalled()
      expect(getBloxName).not.toBeCalled()
      expect(createBlox).toBeCalledWith('test', 'testType')
    })
  })

  describe('for non valid appblox project', () => {
    beforeAll(() => {
      isValidAppBloxProject.mockClear()
      isValidAppBloxProject.mockReturnValue(false)
    })
    afterEach(() => {
      wipeAllFilesIn.mockReset()
    })

    test('Should ask for wiping confirmation', async () => {
      WipeAllConfirmation.mockResolvedValue({ wipeAll: true })
      await Init(ARGSWITHTYPE)
      expect(WipeAllConfirmation).toBeCalled()
      expect(createBlox).toBeCalled()
    })

    test('Should wipe all, if confirmed', async () => {
      WipeAllConfirmation.mockResolvedValue({ wipeAll: true })
      await Init(ARGSWITHTYPE)
      expect(wipeAllFilesIn).toBeCalled()
      expect(createBlox).toBeCalled()
    })

    test('Should not wipe all, if not confirmed', async () => {
      WipeAllConfirmation.mockResolvedValue({ wipeAll: false })
      await Init(ARGSWITHTYPE)
      expect(wipeAllFilesIn).not.toBeCalled()
      expect(createBlox).not.toBeCalled()
    })
  })
})
