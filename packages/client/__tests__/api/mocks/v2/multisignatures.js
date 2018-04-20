module.exports = (mock) => {
  mock.onGet('multisignatures').reply(200, { data: [] })
  mock.onGet('multisignatures/pending').reply(200, { data: [] })
  mock.onGet('multisignatures/wallets').reply(200, { data: [] })
}
