export default function (mock) {
  mock.onGet('signatures').reply(200, { data: [] })
}
