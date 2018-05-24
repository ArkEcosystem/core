module.exports = (mock) => {
  mock.onGet('votes').reply(200, { data: [] })
  mock.onGet('votes/123').reply(200, { data: [] })
}
