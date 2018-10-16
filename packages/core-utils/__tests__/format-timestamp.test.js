'use strict'

const container = require('@arkecosystem/core-container')
const formatTimestamp = require('../lib/format-timestamp')

container.resolvePlugin = jest.fn(plugin => {
  if (plugin === 'config') {
    return {
      getConstants: () => {
        return {
          epoch: '2017-03-21T13:00:00.000Z'
        }
      }
    }
  }
})

describe('Format Timestamp', () => {
  it('should be a function', () => {
    expect(formatTimestamp).toBeFunction()
  })

  it('should compute the correct epoch value', () => {
    expect(formatTimestamp(100).epoch).toBe(100)
  })

  it('should compute the correct unix value', () => {
    expect(formatTimestamp(100).unix).toBe(1490101300)
  })

  it('should compute the correct human value', () => {
    expect(formatTimestamp(100).human).toBe('2017-03-21T13:01:40Z')
  })
})
