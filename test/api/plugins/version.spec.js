const restify = require('restify')
const request = require('request-promise')
const VersionPlugin = requireFrom('api/plugins/version')

function sendRequest (uri, version) {
  return request({
    uri,
    headers: {
      'Accept-Version': version
    },
    resolveWithFullResponse: true,
    json: true
  })
}

let server

describe('API 1.0 - Version', () => {
  beforeEach((done) => {
    server = restify.createServer({
      name: 'Version Test'
    })

    server.pre((req, res, next) => VersionPlugin(req, res, next))

    server.get({
      path: 'test',
      version: '1.0.0'
    }, (req, res, next) => {
      res.send({ version: req.version() })
    })

    server.get({
      path: 'test',
      version: '2.0.0'
    }, (req, res, next) => {
      res.send({ version: req.version() })
    })

    server.listen(3333, done)
  })

  it('should return 1.0.0 as version', (done) => {
    sendRequest('http://localhost:3333/test', '1.0.0').then((res) => {
      res.body.should.have.property('version').which.is.a('string').and.equals('1.0.0')

      server.close()

      done()
    })
  })

  it('should return 2.0.0 as version', (done) => {
    sendRequest('http://localhost:3333/test', '2.0.0').then((res) => {
      res.body.should.have.property('version').which.is.a('string').and.equals('2.0.0')

      server.close()

      done()
    })
  })
})
