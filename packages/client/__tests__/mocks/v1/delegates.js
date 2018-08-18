module.exports = (mock, host) => {
  mock.onGet(`${host}/api/delegates`).reply(200, { data: [] })
  mock.onGet(`${host}/api/delegates/count`).reply(200, { data: [] })
  mock.onGet(`${host}/api/delegates/fee`).reply(200, { data: [] })
  mock.onGet(`${host}/api/delegates/forging/getForgedByAccount`).reply(200, { data: [] })
  mock.onGet(`${host}/api/delegates/get`).reply(200, { data: [] })
  mock.onGet(`${host}/api/delegates/search`).reply(200, { data: [] })
  mock.onGet(`${host}/api/delegates/voters`).reply(200, { data: [] })
}
