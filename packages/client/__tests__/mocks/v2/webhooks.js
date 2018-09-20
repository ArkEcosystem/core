module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/webhooks`).reply(200, { data: [] })
  mock.onPost(`${host}/api/v2/webhooks`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/webhooks/123`).reply(200, { data: [] })
  mock.onPut(`${host}/api/v2/webhooks/123`).reply(200, { data: [] })
  mock.onDelete(`${host}/api/v2/webhooks/123`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/webhooks/events`).reply(200, { data: [] })
}
