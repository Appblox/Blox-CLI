module.exports = { bloxTypeInverter }
const { bloxTypes } = require('./bloxTypes')

function bloxTypeInverter(type) {
  if (typeof type === 'string' || typeof type === 'number') {
    const s = bloxTypes.findIndex((v) => v[0] === type)
    const t = bloxTypes.findIndex((v) => v[1] === type)
    if (s >= 0) {
      return bloxTypes[s][1]
    }
    if (t >= 0) return bloxTypes[t][0]

    throw new Error(`Type(${type}) doesn't follow any predefined rules`)
  }
  throw new Error('Type must be a string or number')
}
