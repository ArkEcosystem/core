module.exports = (mock, host) => {
  mock.onGet(`${host}/api/webhooks`).reply(200, { data: [] })
  mock.onPost(`${host}/api/webhooks`).reply(200, { data: [] })
  mock.onGet(`${host}/api/webhooks/123`).reply(200, { data: [] })
  mock.onPut(`${host}/api/webhooks/123`).reply(200, { data: [] })
  mock.onDelete(`${host}/api/webhooks/123`).reply(200, { data: [] })
  mock.onGet(`${host}/api/webhooks/events`).reply(200, { data: [] })
}
