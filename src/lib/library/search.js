module.exports = async function(context) {
  const getLibraryComponent = require('./getComponent')
  const completeLibraryTemplate = require('./completeTemplate')
  
  const { parameters, filesystem, print, prompt } = context
  const searchTerm = parameters.third
  if (!searchTerm) {
    print.error('')
    print.error(`You must enter a search term (e.g. 'datepicker')`)
    print.error('')
  }

  // go out and get the Infinite Red component library
  const filter = selection => {
    return result => {
      return (result.name + " - " + result.description) === selection.component
    }
  }
  const selectedGist = await getLibraryComponent(context, searchTerm, filter)

  // have a new gist, now fill out the template
  print.info('')
  print.info(`Generating component`)
  print.info('')

  const genFile = await prompt.ask({
    type: 'input',
    name: 'filename',
    message: 'Filename to generate (.tsx optional):'
  })
  const genFileMatch =
    genFile.filename &&
    genFile.filename.match(/^(\w+)(?:\.tsx)?$/)

  const genFilename = `${genFileMatch[1]}.tsx`

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
