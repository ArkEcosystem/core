module.exports = {
  name: 'bitcoin',
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x00,
  wif: 0x80
}
