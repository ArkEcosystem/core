const sortPeers = require('../../lib/utils/sort-peers')

describe('API - Utils - sortPeers', () => {
  const peers = [
    { height: 190, delay: 10 },
    { height: 180, delay: 10 },
    { height: 170, delay: 10 },
    { height: 160, delay: 10 },

    { height: 100, delay: 10 },
    { height: 100, delay: 12 },
    { height: 100, delay: 14 },
    { height: 100, delay: 19 },

    { height: 180, delay: 8 },
    { height: 130, delay: 9 },
    { height: 150, delay: 13 },
  ]

  describe('when the `delay` is the same', () => {
    it('sorts the peers by `height`', () => {
      const sample = [peers[2], peers[1], peers[3], peers[0]]
      const expected = peers.slice(0,4)
      expect(sortPeers(sample)).toEqual(expected)
    })
  })

  describe('when the `height` is the same', () => {
    it('sorts the peers by `delay`', () => {
      const sample = [peers[7], peers[5], peers[6], peers[4]]
      const expected = peers.slice(4,8)
      expect(sortPeers(sample)).toEqual(expected)
    })
  })

  it('sorts the peers by `height` and then `delay`', () => {
    const sample = [peers[3], peers[5], peers[8], peers[9], peers[10]]
    const expected = [peers[8], peers[3], peers[10], peers[9], peers[5]]
    expect(sortPeers(sample)).toEqual(expected)
  })
})
