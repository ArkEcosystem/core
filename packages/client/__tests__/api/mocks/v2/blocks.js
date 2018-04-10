export default function (mock) {
  mock.onGet('blocks').reply(200, { data: [] })
  mock.onGet('blocks/123').reply(200, { data: [] })
  mock.onGet('blocks/123/transactions').reply(200, { data: [] })
  mock.onPost('blocks/search').reply(200, { data: [] })
}
