'use strict'

const clipboardy = require('clipboardy')
const copyToClipboard = require('../../lib/utils/copy-to-clipboard')

describe('copyToClipboard', () => {
  it('should be a function', () => {
    expect(copyToClipboard).toBeFunction()
  })

  it('should copy to clipboard', () => {
    const realProcess = process
    const exitMock = jest.fn()
    global.process.exit = exitMock

    copyToClipboard('this is a test')
    expect(exitMock).toHaveBeenCalledTimes(1)
    expect(clipboardy.readSync()).toEqual('"this is a test"')

    global.process = realProcess
  })
})
