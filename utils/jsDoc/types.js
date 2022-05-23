/**
 * @typedef {Object} bloxMetaData
 * @property {String} CreatedAt
 * @property {String} UpdatedAt
 * @property {String| null} DeletedAt
 * @property {String} ID
 * @property {Number} BloxType
 * @property {String} BloxName
 * @property {String} BloxShortName
 * @property {String} BloxDesc
 * @property {Boolean} IsPublic
 * @property {String} GitUrl
 * @property {Number} Lang
 * @property {Number} Status
 * @property {Boolena} Verified
 */

/**
 * @typedef bloxSource
 * @type {Object}
 * @property {String} ssh SSH url to repo
 * @property {String} https HTTPS url to repo
 */

/**
 * @typedef {Object} dependecyMetaShape
 * @property {String} name Name of blox
 * @property {String} type Type of blox in String
 * @property {String} build Build command
 * @property {String} start Start command
 * @property {String} language Language
 * @property {String} postPull Post pull command
 * @property {bloxSource} source Source of blox
 */

/**
 * @typedef {Object.<...Object.<String,dependencyShape>>} dependencies
 */

/**
 * @typedef {Object} dependencyShape
 * @property {String} directory Local blox directory path
 * @property {dependecyMetaShape} meta Meata details of blox
 */

/**
 * @typedef {Object} appbloxConfigShape
 * @property {String} name Name of appblox
 * @property {String} type Type of blox, should be 'appBlox'
 * @property {String} bloxPrefix Prefix for blox repos
 * @property {bloxSource} source
 * @property {dependencies} dependencies
 */
