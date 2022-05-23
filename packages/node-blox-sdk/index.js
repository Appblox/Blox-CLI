import functions from './functions/index.js'
import shield from './shield/index.js'
import internals from './internals/index.js'
import env from './env/index.js'
import shared from './shared/index.js'

const { run } = functions
const { getUID, getUser } = shield
const { initialize } = internals
const { init: envInit } = env
const { getShared } = shared

// For named export
export { functions, run, shield, getUID, getUser, internals, initialize, env, envInit, shared, getShared }

// For whole sdk default export
export default { functions, shield, internals, env }
