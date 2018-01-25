const restify = require('restify')
const request = require('request-promise')
const PaginatorPlugin = requireFrom('api/plugins/paginator')
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

describe('API 1.0 - Paginator', () => {
  beforeEach((done) => {
    server = restify.createServer({
      name: 'Paginator Test'
    })

    server.pre((req, res, next) => VersionPlugin(req, res, next))
    server.use(restify.plugins.bodyParser({
      mapParams: true
    }))
    server.use(restify.plugins.queryParser())
    server.use((req, res, next) => new PaginatorPlugin().mount(req, res, next))

    server.get({
      path: 'test',
      version: '1.0.0'
    }, (req, res, next) => {
      res.send({
        links: req.paginator.links(1000)
      })
    })

    server.get({
      path: 'test',
      version: '2.0.0'
    }, (req, res, next) => {
      res.send({
        links: req.paginator.links(1000)
      })
    })

    server.listen(3333, done)
  })

  it('should the correct last, next, prev and first links on the first page', (done) => {
    sendRequest('http://localhost:3333/test?page=1', '2.0.0').then((res) => {
      res.body.links.should.have.property('last').which.is.a('string').and.equals('http://localhost:3333/test?page=10&perPage=100')
      res.body.links.should.have.property('next').which.is.a('string').and.equals('http://localhost:3333/test?page=2&perPage=100')

      server.close()

      done()
    })
  })

  it('should the correct last, next, prev and first links on the second page', (done) => {
    sendRequest('http://localhost:3333/test?page=2', '2.0.0').then((res) => {
      res.body.links.should.have.property('prev').which.is.a('string').and.equals('http://localhost:3333/test?page=1&perPage=100')
      res.body.links.should.have.property('first').which.is.a('string').and.equals('http://localhost:3333/test?page=1&perPage=100')
      res.body.links.should.have.property('last').which.is.a('string').and.equals('http://localhost:3333/test?page=10&perPage=100')
      res.body.links.should.have.property('next').which.is.a('string').and.equals('http://localhost:3333/test?page=3&perPage=100')

      server.close()

      done()
    })
  })
})
