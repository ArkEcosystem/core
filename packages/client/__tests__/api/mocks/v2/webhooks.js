export default function (mock) {
  mock.onGet('webhooks').reply(200, { data: [] })
  mock.onPost('webhooks').reply(200, { data: [] })
  mock.onGet('webhooks/123').reply(200, { data: [] })
  mock.onPut('webhooks/123').reply(200, { data: [] })
  mock.onDelete('webhooks/123').reply(200, { data: [] })
  mock.onGet('webhooks/events').reply(200, { data: [] })
}
