module.exports = (mock) => {
  mock.onGet('signatures').reply(200, { data: [] })
}
