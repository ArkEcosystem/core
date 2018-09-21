module.exports = (mock, host) => {
  mock.onGet(`${host}/api/multisignatures`).reply(200, { data: [] })
  mock.onGet(`${host}/api/multisignatures/pending`).reply(200, { data: [] })
  mock.onGet(`${host}/api/multisignatures/wallets`).reply(200, { data: [] })
}
