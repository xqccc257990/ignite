module.exports = async function(context) {
  const { filesystem, print, prompt, system } = context
  const createIgniteLibrary = require('./createIgniteLibrary')
  const getLibraryComponent = require('./getComponent')
  const igniteLibraryDir = `${__dirname}/../../../ignite-library`
  const spinner = print.spin()
  
  await createIgniteLibrary(context, spinner, igniteLibraryDir)

  // Ask for component name
  const templateFilenameAns = await prompt.ask({
    type: 'input',
    name: 'location',
    message: 'What is the filename of your component? (.tsx optional)'
  })

  // Validate component name
  const componentNameMatch =
    templateFilenameAns.location &&
    templateFilenameAns.location.match(/^(\w+)(?:\.tsx)?$/)
  if (!componentNameMatch) {
    spinner.text = 'Component filename must have the form `name[.tsx]`'
    spinner.fail()
    process.exit(1)
  }
  const templateFilename = `${componentNameMatch[1]}.tsx`

  if (!templateFilename) {
    spinner.text = 'Component filename required'
    spinner.fail()
    process.exit(1)
  }

  // Ensure that component file exists
  // (file with name matching)
  spinner.text = `Finding your component ${templateFilename}`
  const componentPath = `${process.cwd()}/${templateFilename}`

  const componentFileExists = filesystem.exists(componentPath)
  
  // exit gracefully if not
  if (!componentFileExists) {
    spinner.fail()
    spinner.text = 'Input file doesn\'t exist, bailing out...\n(Note: must run this command from same directory as component)'
    spinner.fail()
    process.exit(1)
  }

  spinner.succeed()

  // show components in the index that the user has permission to edit
  const ownedIndex = JSON.parse(filesystem.read(`${igniteLibraryDir}/owned-components.json`)).ownedComponents
  const ownedFilter = component => {
    return ownedIndex.includes(component.gist)
  }
  const selectedGist = await getLibraryComponent(context, '', ownedFilter)
  console.log(selectedGist)

  spinner.stop()
  process.exit(1)
}