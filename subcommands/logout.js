#!/usr/bin/env node
const { Command } = require('commander')

const program = new Command()

// program
//   .option('-f, --force', 'force connect');

program.parse(process.argv)

// const args = program.args;
// configstore.delete('user')
//     configstore.delete('token')
console.log('Logout is not implemented yet!')
