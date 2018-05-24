module.exports = (mock) => {
  mock.onGet('statistics/blockchain').reply(200, { data: [] })
  mock.onGet('statistics/transactions').reply(200, { data: [] })
  mock.onGet('statistics/blocks').reply(200, { data: [] })
  mock.onGet('statistics/votes').reply(200, { data: [] })
  mock.onGet('statistics/unvotes').reply(200, { data: [] })
}
