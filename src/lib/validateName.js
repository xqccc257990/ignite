const exitCodes = require('./exitCodes')
const prependIgnite = require('./prependIgnite')

/**
 * Checks whether a plugin name was given and errors if not.
 * Also prepends `ignite-*` if plugin name didn't include it.
 *
 * @param {String} rawPluginName The provided plugin name.
 * @param {Object} context The gluegun context.
 * @returns {String} The normalized name.
 */
const validateName = (rawPluginName, context) => {
  const { strings, print } = context
  const scopeRe = /^@([a-z0-9-_])\/(.*)/i
  const isScopedPackage = (pluginName) => {
    return scopeRe.test(pluginName)
  }

  var pluginName, scopeName

  if (isScopedPackage(rawPluginName)) {
    const matches = scopeRe.exec(rawPluginName)
    scopeName = matches[0]
    pluginName = matches[1]
  } else {
    pluginName = rawPluginName
  }

  if (strings.isBlank(pluginName)) {
    print.info(`ignite plugin new ignite-foo\n`)
    print.error('Plugin name is required')
    process.exit(exitCodes.PLUGIN_NAME)
  }

  // TODO: Make this better at detecting invalid plugin names
  if (!/^[a-z0-9].*/i.test(pluginName)) {
    print.error('Plugin name should be a valid folder name')
    process.exit(exitCodes.PLUGIN_NAME)
  }

  // Force prepend `ignite-*` to plugin name
  if (scopeName) {
    return `${scopeName}/${prependIgnite(pluginName)}`
  } else {
    return prependIgnite(pluginName)
  }

}

module.exports = validateName
