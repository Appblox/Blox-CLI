const chalk = require('chalk')
const { fork, execSync } = require('child_process')
const path = require('path')

class BloxPusher {
  constructor(blox, bar) {
    this.bloxMeta = blox
    this.bloxPath = blox.directory
    this.bloxName = blox.meta.name
    this.bloxSource = blox.meta.source
    this.progress = bar.create(10, 0, {
      // TODO -- change this to a dynamic bar, so no need to give the length(10) here
      // it could be any number
      status: 'starting..',
      blox: this.bloxName,
    })
    this.report = { name: this.bloxName, data: { message: '' } }
  }

  push(...args) {
    // console.log('push args', args)
    return new Promise((res, rej) => {
      this.child = fork(path.join(__dirname, 'bloxPushProcess.js'), {})
      const payload = { blox: this.bloxName }
      this.child.on('message', ({ failed, message, errorCode }) => {
        if (!failed) {
          this.progress.increment(1, { status: message, ...payload })
        } else {
          if (errorCode) {
            // in case push is failed, reset commit so user can re-run push again,
            // and the repo wont be clean at that time
            execSync('git reset HEAD~1', { cwd: this.bloxPath })
          }
          this.report.data = { message }
        }
      })
      this.child.on('error', () => {
        // If forking failed, show a message to rerun
        this.report.data = {
          message: ` Failed to run push for ${chalk.whiteBright(this.bloxName)}\nPlease run ${chalk.italic(
            `blox push ${this.bloxName}`
          )} manually.`,
        }
      })
      this.child.on('exit', (code) => {
        if (code === 1) {
          this.progress.update({ status: 'failed', ...payload })
          this.progress.stop()
          rej(this.report)
        } else {
          this.progress.update(10, { status: 'success', ...payload })
          this.progress.stop()
          res(this.report)
        }
      })
      // send a msg to start
      this.child.send({
        bloxPath: this.bloxPath,
        bloxName: this.bloxName,
        bloxSource: this.bloxSource,
        ...args[0],
      })
    })
  }
}

module.exports = { BloxPusher }
