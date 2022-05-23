/* eslint-disable */

const getGithubSignedInUser = jest.fn().mockResolvedValue({ user: { userId: 'r', userName: 'arjun' }, err: null })
const getAppBloxSignedInUser = jest.fn()

module.exports = {
  getGithubSignedInUser,
  getAppBloxSignedInUser,
}
