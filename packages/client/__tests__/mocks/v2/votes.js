module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/votes`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/votes/123`).reply(200, { data: [] })
}
