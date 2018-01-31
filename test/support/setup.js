const chai = require('chai')
const sinonChai = require('sinon-chai')
const chaiHttp = require('chai-http')
const path = require('path')
const config = require('../../core/config')

chai.use(sinonChai)
chai.use(chaiHttp)

const conf = 'config/devnet/'

config.init({
  server: require(path.resolve(conf, 'server.json')),
  genesisBlock: require(path.resolve(conf, 'genesisBlock.json')),
  network: require(path.resolve(conf, 'network.json'))
})
