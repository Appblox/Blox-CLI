const api = {}
// api.appBloxOrigin = `http://shield.appblox.io`
api.appBloxOrigin = `https://shield-dev.appblox.io`
api.appBloxLogin = `${api.appBloxOrigin}/login`
api.appBloxAccessToken = `${api.appBloxOrigin}/auth/device/get-token`

api.appBloxRegistryOrigin = `https://registry-dev.appblox.io`
api.appBloxCheckBloxNameAvailability = `${api.appBloxRegistryOrigin}/api/registry/v0.1/check-blox-name-availabilty`
api.appBloxRegister = `${api.appBloxRegistryOrigin}/api/registry/v0.0.1/register-blox`
api.appBloxEditBlox = `${api.appBloxRegistryOrigin}/api/registry/v0.0.1/edit-blox`
api.appBloxChangeBloxVisibility = `${api.appBloxRegistryOrigin}/api/registry/v0.1/change-blox-visibility`
api.appBloxAddBloxMapping = `${api.appBloxRegistryOrigin}/api/registry/v0.1/add-blox-mapping`
api.appBloxRemoveBloxMapping = `${api.appBloxRegistryOrigin}/api/registry/v0.1/add-blox-mapping`
api.appBloxGetBloxDetails = `${api.appBloxRegistryOrigin}/api/registry/v0.1/get-blox-details`
api.appBloxGetBloxMetadata = `${api.appBloxRegistryOrigin}/api/registry/v0.1/get-blox-metadata`
api.appBloxGetPresignedUrlForReadMe = `${api.appBloxRegistryOrigin}/api/registry/v0.1/create-readme-signed-url`
api.appBloxUpdateReadme = `${api.appBloxRegistryOrigin}/api/registry/v0.1/update-readme`
api.appBloxAddVersion = `${api.appBloxRegistryOrigin}/api/registry/v0.1/add-blox-version`
api.appBloxUpdateAppConfig = `${api.appBloxRegistryOrigin}/api/registry/v0.1/update-app-config`
api.appBloxGetAppConfig = `${api.appBloxRegistryOrigin}/api/registry/v0.1/get-app-config`
api.appRegistryAssignTags = `${api.appBloxRegistryOrigin}/api/registry/v0.1/assign-blox-tags`

const github = {}
github.githubOrigin = `https://github.com`
github.githubGraphQl = `https://api.github.com/graphql`
github.githubLogin = 'https://github.com/login'
github.githubDeviceLogin = `${github.githubLogin}/device`
github.githubGetDeviceCode = `${github.githubLogin}/device/code`
github.githubGetAccessToken = `${github.githubLogin}/oauth/access_token`
github.githubClientID = '5a77c38abd2e3e84d4e9'

module.exports = { ...api, ...github }
