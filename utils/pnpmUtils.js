const { execSync } = require('child_process')

const checkPnpm = () => {
  try {
    execSync('pnpm -v', { stdio: 'ignore' })
    return true
    // console.log(`Seems like pnpm is installed`)
  } catch {
    return false
  }
}

module.exports = {
  checkPnpm,
}
