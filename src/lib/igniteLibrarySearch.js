module.exports = async function(context, _gists) {
  const getLibraryComponent = require('../lib/getLibraryComponent')
  const completeLibraryTemplate = require('../lib/completeLibraryTemplate')
  
  const { parameters, filesystem, print, prompt } = context
  const searchTerm = parameters.third
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
  const genFilename = genFile.filename + '.tsx'

  print.info('')
  print.info(`Generating component into ${process.pwd + '/' + genFilename}`)
  print.info('')

  // then write to the filesystem
  // TODO genFilename should be name of selected file
  const componentFilename = Object.keys(selectedGist.body.files)[0]
  const gistContent = selectedGist.body.files[componentFilename].content

  completeLibraryTemplate(context, gistContent, templateState => {
    filesystem.write(genFilename, templateState.content)
  })

}