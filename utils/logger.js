const { createLogger } = require('winston')

const logger = createLogger({
  transports: [
    //    new transports.Console()
    // new transports.File({ filename: 'combined.log' }),
  ],
})
module.exports = { logger }
