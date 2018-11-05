// @cliDescription  Copy templates as blueprints for this project
// ----------------------------------------------------------------------------
const { split, head, tail, trim } = require('ramda')
// const exitCodes = require('../lib/exitCodes')
const isIgniteDirectory = require('../lib/isIgniteDirectory')

const crossSpawn = require('cross-spawn')

const igniteVersion = require('../../package.json').version

const SCROLLBACK_LINES = 10

module.exports = async function (context) {
  const { print, filesystem, parameters } = context
  const { colors, checkmark, xmark } = print
  const { green, gray, red } = colors

  const state = {
    ios: {
      compiles: 0,
      warnings: 0,
      existingBuild: filesystem.exists('./ios/build'),
      status: 'starting',
      scrollback: [],
    },
    android: {
      compiles: 0,
      warnings: 0,
      existingBuild: filesystem.exists('./android/app/build'),
      status: 'starting',
      scrollback: [],
      devices: runningAndroidDevices(), // kick off async promise
    },
    ignite: isIgniteDirectory(process.cwd()),
    rnversion: reactNativeVersion(), // kick off async promise
  }

  // read React Native version
  state.rnversion = await state.rnversion

  // intro (based on whether it's an Ignite boilerplate or not)
  print.info('')
  if (state.ignite) {
    print.info(green(`Ignite ${igniteVersion} - let's do this! Starting Ignite React Native ${state.rnversion} app`))
  } else {
    print.info(green(`Ignite ${igniteVersion} is starting up your React Native ${state.rnversion} app`))
  }

  // kick off the requested builds (and stop the other)
  if (['android', 'a'].includes(parameters.second)) {
    state.ios.status = 'stopped'
  } else if (['ios', 'i'].includes(parameters.second)) {
    state.android.status = 'stopped'
  } else {
    // assume we're building both
  }

  // make sure we have some android devices
  if (state.android.status === 'starting') {
    state.android.devices = await state.android.devices
    if (state.android.devices.length > 0) {
      print.info(gray(`Found ${state.android.devices.length} Android device(s)`))
    } else {
      print.info(gray(`No Android devices found`))
      state.android.status = 'stopped'
    }
  }

  let platformInfo = []
  if (state.ios.status === 'starting') platformInfo.push('iOS')
  if (state.android.status === 'starting') platformInfo.push('Android')

  print.info('')
  if (platformInfo.length === 2) {
    print.info(`Starting React Native project for ${platformInfo.join(' and ')} concurrently.`)
  } else if (platformInfo.length === 1) {
    print.info(`Starting React Native project for ${platformInfo[0]} only.`)
  } else {
    print.info(`Can't build app -- check that your simulators/emulators are running.`)
    process.exit(1)
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

  function progress(platform, str) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    print.info(`  ${checkmark} [${platform}] ${gray(str)}`)
  }

  function failed(str) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    print.info(`  ${xmark} ${red(str)}`)
  }

  const startTime = process.hrtime();

  updateSpinner('cyan', 'Getting ready')

  const onProgress = (platform) => (data) => {
    if (state[platform].status === 'error') return

    const s = trim(data.toString())

    // keep last n lines of scrollback
    const scrollbackLine = s.length <= 160 ? s : s.slice(0, 50) + '...' + s.slice(-50)
    if (scrollbackLine.length > 0) state[platform].scrollback.push(scrollbackLine)
    state[platform].scrollback = state[platform].scrollback.slice(-1 * SCROLLBACK_LINES)

    if (context.parameters.options.debug) {
      console.log(gray(s))
      spinner.stop()
    }

    // Android -- TODO: split this out into its own function
    if (platform === 'android') {
      //print.info(gray(s))
      if (s.includes('Starting JS server...')) {
        updateSpinner('yellow', 'Starting Packager')

      } else if (s.includes('JS server already running.')) {
        updateSpinner('yellow', 'Packager running')

      } else if (s.includes('Building and installing the app on the device')) {
        progress(platform, 'Bundling provided via Packager')
        updateSpinner('yellow', platform + ': Compiling project')

      } else if (s.includes('Installing APK')) {
        progress(platform, `Project compiled successfully`)
        updateSpinner('yellow', platform + ': Installing APK')

      } else if (s.includes('Installed on')) {
        progress(platform, 'Installed app on simulator')
        updateSpinner('green', platform + ': Launching')

      } else if (s.includes('BUILD SUCCESSFUL')) {
        progress(platform, 'Build successful')
        updateSpinner('green', platform + ': Launching')

      } else if (s.includes('BUILD FAILED')) {
        failed(`Project failed to compile`)
        updateSpinner('red', platform + ': Shutting down')
        state[platform].status = 'error'

      } else if (s.includes('Note: ')) {
        state[platform].warnings += 1

      }
    }

    // iOS -- TODO: split this out into its own function
    if (platform === 'ios') {
      if (s.includes('Found Xcode project')) {
        progress(platform, 'Found Xcode project')
        updateSpinner('yellow', platform + ': Launching iPhone simulator')

      } else if (s.includes('Launching iPhone ')) {
        updateSpinner('yellow', platform + ': Launching iPhone simulator')

      } else if (s.includes('Building using "xcodebuild -project')) {
        progress(platform, 'iPhone simulator launched')
        updateSpinner('yellow', platform + ': Compiling project')

      } else if (s.includes('xctoolchain/usr/bin/clang -x ')) {
        state[platform].compiles += 1
        updateSpinner('yellow', platform + `: Compiling project (${state[platform].compiles} files compiled)`)

      } else if (s.includes('Start\\ Packager')) {
        updateSpinner('yellow', 'Starting Packager')

      } else if (s.includes('Connection to localhost port 8081 [tcp/sunproxyadmin] succeeded!')) {
        progress(platform, 'Connected to React Native Packager')
        updateSpinner('yellow', 'Bundling JavaScript')

      } else if (s.includes('Skipping bundling in Debug for the Simulator')) {
        progress(platform, 'Bundling provided via Packager')
        updateSpinner('yellow', 'Building')

      } else if (s.includes('warning')) {
        state[platform].warnings += 1

      } else if (s.includes('** BUILD SUCCEEDED **')) {
        const compiles = state[platform].compiles <= 0 ? ' (nothing to recompile)' : ` (${state[platform].compiles} ${state[platform].existingBuild ? 're' : ''}compiled files)`
        progress(platform, `Project compiled successfully${compiles}`)
        updateSpinner('green', platform + ': Installing')

      } else if (s.includes('** BUILD FAILED **')) {
        failed(platform + `: Project failed to compile`)
        updateSpinner('red', platform + ': Shutting down')
        state[platform].status = 'error'

      } else if (s.includes('Launching ')) {
        progress(platform, 'Installed app on simulator')
        updateSpinner('green', platform + ': Launching')
      }
    }
  }

  const onComplete = (platform) => (output) => {
    if (state[platform].warnings > 0) {
      print.info('')
      print.info(gray(`  ${platform}: There were ${state.ios.warnings} warnings. This usually doesn't mean anything. ¯\\_(ツ)_/¯`))
    }
    progress(platform, `Launched in simulator`)
  }

  const onError = (platform) => (output) => {
    failed('There were errors during the build')
    print.info('')
    print.info(`Here are the last few lines of the output, shortened for readability:`)
    print.info('')
    print.info(gray(state[platform].scrollback.join('\n')))
    print.info('')
    print.info('To see full output, run `ignite run --debug` or `react-native run-' + platform + '`')
    print.info('')
    print.info(`React Native app build failed after ${hrformat(process.hrtime(startTime))}s`)
  }

  let androidResult = null;
  let iOSResult = null;

  if (state.android.status === 'starting') {
    if (!state.android.existingBuild) {
      print.info(gray('This is the first Android build, so compiling will take considerably longer'))
    }
    androidResult = runAsync(`react-native run-android`, {
      onProgress: onProgress('android'),
      onComplete: onComplete('android'),
      onError: onError('android')
    })
  }
  if (state.ios.status === 'starting') {
    if (!state.android.existingBuild) {
      print.info(gray('This is the first iOS build, so compiling will take considerably longer'))
    }
    iOSResult = runAsync(`react-native run-ios`, {
      onProgress: onProgress('ios'),
      onComplete: onComplete('ios'),
      onError: onError('ios')
    })
  }

  await Promise.all([androidResult, iOSResult])

  print.info('')
  print.info(`Ignite run completed in ${hrformat(process.hrtime(startTime))}s`)

  spinner.stop()
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
      if (options.onComplete) options.onComplete(out)
      resolve(out)
    })
    spawned.on('error', err => {
      out.error = err
      if (options.onError) options.onError(out)
      resolve(out)
    })
  })
}

function hrformat(hr) {
  return Math.floor(((hr[0] * 1000) + (hr[1] / 1e6))) / 1000
}

async function reactNativeVersion() {
  const rnVersion = await runAsync('react-native --version')
  try {
    return rnVersion.stdout.split('\n')[1].split(':')[1].trim()
  } catch (e) {
    return 'unknown'
  }
}

async function runningAndroidDevices() {
  return (await runAsync('adb devices')).stdout.replace('List of devices attached', '').trim().split('\n').filter(s => s != '')
}
