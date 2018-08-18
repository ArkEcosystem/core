module.exports = (mock, host) => {
  mock.onGet(`${host}/api/signatures/fee`).reply(200, { data: [] })
}
