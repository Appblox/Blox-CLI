import dotenv from 'dotenv'
import path from 'path'

// Path to root directory env
const getEnvPath = (options) => {
  const { dir, envFileName, relative } = options

  const root = `${relative}/`.split(dir)[1].replace(/(?<=\/)(.*?)(?=\/)/g, '..')

  return `${relative}${root || ''}../${envFileName}`
}

// Setup environment
const init = () => {
  let relative = path.resolve()
  let envPath = `${relative}/.env`

  ;[
    {
      dir: 'functions',
      envFileName: '.env.functions',
    },
    {
      dir: '._ab_em',
      envFileName: '.env.functions',
    },
    {
      dir: 'view',
      envFileName: '.env.view',
    },
  ].some((pathData) => {
    if (!envPath.includes(`/${pathData.dir}`)) return false

    envPath = getEnvPath({ ...pathData, relative })
    return true
  })

  dotenv.config({ path: envPath })
}

export default { init }
