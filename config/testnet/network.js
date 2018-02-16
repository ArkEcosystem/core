module.exports = {
  name: 'testnet',
  messagePrefix: 'TEST message:\n',
  bip32: {
    public: 70617039,
    private: 70615956
  },
  pubKeyHash: 23,
  nethash: 'd9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192',
  wif: 186,
  client: {
    token: 'TARK',
    symbol: 'TѦ',
    explorer: 'http://texplorer.ark.io'
  },
  peers: [{
    ip: '127.0.0.1',
    port: 4000
  }],
  constants: [{
    height: 1,
    reward: 0,
    activeDelegates: 51,
    blocktime: 8,
    block: {
      version: 0,
      maxTransactions: 50,
      maxPayload: 2097152
    },
    epoch: '2017-03-21T13:00:00UTC',
    fees: {
      send: 10000000,
      vote: 100000000,
      secondsignature: 500000000,
      delegate: 2500000000,
      multisignature: 500000000
    }
  }, {
    height: 75600,
    reward: 200000000
  }],
  exceptions: {}
}
