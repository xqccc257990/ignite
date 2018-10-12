// @cliDescription  Copy templates as blueprints for this project
// ----------------------------------------------------------------------------
const { split, head, tail, trim } = require('ramda')
// const exitCodes = require('../lib/exitCodes')
const isIgniteDirectory = require('../lib/isIgniteDirectory')

const crossSpawn = require('cross-spawn')

const igniteVersion = require('../../package.json').version

module.exports = async function (context) {
  const { print, filesystem } = context
  const { colors, checkmark, xmark } = print
  const { green, gray, red } = colors

  const state = {
    compiles: 0,
    warnings: 0,
    existingBuild: filesystem.exists('./ios/build'),
    status: 'building',
    scrollback: [],
    rnversion: null
  }

  try {
    const rnVersions = await runAsync('react-native --version')
    state.rnversion = rnVersions.stdout.split('\n')[1].split(':')[1].trim()
  } catch (e) { }

  const command = `react-native run-ios`

  print.info('')
  if (isIgniteDirectory(process.cwd())) {
    print.info(green(`Ignite ${igniteVersion} - let's do this! Starting Ignite React Native ${state.rnversion} app`))
  } else {
    print.info(green(`Ignite ${igniteVersion} is starting up your React Native ${state.rnversion} app`))
  }

  if (!state.existingBuild) {
    print.info(gray('This is the first build, so compiling will take considerably longer'))
  }

  print.info('')
  const spinner = print.spin({
    spinner: {
      "interval": 240,
      "frames": [
        " 🌑",
        " 🌒",
        " 🌓",
        " 🌔",
        " 🌕",
        " 🌖",
        " 🌗",
        " 🌘",
      ]
    }
  })

  function updateSpinner(col, str) {
    spinner.color = col
    spinner.text = str
  }

  function progress(str) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    print.info(`  ${checkmark} ${gray(str)}`)
  }

  function failed(str) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    print.info(`  ${xmark} ${red(str)}`)
  }

  const startTime = process.hrtime();

  updateSpinner('cyan', 'Getting ready')

  const result = await runAsync(command, {
    onProgress: (data) => {
      if (state.status === 'error') {
        return
      }

      const s = trim(data.toString())

      const scrollbackLine = s.length <= 160 ? s : s.slice(0, 50) + '...' + s.slice(-50)
      if (scrollbackLine.length > 0) state.scrollback.push(scrollbackLine)
      state.scrollback = state.scrollback.slice(-10)

      if (context.parameters.options.debug) {
        console.log(gray(s))
        spinner.stop()
      }

      if (s.includes('Found Xcode project')) {
        progress('Found Xcode project')
        updateSpinner('yellow', 'Launching iPhone simulator')

      } else if (s.includes('Launching iPhone ')) {
        updateSpinner('yellow', 'Launching iPhone simulator')

      } else if (s.includes('Building using "xcodebuild -project')) {
        progress('iPhone simulator launched')
        updateSpinner('yellow', 'Compiling project')

      } else if (s.includes('xctoolchain/usr/bin/clang -x ')) {
        state.compiles += 1
        updateSpinner('yellow', `Compiling project (${state.compiles} files compiled)`)

      } else if (s.includes('Start\\ Packager')) {
        updateSpinner('yellow', 'Starting Packager')

      } else if (s.includes('Connection to localhost port 8081 [tcp/sunproxyadmin] succeeded!')) {
        progress('Connected to React Native Packager')
        updateSpinner('yellow', 'Bundling JavaScript')

      } else if (s.includes('Skipping bundling in Debug for the Simulator')) {
        progress('Bundling provided via Packager')
        updateSpinner('yellow', 'Building')

      } else if (s.includes('warning')) {
        state.warnings += 1

      } else if (s.includes('** BUILD SUCCEEDED **')) {
        const compiles = state.compiles <= 0 ? ' (nothing to recompile)' : ` (${state.compiles} ${state.existingBuild ? 're' : ''}compiled files)`
        progress(`Project compiled successfully${compiles}`)
        updateSpinner('green', 'Installing')

      } else if (s.includes('** BUILD FAILED **')) {
        failed(`Project failed to compile`)
        updateSpinner('red', 'Shutting down')
        state.status = 'error'

      } else if (s.includes('Launching ')) {
        progress('Installed app on simulator')
        updateSpinner('green', 'Launching')
      }
    }
  })

  spinner.stop()

  if (state.status === 'error') {
    failed('There were errors during the build')
    print.info('')
    print.info(`Here are the last few lines of the output, shortened for readability:`)
    print.info('')
    print.info(gray(state.scrollback.join('\n')))
    print.info('')
    print.info('To see full output, run `ignite run --debug` or `react-native run-ios`')
  } else {
    progress('Launched in simulator')
  }

  if (state.warnings > 0) {
    print.info('')
    print.info(gray(`  There were ${state.warnings} warnings. This usually doesn't mean anything. ¯\\_(ツ)_/¯`))
  }

  print.info('')
  print.info(`React Native app built in ${hrformat(process.hrtime(startTime))}s`)
}

async function runAsync(commandLine, options) {
  options = options || {}
  return new Promise((resolve, reject) => {
    const args = split(' ', commandLine)
    const spawned = crossSpawn(head(args), tail(args), options)
    const out = {
      stdout: "",
      stderr: "",
      code: null,
      error: null
    }
    spawned.stdout.on('data', data => {
      out.stdout += data
      if (options.onProgress) options.onProgress(data)
    })
    spawned.stderr.on('data', data => {
      out.stderr += data
      if (options.onProgress) options.onProgress(data)
    })
    spawned.on('close', code => {
      out.code = code
      resolve(out)
    })
    spawned.on('error', err => {
      out.error = err
      resolve(out)
    })
  })
}

function hrformat(hr) {
  return Math.floor(((hr[0] * 1000) + (hr[1] / 1e6))) / 1000
}
