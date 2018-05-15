'use strict'

const path = require('path')
const { asValue } = require('awilix')

let container
beforeEach(async (done) => {
  container = require('../lib')

  await container.start({
    data: 'fake-path',
    config: path.resolve(__dirname, '../../core-config/lib/networks/testnet')
  }, {
    skipPlugins: true
  })

  done()
})

describe('Container', () => {
  it('should be an object', async () => {
    await expect(container).toBeObject()
  })

  it('should add a new registration', async () => {
    container.register('fake', asValue('value'))

    await expect(container.container.registrations['fake']).toBeTruthy()
  })

  it('should resolve a registration', async () => {
    container.register('fake', asValue('value'))

    await expect(container.resolve('fake')).toBe('value')
  })

  it('should determine if a registration exists', async () => {
    container.register('fake', asValue('value'))

    await expect(container.has('fake')).toBeTruthy()
  })

  it('should export paths', async () => {
    await expect(process.env.ARK_PATH_DATA).toEqual('fake-path')
  })
})
