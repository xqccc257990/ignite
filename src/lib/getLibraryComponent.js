/**
 * Retrieves a Library component from GitHub Gists
 */
const LIBRARY_INDEX_GIST = '4fe0dfd70e7556f62cccd24c96a06be2'//'fd8513a906c8da31984c68064f0498e6'
const Gists = require('gists');
const gists = new Gists({
  token: process.env['IGNITE_GITHUB_TOKEN']
});

async function getLibraryComponent (context, searchTerm) {
  const { print, prompt } = context

  let res
  try {
    res = await gists.get(LIBRARY_INDEX_GIST)
  } catch (e) {
    // if not found, exit gracefully 
    print.info(`Can't find the Ignite library index`)
    print.info('')
    print.info(`You may have set your env variable incorrectly (Not really, this is COMING SOON) or don't have a Personal Access Token set (more likely!)`)
    print.info(`Go to https://github.com/settings/tokens to generate one and then run this in terminal:`)
    print.info(`export IGNITE_GITHUB_TOKEN='tokenhere'`)
    process.exit(e.code)
  }

  // parse out the components
  const components = JSON.parse(res.body.files['library-index.json'].content).components

  // search for a component
  const searchResults = components.filter(comp => comp.name.includes(searchTerm))

  // console.dir(searchResults)
  const selection = await prompt.ask({
    type: 'list',
    name: 'component',
    message: `Components matching ${searchTerm}:`,
    choices: searchResults.map(r => r.name + " - " + r.description)
  })

  const selectedResult = searchResults.find(r => (r.name + " - " + r.description) === selection.component)

  const selectedGist = await gists.get(selectedResult.gist)

  return selectedGist
}

module.exports = getLibraryComponent