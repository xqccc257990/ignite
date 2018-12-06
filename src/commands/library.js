// @cliDescription  Component library
// @cliAlias l
// ----------------------------------------------------------------------------

/**
 * NOTES:
 * 
 * This POC is working (kinda).
 * 
 * ignite library button github=carlinisaacson
 * 
 * defaults to infinitered
 */
const LIBRARY_INDEX_GIST = process.env['LIBRARY_INDEX_GIST'] || '4fe0dfd70e7556f62cccd24c96a06be2'
const Gists = require('gists');
const gists = new Gists({
  token: process.env['IGNITE_GITHUB_TOKEN']
});
const getLibraryComponent = require('../lib/getLibraryComponent')
const completeLibraryTemplate = require('../lib/completeLibraryTemplate')
const createIgniteLibrary = require('../lib/createIgniteLibrary')

module.exports = async function (context) {
  const { parameters, filesystem, print, prompt, system } = context

  const searchTerm = parameters.third

  switch (parameters.second.toLowerCase()) {
    case 'search':
      if (!searchTerm) {
        print.error('')
        print.error(`You must enter a search term (e.g. 'datepicker')`)
        print.error('')
      }

      // go out and get the Infinite Red component library
      const selectedGist = await getLibraryComponent(context, searchTerm)

      // have a new gist, now fill out the template
      print.info('')
      print.info(`Generating component`)
      print.info('')

      const genFile = await prompt.ask({
        type: 'input',
        name: 'filename',
        message: 'Filename to generate:'
      })
      const genFilename = genFile.filename
      print.info(genFilename)

      print.info('')
      print.info(`Generating component into ${process.pwd + '/' + genFilename}`)
      print.info('')

      // then write to the filesystem
      const gistContent = selectedGist.body.files['component.js'].content

      completeLibraryTemplate(context, gistContent, templateState => {
        filesystem.write(genFilename, templateState.content)
      })

      break
    case 'publish':
      const igniteLibraryDir = `${__dirname}/../../ignite-library`
      const spinner = print.spin()

      await createIgniteLibrary(context, spinner, igniteLibraryDir)
      
      
      // Ask for component name
      const answer = await prompt.ask({
        type: 'input',
        name: 'name',
        message: 'What is your component\'s name?'
      })

      const componentName = answer.name

      if (!componentName) {
        spinner.text = 'Component name required'
        spinner.fail()
        process.exit(1)
      }

      // Get the library index
      spinner.text = 'Getting component index'
      const componentIndex = JSON.parse(filesystem.read(`${igniteLibraryDir}/library-index.json`)).components
      spinner.succeed()

      // Check for existing component with same name + description combination
      spinner.text = 'Checking for conflicting component'
      const existingComponent = componentIndex.find( c => c.name === componentName )
      
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
      const componentPath = `${process.cwd()}/${componentName}.tsx`

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
            [componentName]: {
              content: filesystem.read(componentPath)
            }
          }
        })

        const gistId = res.body.id

        // Add component to library index, stage, commit, and push
        componentIndex.push({
          name: componentName,
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
        await system.run(`git add index.json && git commit -m "Added component ${componentName}"`)
      } catch (error) {
        console.log('error', error)
      }

      process.chdir('..')


      // We're done!
      spinner.stop()

      break
    case 'update':
      console.log('updating' + searchTerm)
      break
    case 'view':
      console.log('viewing' + searchTerm)
      break
  }


  // Get a gist by ID
  // const res = await gists.get('2fa2ae76cc8da96dda1361219cf20f54')
  // console.dir(res.body.files['PLUGINS.md'], { colors: true })


  // Creating gists // 2fa2ae76cc8da96dda1361219cf20f54
  // const res = await gists.create({
  //   description: "Just testing this",
  //   public: false,
  //   files: {
  //     [filename]: {
  //       content: filesystem.read(filename)
  //     }
  //   }
  // })

  // const res = await gists.list('jamonholmgren', {})
  // print.debug(res)


}
