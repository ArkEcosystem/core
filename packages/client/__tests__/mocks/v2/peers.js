module.exports = (mock) => {
  mock.onGet('peers').reply(200, { data: [] })
  mock.onGet('peers/123').reply(200, { data: [] })
}
