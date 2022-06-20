/**
 * Copyright (c) Appblox. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs')
const fsPromise = require('fs/promises')

const { runBash } = require('../subcommands/bash')

async function copyEmulatorCode(PORT) {
  const emulatorCode = `

import express from 'express';
import http from 'http';
import cors from 'cors';
import { readFile } from 'fs/promises';

const app = express();
app.use(cors());

app.all("/*", async function (req, res) {
  try {
    const app_config = JSON.parse(await readFile('../appblox.config.json', "utf8"));
    const bloxes = app_config.dependencies

    const url = req.params[0];
    const [requested_func] = url.split("/");

    if (url.includes("health")) {
      //check for health param and inject if needed
      req.params["health"] = "health";
    }

    console.log("url", url);
    console.log("requested_func", requested_func);

    if (bloxes[requested_func]) {
      const dir = bloxes[requested_func].directory
      const func_route = "../" + dir + "/" + "index.js"
      const handler = await import(func_route)
      console.log("handler = ",handler)
      await handler.default(req, res)
    }
    else {
      res.send("requested function not registered in app.").status(404)
    }
  } catch(err) {
    console.error("Emulator error ", err)
    res.send("Something went wrong. Please check function log").status(500)
  }
});

const server = http.createServer(app);
server.listen(${PORT});
console.log("Functions emulator started on port ${PORT}");
`
  const packageJson = `
{
  "name": "appblox-emulator",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.17.2",
    "http": "0.0.1-security",
    "cors": "^2.8.5"
  }
}
`
  const gitignoreAddEm = `
  if grep -R "._ab_em" .gitignore
then
    echo "found emulator in gitignore"
else
    echo "._ab_em/*" >> .gitignore
fi
`
  await runBash('mkdir -p ._ab_em && cd ._ab_em && touch index.js && touch package.json')
  fs.writeFileSync('./._ab_em/index.js', emulatorCode)
  fs.writeFileSync('./._ab_em/package.json', packageJson)
  await runBash(gitignoreAddEm)

  return PORT
}
async function getEmulatorProcessData(rootDir) {
  const root = rootDir || '.'
  const emulatorProcessData = JSON.parse(await fsPromise.readFile(`${root}/._ab_em/.emconfig.json`, 'utf8'))
  return emulatorProcessData
}
function addEmulatorProcessData(processData) {
  fs.writeFileSync('./._ab_em/.emconfig.json', JSON.stringify(processData))
}
async function stopEmulator() {
  const processData = await getEmulatorProcessData()
  if (processData && processData.pid) {
    await runBash(`kill ${processData.pid}`)
  }
  await runBash('rm -rf ./._ab_em')
  console.log('emulator stopped successfully!')
}
module.exports = {
  copyEmulatorCode,
  addEmulatorProcessData,
  getEmulatorProcessData,
  stopEmulator,
}
