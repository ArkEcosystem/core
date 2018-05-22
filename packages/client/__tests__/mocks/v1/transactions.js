module.exports = (mock) => {
  mock.onGet('transactions').reply(200, { data: [] })
  mock.onGet('transactions/get').reply(200, { data: [] })
  mock.onGet('transactions/unconfirmed').reply(200, { data: [] })
  mock.onGet('transactions/unconfirmed/get').reply(200, { data: [] })
}
