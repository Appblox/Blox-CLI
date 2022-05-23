/* eslint-disable */
const axios = require('axios')
const registerBlox = require('./registerBlox')

jest.mock('axios')

var deepEqual = function (x, y) {
  if (x === y) {
    return true
  } else if (typeof x == 'object' && x != null && typeof y == 'object' && y != null) {
    if (Object.keys(x).length != Object.keys(y).length) return false

    for (var prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!deepEqual(x[prop], y[prop])) return false
      } else return false
    }

    return true
  } else return false
}
const expectedKeys = ['blox_type', 'blox_name', 'blox_short_name', 'blox_desc', 'github_url', 'is_public']
const expectedData = {
  blox_type: 1,
  blox_name: 'xycvd',
  blox_short_name: 'validateData',
  is_public: false,
  github_url: 'www.something.com',
  blox_desc: 'a few words',
}
const inputData = {
  validateData: {
    correct: Object.assign({}, expectedData),
  },
}
const responses = {
  success: {
    err: false,
    msg: 'Blox Registered Successfully!!!',
    data: {
      CreatedAt: '2022-01-13T23:09:17.3184257+05:30',
      UpdatedAt: '2022-01-13T23:09:17.3184257+05:30',
      DeletedAt: null,
      ID: 'eMt59NdJJc-YxHXC8FyDo',
      BloxType: 1,
      BloxName: 'a_test_bloox',
      BloxShortName: 'atb',
      BloxDesc: 'this is an example blox',
      IsPublic: false,
      GitUrl: 'doesnt exist',
      Status: 1,
    },
  },
  fail: {
    err: true,
    msg: 'Blox name already exist!! Please try a different name',
  },
  wrongData: {
    err: true,
    msg: 'Wrong Data',
  },
}
describe('Tests for registerBlox', () => {
  axios.post.mockImplementation((c, v) => {
    switch (v.blox_short_name) {
      case 'validateData':
        if (deepEqual(v, expectedData)) return Promise.resolve({ data: responses.success })
        else {
          return Promise.resolve({ data: responses.wrongData })
        }
        break

      default:
        break
    }
  })

  test('Api called with correct data', async () => {
    const x = await registerBlox.apply(null, Object.values(inputData.validateData.correct))
    expect(x.err).toBe(false)
  })
})
