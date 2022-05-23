/* eslint-disable */

module.exports = jest.fn((type, name, ...rest) => {
  if (name === 'success') {
    return Promise.resolve({ data: { err: false, msg: 'success' } })
  }
  if (name === 'fail') {
    return Promise.resolve({ data: { err: true, msg: 'fail' } })
  }
})
