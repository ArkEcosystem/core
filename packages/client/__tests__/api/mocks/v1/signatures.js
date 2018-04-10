export default function (mock) {
  mock.onGet('signatures/fee').reply(200, { data: [] })
}
