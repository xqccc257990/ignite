const { split, head, tail } = require('ramda')

const crossSpawn = require('cross-spawn')

const igniteVersion = require('../../package.json').version

module.exports = async function (context) {
  const { print } = context
  const { colors, checkmark, xmark } = print
  const { green, gray, red } = colors

  print.info('')
  print.info(green(`Ignite ${igniteVersion} is nuking your React Native project...😈`))
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

  updateSpinner('Nuking iOS build folder')
  await runAsync('rm -rf ./ios/build')
  progress('ios', 'Nuked iOS build folder ./ios/build')
  updateSpinner('Nuking Android build folder')
  await runAsync('rm -rf ./android/app/build')
  progress('android', 'Nuked Android build folder ./android/app/build')

  spinner.stop()

  print.info('')
  print.info('Done nuking React Native project!')
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
