module.exports = (mock) => {
  mock.onGet('transactions').reply(200, { data: [] })
  mock.onPost('transactions').reply(200, { data: [] })
  mock.onGet('transactions/123').reply(200, { data: [] })
  mock.onGet('transactions/unconfirmed').reply(200, { data: [] })
  mock.onGet('transactions/unconfirmed/123').reply(200, { data: [] })
  mock.onPost('transactions/search').reply(200, { data: [] })
  mock.onGet('transactions/types').reply(200, { data: [] })
}
