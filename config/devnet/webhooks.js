module.exports = [{
  event: 'block:forged',
  enabled: true,
  options: {
    hook: {
      url: 'https://httpbin.org/post',
      authToken: 'Hello World'
    },
    expiration: {
      enabled: true,
      period: 3600
    },
    retry: 5
  }
}]
