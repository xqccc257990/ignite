const { system, filesystem } = require('gluegun')
const tempy = require('tempy')
const stripANSI = require('strip-ansi')

const IGNITE = 'node ' + filesystem.path(`${__dirname}/../../../bin/ignite`)

// for local boilerplate testing
// const IGNITE_BOILERPLATE = filesystem.path(__dirname, '..', '..', '..', '..', 'ignite-bowser')
const IGNITE_BOILERPLATE = 'ignite-bowser'

const APP_NAME = 'Foo'

jest.setTimeout(10 * 60 * 1000)

const originalDir = process.cwd()
let tempDir = undefined
const opts = { stdio: 'inherit' }

beforeEach(() => {
  tempDir = tempy.directory()
  process.chdir(tempDir)
  console.log(`switching to ${tempDir} to run "ignite new"`)
})

afterEach(() => {
  if (tempDir) filesystem.remove(tempDir)
  process.chdir(originalDir)
})

test('spins up a Bowser app and performs various checks', async done => {
  const resultANSI = await system.run(`${IGNITE} new ${APP_NAME} --detox -b ${IGNITE_BOILERPLATE} --debug`, opts)
  const result = stripANSI(resultANSI)

  // Check the output
  expect(result).toContain(`Ignite CLI ignited`)
  expect(result).toContain(`${APP_NAME}`)
  expect(result).toContain(`https://infinite.red/ignite`)

  // Jump into the app directory
  process.chdir(APP_NAME)
  console.log(`switching to ${tempDir}/${APP_NAME} to check the project`)

  // check that the project was generated
  const dirs = filesystem.subdirectories('.')
  expect(dirs).toContain('ios')
  expect(dirs).toContain('android')
  expect(dirs).toContain('app')

  // check the contents of ignite/ignite.json
  const igniteJSON = filesystem.read(`${process.cwd()}/ignite/ignite.json`)
  expect(typeof igniteJSON).toBe('string')
  expect(igniteJSON).toMatch(/"boilerplate": \"/)

  // check the app.js file
  const appJS = filesystem.read(`${process.cwd()}/app/app.tsx`)
  expect(appJS).toContain('export const App')

  // run generators
  await system.run(`${IGNITE} g component test`, opts)
  expect(filesystem.list(`${process.cwd()}/app/components`)).toContain('test')
  expect(filesystem.read(`${process.cwd()}/app/components/test/test.tsx`)).toContain(
    'export function Test(props: TestProps) {',
  )

  await system.run(`${IGNITE} g model mtest`, opts)
  expect(filesystem.list(`${process.cwd()}/app/models`)).toContain('mtest')
  expect(filesystem.read(`${process.cwd()}/app/models/mtest/mtest.ts`)).toContain('export const MtestModel')

  await system.run(`${IGNITE} g screen bowser`, opts)
  expect(filesystem.list(`${process.cwd()}/app/screens`)).toContain('bowser-screen')
  expect(filesystem.read(`${process.cwd()}/app/screens/bowser-screen/bowser-screen.tsx`)).toContain(
    'export const BowserScreen',
  )

  // beforehand, check packageJSON
  let packageJSON = JSON.parse(filesystem.read(`${process.cwd()}/package.json`))
  expect(packageJSON.dependencies['left-pad']).toBeUndefined()
  expect(packageJSON.dependencies['ignite-test']).toBeUndefined()

  // add a plugin
  await system.run(`${IGNITE} add ${__dirname}/ignite-test`)
  packageJSON = JSON.parse(filesystem.read(`${process.cwd()}/package.json`))
  expect(packageJSON.dependencies['left-pad']).toContain('.')
  expect(packageJSON.devDependencies['ignite-test']).toContain('/ignite-test')

  // remove a plugin
  await system.run(`${IGNITE} remove ignite-test`)
  packageJSON = JSON.parse(filesystem.read(`${process.cwd()}/package.json`))
  expect(packageJSON.dependencies['left-pad']).toBeUndefined()
  expect(packageJSON.devDependencies['ignite-test']).toBeUndefined()

  done()
})
