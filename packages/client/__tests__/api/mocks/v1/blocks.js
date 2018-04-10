export default function (mock) {
  mock.onGet('blocks').reply(200, { data: [] })
  mock.onGet('blocks/get').reply(200, { data: [] })
  mock.onGet('blocks/getEpoch').reply(200, { data: [] })
  mock.onGet('blocks/getFee').reply(200, { data: [] })
  mock.onGet('blocks/getFees').reply(200, { data: [] })
  mock.onGet('blocks/getHeight').reply(200, { data: [] })
  mock.onGet('blocks/getMilestone').reply(200, { data: [] })
  mock.onGet('blocks/getNethash').reply(200, { data: [] })
  mock.onGet('blocks/getReward').reply(200, { data: [] })
  mock.onGet('blocks/getStatus').reply(200, { data: [] })
  mock.onGet('blocks/getSupply').reply(200, { data: [] })
}
