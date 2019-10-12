// because left-pad will never be removed from NPM, right
const NPM_MODULE_NAME = 'left-pad'

const add = async function(toolbox) {
  const { ignite } = toolbox

  await ignite.addModule(NPM_MODULE_NAME)
}

const remove = async function(toolbox) {
  const { ignite } = toolbox

  await ignite.removeModule(NPM_MODULE_NAME)
}

module.exports = { add, remove }
