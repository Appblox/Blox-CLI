/* eslint-disable */

const { configstore } = require('../../configstore')
const { bloxTypeInverter } = require('../bloxTypeInverter')
const createBlox = require('../createBlox')
const { getPrefix } = require('../questionPrompts')
const registerBlox = require('../registerBlox')

jest.mock('../../configstore')
jest.mock('../questionPrompts')
jest.mock('../registerBlox')

afterEach(() => {
  jest.clearAllMocks()
})

const [p1, p2, ...rest] = process.argv
const sampleCreateBloxArgs = ['TODO', 'uicontainer']
const testData = [
  {
    args: ['TODO', 'appBlox'],
    expect: bloxTypeInverter('appBlox'),
  },
  {
    args: ['TODO', 'ui-container'],
    expect: bloxTypeInverter('ui-container'),
  },
  {
    args: ['TODO', 'ui-elements'],
    expect: bloxTypeInverter('ui-elements'),
  },
  {
    args: ['TODO', 'data'],
    expect: bloxTypeInverter('data'),
  },
  {
    args: ['TODO', 'shared-fn'],
    expect: bloxTypeInverter('shared-fn'),
  },
]

describe('For a ', () => {
  testData.forEach((obj) =>
    test('Should call registerBlox with ' + obj.expect, async () => {
      await createBlox.apply(null, obj.args)
      expect(registerBlox.mock.calls[0][0]).toBe(obj.expect)
    })
  )
})

test('Should check for stored prefix first', async () => {
  await createBlox.apply(null, sampleCreateBloxArgs)
  expect(configstore.get).toHaveBeenNthCalledWith(1, 'bloxPrefix', '')
})
test('Should get and set prefix if not present already', async () => {
  const userGivenPrefix = 'aPrefix'
  configstore.get.mockResolvedValue('')
  getPrefix.mockResolvedValue(userGivenPrefix)
  await createBlox.apply(null, sampleCreateBloxArgs)
  expect(getPrefix).toHaveBeenCalledTimes(1)
  expect(configstore.set).toHaveBeenCalledWith('bloxPrefix', userGivenPrefix)
})

test('Should not try to get prefix', async () => {
  configstore.get.mockResolvedValue('test')
  await createBlox.apply(null, sampleCreateBloxArgs)
  expect(getPrefix).not.toHaveBeenCalled()
})
