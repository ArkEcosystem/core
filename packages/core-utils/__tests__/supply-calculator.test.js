const app = require('@arkecosystem/core-container')

let supplyCalculator
let config

const mockConfig = {
  genesisBlock: { totalAmount: 1000 },
  network: { constants: [{ height: 1, reward: 2 }] },
}

app.resolvePlugin = jest.fn(plugin => {
  if (plugin === 'config') {
    return mockConfig
  }
})

beforeAll(() => {
  config = app.resolvePlugin('config')
  supplyCalculator = require('../lib/supply-calculator')
})

describe('Supply calculator', () => {
  it('should calculate supply with milestone at height 2', () => {
    mockConfig.network.constants[0].height = 2
    expect(supplyCalculator.calculate(1)).toBe(
      mockConfig.genesisBlock.totalAmount,
    )
    mockConfig.network.constants[0].height = 1
  })

  describe.each([0, 5, 100, 2000, 4000, 8000])('at height %s', height => {
    it('should calculate the genesis supply without milestone', () => {
      const genesisSupply = config.genesisBlock.totalAmount
      expect(supplyCalculator.calculate(height)).toBe(
        genesisSupply + height * config.network.constants[0].reward,
      )
    })
  })

  describe.each([0, 2000, 4000, 8000, 16000])('at height %s', height => {
    it('should calculate the genesis supply with one milestone', () => {
      mockConfig.network.constants.push({ height: 8000, reward: 3 })

      const reward = current => {
        if (current < 8000) {
          return current * 2
        }

        return 7999 * 2 + (current - 7999) * 3
      }

      const genesisSupply = config.genesisBlock.totalAmount
      expect(supplyCalculator.calculate(height)).toBe(
        genesisSupply + reward(height),
      )

      mockConfig.network.constants = [{ height: 1, reward: 2 }]
    })
  })

  describe.each([
    0,
    4000,
    8000,
    12000,
    16000,
    20000,
    32000,
    48000,
    64000,
    128000,
  ])('at height %s', height => {
    it('should calculate the genesis supply with four milestones', () => {
      mockConfig.network.constants.push({ height: 8000, reward: 4 })
      mockConfig.network.constants.push({ height: 16000, reward: 5 })
      mockConfig.network.constants.push({ height: 32000, reward: 10 })
      mockConfig.network.constants.push({ height: 64000, reward: 15 })

      const reward = current => {
        if (current < 8000) {
          return current * 2
        }

        if (current < 16000) {
          return reward(7999) + (current - 7999) * 4
        }

        if (current < 32000) {
          return reward(15999) + (current - 15999) * 5
        }

        if (current < 64000) {
          return reward(31999) + (current - 31999) * 10
        }

        return reward(63999) + (current - 63999) * 15
      }

      const genesisSupply = config.genesisBlock.totalAmount
      expect(supplyCalculator.calculate(height)).toBe(
        genesisSupply + reward(height),
      )

      mockConfig.network.constants = [{ height: 1, reward: 2 }]
    })
  })
})
