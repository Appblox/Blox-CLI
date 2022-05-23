import path from 'path'

// Path to shared directory
const getSharedPath = (options) => {
  const { dir, sharedFolder, relative } = options

  const currentDir = `${relative}/`.split(dir)[1]?.replace(/(?<=\/)(.*?)(?=\/)/g, '..')

  return `${relative}${currentDir || ''}../${sharedFolder}`
}

const getShared = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let relative = path.resolve()
      let sharedFolderPath = `${relative}/shared/index.js`

      const dirPaths = [
        {
          dir: 'functions',
          sharedFolder: 'functions/shared/index.js',
        },
        {
          dir: '._ab_em',
          sharedFolder: 'functions/shared/index.js',
        },
      ]

      for await (const pathData of dirPaths) {
        if (sharedFolderPath.includes(`/${pathData.dir}`)) {
          sharedFolderPath = getSharedPath({ ...pathData, relative })
          const sharedData = await import(sharedFolderPath)
          return resolve(sharedData.default)
        }
      }

      // For testing read shared folder in relative path
      const testSharedData = await import(sharedFolderPath)
      return resolve(testSharedData.default)
    } catch (error) {
      reject(error)
    }
  })
}

export default { getShared }
