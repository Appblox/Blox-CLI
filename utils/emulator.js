import express from 'express'
import http from 'http'
import { readFile } from 'fs/promises'

const app = express()

app.all('/:route', async (req, res) => {
  const appConfig = JSON.parse(await readFile('./appblox.json', 'utf8'))
  const bloxes = Object.keys(appConfig)

  const requestedFunc = req.params.route
  console.log(requestedFunc)

  if (bloxes.includes(requestedFunc)) {
    const funcRoute = `${appConfig[requestedFunc].directory}/index.js`
    const handler = await import(funcRoute)
    await handler[requestedFunc](req, res)
  } else {
    res.send('requested function not registered in app.').status(404)
  }
})

const server = http.createServer(app)
server.listen(3000)
