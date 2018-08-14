module.exports = (mock, host) => {
  mock.onGet(`${host}/api/blocks`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/get`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/getEpoch`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/getFee`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/getFees`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/getHeight`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/getMilestone`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/getNethash`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/getReward`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/getStatus`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/getSupply`).reply(200, { data: [] })
}
