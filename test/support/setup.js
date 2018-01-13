const chai = require('chai')
const sinonChai = require('sinon-chai')
const chaiHttp = require('chai-http')

// Chai plugins
chai.use(sinonChai)
chai.use(chaiHttp)
