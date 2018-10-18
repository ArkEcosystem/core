'use strict'

const path = require('path')
const { asValue } = require('awilix')

let container
beforeEach(async () => {
  container = require('../lib')

  await container.setUp({
    data: 'fake-path',
    config: path.resolve(__dirname, '../../core/lib/config/testnet'),
    token: 'ark',
    network: 'testnet'
  }, {
    skipPlugins: true
  })
})

describe('Container', () => {
  it('should be an object', () => {
    expect(container).toBeObject()
  })

  it('should add a new registration', () => {
    container.register('fake', asValue('value'))

    expect(container.container.registrations['fake']).toBeTruthy()
  })

  it('should resolve a registration', () => {
    container.register('fake', asValue('value'))

    expect(container.resolve('fake')).toBe('value')
  })

  it('should determine if a registration exists', () => {
    container.register('fake', asValue('value'))

    expect(container.has('fake')).toBeTrue()
  })

  it('should resolve and export paths', () => {
    expect(process.env.ARK_PATH_DATA).toEqual(path.resolve('fake-path'))
  })
})
