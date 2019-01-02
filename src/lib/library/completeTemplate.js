/**
 * Facilitates completing a library template
 */

async function completeLibraryTemplate (context, content, onComplete) {
  const { print } = context
  const { terminal: term, ScreenBuffer } = require( 'terminal-kit' )
  var screen = new ScreenBuffer({dst: term, noFill: false})
  var templateState = {
    content: content,
    workingContent: content,
    currentSite: 1,
    currentEntry: '',
  }

  function getWorkingContent (content, currentEntryPoint, entry, showCursor=true) {
    var regex = new RegExp('\\$' + currentEntryPoint, "gm")
    const cursor = showCursor ?  '█' : ''
    var output = content
    var finished = false

    if (content.search(regex) > 0) {
      output = content.replace(regex, entry+cursor)
    } else {
      finished = true
    }

    return {
      content: output,
      finished: finished
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

  async function handleInput(templateState, key = '') {
    var nextSite = templateState.currentSite
    var content = templateState.content
    var workingContent = templateState.content
    var entry = templateState.currentEntry
    var temp
    var finished = false

    switch (key) {
      case 'CTRL_C':
        terminate()
        break;
      case 'ENTER':
        // Remove cursor and advance to next site
        temp = getWorkingContent(content, nextSite, entry, false)
        content = temp.content
        finished = temp.finished
        entry = ''
        nextSite++
        break;
      case 'TAB':
        // Remove cursor and advance to next site
        content = getWorkingContent(content, nextSite, entry, false)
        content = temp.content
        finished = temp.finished
        entry = ''
        nextSite++
      case 'BACKSPACE':
        entry = entry.slice(0,-1)
        break;
      default:
        entry = entry + key
        break;
    }

    temp = getWorkingContent(content, nextSite, entry)
    workingContent = temp.content
    finished = temp.finished

    drawTemplate(workingContent)

    return {
      content, // Just the content
      workingContent: workingContent, // Content with cursor
      finished: finished, // Boolean about whether finished
      currentSite: nextSite, // Number of current site
      currentEntry: entry, // User input in current site
    }
  }

  const newTemplateState = await handleInput(templateState)
  Object.assign(templateState, newTemplateState)
  
  term.grabInput( );
  term.on( 'key' , async function( name , _matches , _data ) {
    const newTemplateState = await handleInput(templateState, name)
    
    if (newTemplateState.finished) {
      term.clear()
      terminate()
      onComplete(newTemplateState)
    }

    Object.assign(templateState, newTemplateState)
  } ) ;
}

module.exports = completeLibraryTemplate