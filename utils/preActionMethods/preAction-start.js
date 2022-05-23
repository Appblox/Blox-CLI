const { existsSync, mkdirSync } = require('fs')

const checkLogDirs = (spinnies, name) => {
  try {
    if (!existsSync('logs/out')) {
      mkdirSync('logs/out', { recursive: true })
    }
    if (!existsSync('logs/err')) {
      mkdirSync('logs/err', { recursive: true })
    }
  } catch (err) {
    spinnies.fail(name, { text: 'Failed' })
    console.log('Error in creating log dirs', err.message)
  }
}

module.exports = { checkLogDirs }
