'use strict'

const testSubject = require('../../lib/commands/identity')
const fixtureIdentities = require('../__fixtures__/identities.json')

describe('Commands - Identity', () => {
  it('should be a function', () => {
    expect(testSubject).toBeFunction()
  })

  it('should return identities from passphrase', () => {
    const expected = {
      passphrase: 'this is a top secret passphrase',
      publicKey: '034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192',
      privateKey: 'd8839c2432bfd0a67ef10a804ba991eabba19f154a3d707917681d45822a5712',
      address: 'D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib'
    }

    expect(testSubject({
      data: fixtureIdentities.passphrase,
      type: 'passphrase'
    })).toEqual(expected)
  })

  it('should return identities from privateKey', () => {
    const expected = {
      publicKey: '034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192',
      privateKey: 'd8839c2432bfd0a67ef10a804ba991eabba19f154a3d707917681d45822a5712',
      address: 'D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib'
    }

    expect(testSubject({
      data: fixtureIdentities.privateKey,
      type: 'privateKey'
    })).toEqual(expected)
  })

  it('should return identities from publicKey', () => {
    const expected = {
      publicKey: '034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192',
      address: 'D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib'
    }

    expect(testSubject({
      data: fixtureIdentities.publicKey,
      type: 'publicKey'
    })).toEqual(expected)
  })
})
