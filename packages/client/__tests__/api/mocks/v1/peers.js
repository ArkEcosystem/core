module.exports = (mock) => {
  mock.onGet('peers').reply(200, { data: [] })
  mock.onGet('peers/get').reply(200, { data: [] })
  mock.onGet('peers/version').reply(200, { data: [] })
}
