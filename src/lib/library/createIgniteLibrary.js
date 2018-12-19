/**
 * Retrieves a Library component from GitHub Gists
 */
async function getLibraryComponent (context, spinner, igniteLibraryDir) {
  const { filesystem, system } = context
  const repoExists = await filesystem.exists(igniteLibraryDir)

  spinner.start()

  // Clone library if we haven't yet
  spinner.text = 'Checking for library index...'


  if (repoExists) {
    spinner.succeed()

    spinner.text = 'Component library found!'

  } else {
    spinner.succeed()

    spinner.text = 'Component library not found, cloning...'
    
    // Clone the library
    filesystem.dir(`${__dirname}/../../../ignite-library`)
    await system.run(`git clone git@github.com:infinitered/ignite-library.git ${igniteLibraryDir}`)

    spinner.succeed()
  }

  return
}

module.exports = getLibraryComponent