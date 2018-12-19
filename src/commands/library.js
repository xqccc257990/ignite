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
const Gists = require('gists');
const gists = new Gists({
  token: process.env['IGNITE_GITHUB_TOKEN']
});
const getLibraryComponent = require('../lib/getLibraryComponent')
const completeLibraryTemplate = require('../lib/completeLibraryTemplate')
const igniteLibraryPublish = require('../lib/igniteLibraryPublish')

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

      break
    case 'publish':
      await igniteLibraryPublish(context, gists)
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
