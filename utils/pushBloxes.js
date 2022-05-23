const { BloxPusher } = require('./bloxPusher')
const { multibar } = require('./multibar')

/**
 *
 * @param {String} gitUserName Git username to add to local config
 * @param {String} gitUserEmail Git email to add to local config
 * @param {String} commitMessage Commit message to use while committing
 * @param {Array} bloxesToPush Array with blox meta data
 */
function pushBloxes(gitUserName, gitUserEmail, commitMessage, bloxesToPush) {
  return new Promise((res, rej) => {
    try {
      const pushReport = {}
      // If empty array is given throw
      if (bloxesToPush.length === 0) rej(new Error('No bloxes provided to push').message)

      const promises = []
      bloxesToPush.forEach((v) => {
        promises.push(
          new BloxPusher(v, multibar).push({
            gitUserEmail,
            gitUserName,
            commitMessage,
          })
        )
      })

      Promise.allSettled([...promises]).then((values) => {
        setTimeout(() => {
          const { success, failed } = values.reduce(
            (acc, v) => {
              // console.log(v)
              if (v.status === 'rejected') {
                pushReport[v.reason.name] = v.reason.data.message
                return { ...acc, failed: acc.failed + 1 }
              }
              return { ...acc, success: acc.success + 1 }
            },
            { success: 0, failed: 0 }
          )

          console.log('\n')
          console.log(`${success} bloxes pushed successfully,`)
          console.log(`${failed} bloxes failed to push..`)
          console.log('Check pushlogs for error details')

          console.log(pushReport)
          res('Completed push')
        }, 300)
      })
    } catch (err) {
      console.log(`Something went terribly wrong,\n${err}`)
    }
  })
}

module.exports = { pushBloxes }
