const { existsSync, mkdirSync } = require('fs')

const checkLogDirs = () => {
  try {
    if (!existsSync('logs/out')) {
      mkdirSync('logs/out', { recursive: true })
    }
    if (!existsSync('logs/err')) {
      mkdirSync('logs/err', { recursive: true })
    }
  } catch (err) {
    console.log('Error in creating log dirs', err.message)
  }
}

module.exports = { checkLogDirs }
