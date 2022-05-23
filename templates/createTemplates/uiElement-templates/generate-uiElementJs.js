/* eslint-disable */

const generateUiElementJs = (name) => `import React from 'react'
// import env from 'env'
export const ${name} = () => {
  return (
   <p>Hello from ${name} </p>
  )
}
export default ${name}`

module.exports = { generateUiElementJs }
