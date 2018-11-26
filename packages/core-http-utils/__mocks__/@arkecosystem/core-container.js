const container = jest.mock('@arkecosystem/core-container')

container.resolvePlugin = name => {
  if (name === 'logger') {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }
  }

  return {}
}

module.exports = container
