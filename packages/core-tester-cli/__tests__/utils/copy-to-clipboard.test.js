'use strict'

const clipboardy = require('clipboardy')
const copyToClipboard = require('../../lib/utils/copy-to-clipboard')

describe('Utils - Copy to Clipboard', () => {
  it('should be a function', () => {
    expect(copyToClipboard).toBeFunction()
  })

  it('should contain the copied content', () => {
    copyToClipboard([{
      key: 'value',
      serialized: Buffer.from('00', 'hex')
    }])

    expect(JSON.parse(clipboardy.readSync())).toEqual([{
      key: 'value',
      serialized: '00'
    }])
  })
})
