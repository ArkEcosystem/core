module.exports = (mock) => {
  mock.onGet('accounts').reply(200, { data: [] })
  mock.onGet('accounts/count').reply(200, { data: [] })
  mock.onGet('accounts/delegates').reply(200, { data: [] })
  mock.onGet('accounts/delegates/fee').reply(200, { data: [] })
  mock.onGet('accounts/getAllAccounts').reply(200, { data: [] })
  mock.onGet('accounts/getBalance').reply(200, { data: [] })
  mock.onGet('accounts/getPublicKey').reply(200, { data: [] })
  mock.onGet('accounts/top').reply(200, { data: [] })
}
