'use strict'

const { Block } = require('@arkecosystem/crypto').models
const blocks1to100 = require('@arkecosystem/core-test-utils/fixtures/testnet/blocks.2-100')
const blocks101to155 = require('@arkecosystem/core-test-utils/fixtures/testnet/blocks.101-155')

const state = require('../lib/state-storage')
const app = require('./__support__/setup')

const blocks = blocks1to100.concat(blocks101to155).map(block => new Block(block))

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  state.reset()
})

describe('State Storage', () => {
  it('should be an object', () => {
    expect(state).toBeObject()
  })

  describe('getLastBlock', () => {
    it('should be a function', () => {
      expect(state.getLastBlock).toBeFunction()
    })

    it('should return null when no last block', () => {
      expect(state.getLastBlock()).toBeNull()
    })

    it('should return the last block', () => {
      state.setLastBlock(blocks[0])
      state.setLastBlock(blocks[1])

      expect(state.getLastBlock()).toBe(blocks[1])
    })
  })

  describe('setLastBlock', () => {
    it('should be a function', () => {
      expect(state.setLastBlock).toBeFunction()
    })

    it('should set the last block', () => {
      state.setLastBlock(blocks[0])
      expect(state.getLastBlock()).toBe(blocks[0])
    })

    it('should not exceed the max last blocks', () => {
      for (let i = 0; i < 100; i++) { // 100 is default
        state.setLastBlock(blocks[i])
      }

      expect(state.getLastBlocks()).toHaveLength(100)
      expect(state.getLastBlock()).toBe(blocks[99])
      expect(state.getLastBlocks().slice(-1)[0]).toBe(blocks[0])

      // Push one more to remove the first last block.
      state.setLastBlock(blocks[100])

      expect(state.getLastBlocks()).toHaveLength(100)
      expect(state.getLastBlock()).toBe(blocks[100])
      expect(state.getLastBlocks().slice(-1)[0]).toBe(blocks[1])
    })

    it('should remove last blocks when going to lower height', () => {
      for (let i = 0; i < 100; i++) { // 100 is default
        state.setLastBlock(blocks[i])
      }

      expect(state.getLastBlocks()).toHaveLength(100)
      expect(state.getLastBlock()).toBe(blocks[99])

      // Set last height - 1
      state.setLastBlock(blocks[98])

      expect(state.getLastBlocks()).toHaveLength(99)
      expect(state.getLastBlock()).toBe(blocks[98])

      // Set to first block
      state.setLastBlock(blocks[0])
      expect(state.getLastBlocks()).toHaveLength(1)
      expect(state.getLastBlock()).toBe(blocks[0])
    })
  })

  describe('getLastBlocks', () => {
    it('should be a function', () => {
      expect(state.getLastBlocks).toBeFunction()
    })

    it('should return the last blocks', () => {
      for (let i = 0; i < 5; i++) {
        state.setLastBlock(blocks[i])
      }

      const lastBlocks = state.getLastBlocks()
      expect(lastBlocks).toHaveLength(5)

      for (let i = 0; i < 5; i++) {
        expect(lastBlocks[i]).toBeInstanceOf(Block)
        expect(lastBlocks[i].data.height).toBe(6 - i) // Height started at 2
        expect(lastBlocks[i]).toBe(blocks[4 - i])
      }
    })
  })

  describe('getLastBlocksData', () => {
    it('should be a function', () => {
      expect(state.getLastBlocksData).toBeFunction()
    })

    it('should return the last blocks data', () => {
      for (let i = 0; i < 5; i++) {
        state.setLastBlock(blocks[i])
      }

      const lastBlocksData = state.getLastBlocksData()
      expect(lastBlocksData).toHaveLength(5)

      for (let i = 0; i < 5; i++) {
        expect(lastBlocksData[0]).not.toBeInstanceOf(Block)
        expect(lastBlocksData[i].height).toBe(6 - i) // Height started at 2
        expect(lastBlocksData[i]).toHaveProperty('transactions')
        delete lastBlocksData[i].transactions
        expect(lastBlocksData[i]).toEqual(blocks[4 - i].data)
      }
    })
  })

  describe('getLastBlockIds', () => {
    it('should be a function', () => {
      expect(state.getLastBlockIds).toBeFunction()
    })

    it('should return the last blocks data', () => {
      for (let i = 0; i < 5; i++) {
        state.setLastBlock(blocks[i])
      }

      const lastBlockIds = state.getLastBlockIds()
      expect(lastBlockIds).toHaveLength(5)

      for (let i = 0; i < 5; i++) {
        expect(lastBlockIds[i]).toBe(blocks[4 - i].data.id)
      }
    })
  })

  describe('getLastBlocksByHeight', () => {
    it('should be a function', () => {
      expect(state.getLastBlocksByHeight).toBeFunction()
    })

    it('should return the last blocks data', () => {
      for (let i = 0; i < 100; i++) {
        state.setLastBlock(blocks[i])
      }

      const lastBlocksByHeight = state.getLastBlocksByHeight(0, 101)
      expect(lastBlocksByHeight).toHaveLength(100)
      expect(lastBlocksByHeight[0].height).toBe(blocks[0].data.height)
    })

    it('should return one last block if no end height', () => {
      for (let i = 0; i < 100; i++) {
        state.setLastBlock(blocks[i])
      }

      const lastBlocksByHeight = state.getLastBlocksByHeight(50)
      expect(lastBlocksByHeight).toHaveLength(1)
      expect(lastBlocksByHeight[0].height).toBe(50)
    })
  })

  describe('getCommonBlocks', () => {
    it('should be a function', () => {
      expect(state.getCommonBlocks).toBeFunction()
    })

    it('should get common blocks', () => {
      for (let i = 0; i < 100; i++) {
        state.setLastBlock(blocks[i])
      }

      // Heights 90 - 100
      const ids = blocks.slice(89, 99).map(block => block.data.id)
      const commonBlocks = state.getCommonBlocks(ids)
      expect(ids).toHaveLength(10)
      expect(commonBlocks).toHaveLength(10)

      for (let i = 0; i < commonBlocks.length; i++) {
        expect(commonBlocks[i].height).toBe(blocks[98 - i].data.height)
      }
    })
  })

  describe('pingBlock', () => {
    it('should be a function', () => {
      expect(state.pingBlock).toBeFunction()
    })
  })

  describe('pushPingBlock', () => {
    it('should be a function', () => {
      expect(state.pushPingBlock).toBeFunction()
    })
  })

  describe('reset', () => {
    it('should be a function', () => {
      expect(state.reset).toBeFunction()
    })

    it('should reset the state', () => {
      for (let i = 0; i < 100; i++) {
        state.setLastBlock(blocks[i])
      }

      expect(state.getLastBlocks()).toHaveLength(100)
      state.reset()
      expect(state.getLastBlocks()).toHaveLength(0)
    })
  })

  describe('clear', () => {
    it('should be a function', () => {
      expect(state.clear).toBeFunction()
    })

    it('should clear the last blocks', () => {
      for (let i = 0; i < 100; i++) {
        state.setLastBlock(blocks[i])
      }

      expect(state.getLastBlocks()).toHaveLength(100)
      state.clear()
      expect(state.getLastBlocks()).toHaveLength(0)
    })
  })
})
