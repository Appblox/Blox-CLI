/* eslint-disable */

const generateUiElementAppJs = (name) => `import React from 'react'
import ${name} from './${name}'
export default function App() {
  return (
    <div>
      <${name}/>
    </div>
  )
}
`

module.exports = { generateUiElementAppJs }
