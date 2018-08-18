module.exports = (mock, host) => {
  mock.onGet(`${host}/api/signatures`).reply(200, { data: [] })
}
