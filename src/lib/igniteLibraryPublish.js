module.exports = async function(context, gists) {
  const LIBRARY_INDEX_GIST = process.env['LIBRARY_INDEX_GIST'] || '4fe0dfd70e7556f62cccd24c96a06be2'
  const { filesystem, print, prompt, system } = context
  const createIgniteLibrary = require('./createIgniteLibrary')
  const igniteLibraryDir = `${__dirname}/../../ignite-library`
  const spinner = print.spin()

  await createIgniteLibrary(context, spinner, igniteLibraryDir)
  
  
  // Ask for component name
  const answer = await prompt.ask({
    type: 'input',
    name: 'location',
    message: 'Where is your component located (relative to cwd)?'
  })

  const templateFilename = answer.location + '.tsx'

  if (!templateFilename) {
    spinner.text = 'Component name required'
    spinner.fail()
    process.exit(1)
  }

  const newComponentNameAnswer = await prompt.ask({
    type: 'input',
    name: 'name',
    message: 'What is your component\'s name?'
  })
  const newComponentName = newComponentNameAnswer.name

  // Get the library index
  spinner.text = 'Getting component index'
  const componentIndex = JSON.parse(filesystem.read(`${igniteLibraryDir}/library-index.json`)).components
  spinner.succeed()

  // Check for existing component with same name + description combination
  spinner.text = 'Checking for conflicting component'
  const existingComponent = componentIndex.find( c => c.name === templateFilename )
  
  if (existingComponent) {
    spinner.fail()
    spinner.text = 'A component already exists with that name in this library!'
    spinner.fail()
    process.exit(1)
  }

  spinner.succeed()
  spinner.text = 'No conflict found!'
  spinner.succeed()

  // Ensure that component file exists
  // (file with name matching)
  spinner.text = 'Finding your component'
  const componentPath = `${process.cwd()}/${templateFilename}`

  const componentFileExists = filesystem.exists(componentPath)
  
  // exit gracefully if not
  if (!componentFileExists) {
    spinner.fail()
    spinner.text = 'Input file doesn\'t exist, bailing out...'
    spinner.fail()
    process.exit(1)
  }

  spinner.succeed()

  // Conditions are clear! We can add the component

  spinner.text = 'We are go for launch!'
  spinner.succeed()

  const descriptionResponse = await prompt.ask({
    type: 'input',
    name: 'description',
    message: 'Enter a description for your component'
  })
  const description = descriptionResponse.description

  // Create the component gist
  spinner.text = 'Adding component gist'
  try {
    const res = await gists.create({
      description: description,
      public: true,
      files: {
        [templateFilename]: {
          content: filesystem.read(componentPath),
        }
      }
    })

    const gistId = res.body.id

    // Add component to library index, stage, commit, and push
    componentIndex.push({
      name: templateFilename,
      description: description,
      gist: gistId,
      tags: '',
    })

  } catch (e) {
    console.log(e)
  }
  spinner.succeed()

  const newFileBody = JSON.stringify({components: componentIndex})
  
  filesystem.write(`${igniteLibraryDir}/library-index.json`, newFileBody)

  process.chdir(igniteLibraryDir)
  
  try {
    // NOTE not actually pushing up yet; just testing
    await system.run(`git add library-index.json && git commit -m "Added component ${templateFilename}"`)

    spinner.text = 'Updating library index'

    gists.edit(LIBRARY_INDEX_GIST, {
      description: 'Sample Ignite Library Index',
      files: {
        'library-index.json': {
          content: newFileBody,
          filename: 'library-index.json',
        }
      }
    })
  } catch (error) {
    spinner.fail()
    console.log('error', error)
  }

  spinner.succeed()

  process.chdir('..')


  // We're done!
  spinner.stop()
}