// dotenv.js
import dotenv from 'dotenv'
import path from 'path'
const envPath = path.resolve() + '/.env'
dotenv.config({ path: envPath })
