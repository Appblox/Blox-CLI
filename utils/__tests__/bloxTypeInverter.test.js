/* eslint-disable */

const { bloxTypeInverter } = require('../bloxTypeInverter')

test('Should return 1', () => {
  const ans = bloxTypeInverter('appBlox')
  expect(ans).toBe(1)
})

test('Should return "data"', () => {
  const ans = bloxTypeInverter(5)
  expect(ans).toBe('data')
})
