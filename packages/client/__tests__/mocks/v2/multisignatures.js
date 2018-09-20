module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/multisignatures`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/multisignatures/pending`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/multisignatures/wallets`).reply(200, { data: [] })
}
