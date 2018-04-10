export default function (mock) {
  mock.onGet('delegates').reply(200, { data: [] })
  mock.onGet('delegates/123').reply(200, { data: [] })
  mock.onGet('delegates/123/blocks').reply(200, { data: [] })
  mock.onGet('delegates/123/voters').reply(200, { data: [] })
}
