module.exports = (mock, host) => {
  mock.onGet(`${host}/api/votes`).reply(200, { data: [] })
  mock.onGet(`${host}/api/votes/123`).reply(200, { data: [] })
}
