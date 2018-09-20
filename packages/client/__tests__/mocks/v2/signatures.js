module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/signatures`).reply(200, { data: [] })
}
