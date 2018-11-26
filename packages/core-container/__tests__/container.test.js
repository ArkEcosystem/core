const path = require('path')
const { asValue } = require('awilix')

let app
beforeEach(async () => {
  app = require('../lib')

  await app.setUp(
    '2.0.0',
    {
      data: 'fake-path',
      config: path.resolve(__dirname, '../../core/lib/config/testnet'),
      token: 'ark',
      network: 'testnet',
    },
    {
      skipPlugins: true,
    },
  )
})

describe('Container', () => {
  it('should be an object', () => {
    expect(app).toBeObject()
  })

  it('should add a new registration', () => {
    app.register('fake', asValue('value'))

    expect(app.container.registrations.fake).toBeTruthy()
  })

  it('should resolve a registration', () => {
    app.register('fake', asValue('value'))

    expect(app.resolve('fake')).toBe('value')
  })

  it('should determine if a registration exists', () => {
    app.register('fake', asValue('value'))

    expect(app.has('fake')).toBeTrue()
  })

  it('should resolve and export paths', () => {
    expect(process.env.ARK_PATH_DATA).toEqual(path.resolve('fake-path'))
  })
})
