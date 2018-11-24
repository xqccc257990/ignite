/**
 * Facilitates completing a library template
 */

async function completeLibraryTemplate (context, content) {
  const { print } = context
  const { terminal: term, ScreenBuffer } = require( 'terminal-kit' )
  var screen = new ScreenBuffer({dst: term, noFill: false})

  const findNextTemplateSpace = function(line) {

  }

  async function placeCursor (content, currentEntryPoint) {
    var reCurrent = new RegExp('\\$' + currentEntryPoint, "gm")
    if (content.search(reCurrent)) {
      return content.replace(reCurrent, "▋")
    }
  }

  function terminate() {
    term.grabInput( false ) ;
    setTimeout( function() { process.exit() } , 100 ) ;
  }

  function advanceSite(nString) {
    var nPlusOne = parseInt(nString) + 1
    return nPlusOne.toString()
  }

  function templateLoopIteration(data, name = null) {
    // const { content, currentSite } = data
    // var nextSite = currentSite
    // print.info(term)
    var nextSite

    if ( name === 'CTRL_C' ) { terminate() ; }
    if ( name === 'ENTER' ) {
      nextSite = advanceSite(data.currentSite)
    }

    // term.clear()
    // var contentWithCursor = await placeCursor(content, nextSite || data.currentSite)
    // term(content)
    // screen.draw()

    return {
      content,
      contentWithCursor: content,
      currentSite: nextSite || data.currentSite,
    }
  }


  var data = {
    content: content,
    currentSite: "1"
  }

  term.grabInput( ) ;
  data = templateLoopIteration(data)

  term.on( 'key' , function( name , matches , _data ) {
    data = templateLoopIteration(data, name)
    print.info(JSON.stringify(data))
  } ) ;


  // for (var i=0; i<lines.length; i++) {
  //   line = lines[i]
  //   res = re.exec(line)
  //   print.info(line)
  // }
}

module.exports = completeLibraryTemplate