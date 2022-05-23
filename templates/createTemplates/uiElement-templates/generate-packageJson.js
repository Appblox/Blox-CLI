/* eslint-disable */

const generateUiElementPackageJson = (name) => `{
    "name": "${name}",
    "version": "0.0.1",
    "description": "",
    "main": "index.js",
    "scripts": {
      "start": "webpack-dev-server"
    },
    "keywords": [],
    "type": "module",
    "author": "",
    "license": "ISC",
    "devDependencies": {
      "@babel/core": "^7.14.3",
      "@babel/preset-react": "^7.13.13",
      "babel-loader": "^8.2.2",
      "css-loader": "^6.2.0",
      "dotenv": "^16.0.0",
      "html-webpack-plugin": "^5.3.1",
      "style-loader": "^3.2.1",
      "webpack": "^5.52.0",
      "webpack-cli": "^4.8.0",
      "webpack-dev-server": "^4.1.0"
    },
    "dependencies": {
      "react": "^17.0.2",
      "react-dom": "^17.0.2",
      "blox-js-sdk": "git+https://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:x-oauth-basic@github.com/Appblox/blox-js-sdk.git",
      "ab-federation-helpers":"git+https://github.com/Appblox/ab-federation-helpers.git",
      "node-blox-sdk": "git+https://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:x-oauth-basic@github.com/Appblox/node-blox-sdk.git"
    }
  }
  `

module.exports = { generateUiElementPackageJson }
