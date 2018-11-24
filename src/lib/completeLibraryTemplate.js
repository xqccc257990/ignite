/**
 * Facilitates completing a library template
 */

async function completeLibraryTemplate (context, content) {
  const { print } = context
  const { terminal: term, ScreenBuffer } = require( 'terminal-kit' )
  var screen = new ScreenBuffer({dst: term, noFill: false})

  function placeCursor (content, currentEntryPoint) {
    // return content
    var regex = new RegExp('\\$' + currentEntryPoint, "gm")
    print.info(currentEntryPoint)
    if (content.search(regex)) {
      return content.replace(regex, "▋")
    }
  }

  function terminate() {
    term.grabInput( false ) ;
    setTimeout( function() { process.exit() } , 100 ) ;
  }

  async function templateLoopIteration(templateState, name = '') {
    var nextSite = templateState.currentSite
    var content = templateState.content
    print.info(JSON.stringify(templateState))
    var workingContent = templateState.content

    if ( name === 'CTRL_C' ) { terminate() ; }
    if ( name === 'ENTER' ) {
      nextSite++
    } 

    workingContent = placeCursor(content, nextSite)
    if(!workingContent) { terminate() ; }

    term.clear()
    term(workingContent)
    screen.draw()

    return {
      content: content,
      workingContent: workingContent,
      currentSite: nextSite,
    }
  }

  var templateState = {
    content: content,
    workingContent: content,
    currentSite: 1
  }

  term.grabInput( ) ;
  Object.assign(templateState, templateLoopIteration(templateState, ''))

  term.on( 'key' , function( name , matches , data ) {
    Object.assign(templateState, templateLoopIteration(templateState, name))
    // print.info(JSON.stringify(templateState))
  } ) ;


  // for (var i=0; i<lines.length; i++) {
  //   line = lines[i]
  //   res = re.exec(line)
  //   print.info(line)
  // }
}

module.exports = completeLibraryTemplate