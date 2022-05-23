/* eslint-disable no-console */
const figlet = require('figlet')

module.exports = function FigletAsync(n) {
  return new Promise((res) => {
    figlet(n, { font: 'Colossal' }, (err, data) => {
      if (err) {
        // console.log('Something went wrong...')
        // fallback print
        console.log(n)
        res()
      }
      console.log(data)
      res()
    })
  })
}
