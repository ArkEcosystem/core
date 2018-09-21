module.exports = (mock, host) => {
  mock.onGet(`${host}/api/node/status`).reply(200, { data: [] })
  mock.onGet(`${host}/api/node/syncing`).reply(200, { data: [] })
  mock.onGet(`${host}/api/node/configuration`).reply(200, { data: [] })
}
