/* eslint-disable */

const checkAndSetAuth = jest.fn().mockResolvedValueOnce({ redoAuth: true })
module.exports = { checkAndSetAuth }
