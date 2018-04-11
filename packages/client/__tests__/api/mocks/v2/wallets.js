export default function (mock) {
  mock.onGet('wallets').reply(200, { data: [] })
  mock.onGet('wallets/top').reply(200, { data: [] })
  mock.onGet('wallets/123').reply(200, { data: [] })
  mock.onGet('wallets/123/transactions').reply(200, { data: [] })
  mock.onGet('wallets/123/transactions/sent').reply(200, { data: [] })
  mock.onGet('wallets/123/transactions/received').reply(200, { data: [] })
  mock.onGet('wallets/123/votes').reply(200, { data: [] })
  mock.onPost('wallets/search').reply(200, { data: [] })
}
