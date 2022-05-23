// eslint-disable-next-line prefer-destructuring
let duration = process.argv.slice(2)[0]
const Timer = setInterval(() => {
  if (duration) {
    duration -= 1
  } else {
    stop()
  }
}, 1000)
process.on('message', (m) => {
  // console.log(m);
  if (m === 'KILLTIMER') {
    clearInterval(Timer)
    process.exit(0)
  }
})
function stop() {
  clearInterval(Timer)
  console.log('OTP expired!!')
  process.send('STOP')
  process.exit(0)
}
