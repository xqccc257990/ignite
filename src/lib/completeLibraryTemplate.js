/**
 * Facilitates completing a library template
 */

async function completeLibraryTemplate (context, content) {
  const { print } = context
  const { terminal: term, ScreenBuffer } = require( 'terminal-kit' )
  var screen = new ScreenBuffer({dst: term, noFill: false})
  var templateState = {
    content: content,
    workingContent: content,
    currentSite: 1
  }

  function placeCursor (content, currentEntryPoint) {
    // return content
    var regex = new RegExp('\\$' + currentEntryPoint, "gm")
    if (content.search(regex)) {
      return content.replace(regex, "▋")
    }
  }

  function terminate() {
    term.grabInput( false ) ;
    setTimeout( function() { process.exit() } , 100 ) ;
  }

  function drawTemplate(content) {
    term.clear()
    term(content)
    screen.draw()
  }

  async function templateLoopIteration(templateState, name = '') {
    print.info(JSON.stringify(templateState))

    var nextSite = templateState.currentSite
    var content = templateState.content
    var workingContent = templateState.content

    if ( name === 'CTRL_C' ) { terminate() ; }
    if ( name === 'ENTER' ) {
      nextSite++
    } 

    workingContent = placeCursor(content, nextSite)
    if(!workingContent) { terminate() ; }

    drawTemplate(workingContent)

    return {
      content: content,
      workingContent: workingContent,
      currentSite: nextSite,
    }
  }

  const newTemplateState = await templateLoopIteration(templateState)
  Object.assign(templateState, newTemplateState)
  drawTemplate(templateState.workingContent)
  
  term.grabInput( );
  term.on( 'key' , async function( name , matches , data ) {
    const newTemplateState = await templateLoopIteration(templateState, name)
    Object.assign(templateState, newTemplateState)
  } ) ;
}

module.exports = completeLibraryTemplate