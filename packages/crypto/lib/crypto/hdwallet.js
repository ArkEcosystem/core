const bip32 = require('bip32')
const bip39 = require('bip39')
const configManager = require('../managers/config')

class HDWallet {
  constructor () {
    this.slip44 = 111
  }

  /**
   * Get root node from the given mnemonic with an optional passphrase.
   * @param {String} mnemonic
   * @param {(String|undefined)} passphrase
   * @returns {bip32}
   */
  fromMnemonic (mnemonic, passphrase) {
    const seed = bip39.mnemonicToSeed(mnemonic, passphrase)
    return bip32.fromSeed(seed, configManager.config)
  }

  /**
   * Get bip32 node from keys.
   * @param {Object} keys
   * @param {Buffer} chainCode
   * @returns {bip32}
   */
  fromKeys (keys, chainCode) {
    if (!keys.compressed) {
      throw new TypeError('BIP32 only allows compressed keys.')
    }

    return bip32.fromPrivateKey(Buffer.from(keys.privateKey, 'hex'), chainCode, configManager.config)
  }

  /**
   * Get key pair from the given node.
   * @param {bip32} node
   * @return {Object}
   */
  getKeys (node) {
    return {
      publicKey: node.publicKey.toString('hex'),
      privateKey: node.privateKey.toString('hex'),
      compressed: true
    }
  }

  /**
   * Derives a node from the coin type as specified by slip44.
   * @param {bip32} root
   * @param {(Boolean|undefined)} hardened
   * @returns {bip32}
   */
  deriveSlip44 (root, hardened = true) {
    return root.derivePath(`m/44'/${this.slip44}${hardened ? '\'' : ''}`)
  }

  /**
   * Derives a node from the network as specified by AIP20.
   * @param {bip32} root
   * @returns {bip32}
   */
  deriveNetwork (root) {
    return this.deriveSlip44(root).deriveHardened(configManager.config.aip20 || 1)
  }
}

module.exports = new HDWallet()
