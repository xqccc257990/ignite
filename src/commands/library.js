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
const igniteLibrarySearch = require('../lib/library/search')
const igniteLibraryPublish = require('../lib/library/publish')
const igniteLibraryView = require('../lib/library/view')

module.exports = async function (context) {
  const { parameters } = context

  switch (parameters.second.toLowerCase()) {
    case 'search':
      await igniteLibrarySearch(context)
      break
    case 'publish':
      await igniteLibraryPublish(context, gists)
      break
    case 'update':
      console.log('updating' + searchTerm)
      break
    case 'view':
      await igniteLibraryView(context)
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
