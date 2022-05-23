const axios = require('axios')
const chalk = require('chalk')
const inquirer = require('inquirer')
const { Observable } = require('rxjs')

/* eslint-disable no-unused-vars */
// below imports only used for jsDoc type
const { Subscriber } = require('rxjs')
/* eslint-enable no-unused-vars */

const { appBloxCheckBloxNameAvailability } = require('./api')
const { getShieldHeader } = require('./getHeaders')

const headers = getShieldHeader()

/**
 * @type {Subscriber}
 */
let Emitter

const validateFn = function test(ans1) {
  const regex = /^[a-zA-Z-_0-9]+$/
  if (regex.test(ans1)) {
    return true
  }
  return 'Blox name should only contain alphabets, _ , -'
}

const stream = new Observable((obs) => {
  Emitter = obs
  obs.next({
    type: 'input',
    name: 'bloxName',
    message: 'Enter a new blox name',
    validate: validateFn,
  })
})

// eslint-disable-next-line consistent-return
async function check(name) {
  try {
    const res = await axios.post(
      appBloxCheckBloxNameAvailability,
      {
        blox_name: name,
      },
      { headers }
    )
    // console.log(res.data, 'in check')
    return !res.data.err
  } catch (err) {
    console.log(err)
    console.log('Something went wrong in bloxnameavailability check')
    process.exit(1)
  }
}
/**
 *
 * @param {String} passedName Name to check
 * @param {Boolean} bypassInitialCheck To bypass initial check and ask for a new name
 * @returns {String} An available name
 */
async function checkBloxNameAvailability(passedName, bypassInitialCheck) {
  if (!bypassInitialCheck) {
    const a1 = await check(passedName)
    if (a1) return passedName
    console.log(chalk.red('Name not available!'))
  }
  // TODO -- change this to async/await
  return new Promise((res, rej) => {
    let availableName
    inquirer.prompt(stream).ui.process.subscribe({
      next: async (ans) => {
        const { answer } = ans
        // console.log(ans)
        const a = await check(answer)
        if (a) {
          // console.log('Name available!')
          availableName = answer
          Emitter.complete()
        } else {
          console.log(chalk.red('Name not available!'))
          Emitter.next({
            type: 'input',
            name: 'bloxName',
            message: 'Enter another blox name',
            askAnswered: true,
            validate: validateFn,
          })
        }
      },

      error: (err) => {
        console.log('Error: ', err)
        rej(passedName)
      },
      complete: () => {
        res(availableName)
      },
    })
  })
}

module.exports = checkBloxNameAvailability
