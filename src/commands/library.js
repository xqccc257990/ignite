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

const LIBRARY_INDEX_GIST = 'fd8513a906c8da31984c68064f0498e6'
const LIBRARY_INDEX_URL = `https://raw.githubusercontent.com/{parameters.options.github || 'infinitered'}/ignite-library/master/library.json`

const FAKE_TEMPLATE = `
import * as React from "react"
import { View, ViewStyle } from "react-native"

export interface {{ NAME }}Props {
  /**
   * Text which is looked up via i18n.
   */
  tx?: string

  text?: string

  /**
   * An optional style override useful for padding & margin.
   */
  style?: ViewStyle
}

/**
 * Stateless functional component for your needs
 *
 * Component description here for TypeScript tips.
 */
export function <%= props.pascalName %>(props: <%= props.pascalName %>Props) {
  // grab the props
  const { tx, text, style, ...rest } = props
  const textStyle = { }

  return (
    <View style={style} {...rest}>
      <Text tx={tx} text={text} style={textStyle} />
    </View>
  )
}
`

const Gists = require('gists');
const gists = new Gists({
  token: process.env['IGNITE_GITHUB_TOKEN']
});

module.exports = async function (context) {
  const { parameters, filesystem, print, prompt } = context

  const filename = parameters.third

  switch (parameters.second.toLowerCase()) {
    case 'search':
      // go out and get the Infinite Red component library
      let res
      try {
        res = await gists.get(LIBRARY_INDEX_GIST)
      } catch (e) {
        // if not found, exit gracefully 
        print.info(`Can't find the Ignite library index at (https://gist.github.com/jamonholmgren/${LIBRARY_INDEX_GIST})`)
        print.info('')
        print.info(`You may have set your env variable incorrectly (Not really, this is COMING SOON) or don't have a Personal Access Token set (more likely!)`)
        print.info(`Go to https://github.com/settings/tokens to generate one and then run this in terminal:`)
        print.info(`export IGNITE_GITHUB_TOKEN='tokenhere'`)
        process.exit(e.code)
      }

      // parse out the components
      const components = JSON.parse(res.body.files['library-index.json'].content).components

      // search for a component
      const searchResults = components.filter(comp => comp.name.includes(filename))

      // console.dir(searchResults)
      const selection = await prompt.ask({
        type: 'list',
        name: 'component',
        message: `Components matching ${filename}:`,
        choices: searchResults.map(r => r.name + " - " + r.description)
      })

      const selectedResult = searchResults.find(r => (r.name + " - " + r.description) === selection.component)

      const selectedGist = await gists.get(selectedResult.gist)

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

      print.info('')
      print.info(`Generating component into ${process.pwd() + '/' + genFilename}`)
      print.info('')

      print.info(FAKE_TEMPLATE)
      // this is where you fill out the template in terminal
      // it's replacing various things in the snippet, like
      //      export interface {{ NAME }}Props {
      // here you'd replace the {{ NAME }} interactively

      // then write to the filesystem

      // filesystem.write(genFilename, selectedGist.body.files['PLUGINS.md'].content)
      break
    case 'publish':
      // check if a library exists and if we even have permission to publish to it
      // const result = await gists.list('jamonholmgren', {})
        // if doesn't exist, what now?
        // if doesn't have permission, what now?
        // exit gracefully, say "you don't have permission" or whatever        

      // check if the file exists, 
      const exists = filesystem.exists(filename)
      
      // exit gracefully if not exists
      if (!exists) {
        console.log('Input file doesn\'t exist, bailing out...')
        process.exit(1)
      }

      // ask for name, description, tags (comma separated)
      await prompt.ask({
        type: 'input',
        name: 'name',
        message: 'What is your component\'s name?'
      })

      // read the file
      const file = filesystem.read(filename)

      // check if library index already contains this component

      // if component already exists, get that gist so we can update its contents
        // update the gist contents                                

      // If component doesn't exist, create the gist
      gists.create({files: {[filename]: { content: file }}})

      // update the library index with the new (or updated) gist
            
      break
    case 'update':
      console.log('updating' + filename)
      break
    case 'view':
      console.log('viewing' + filename)
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
