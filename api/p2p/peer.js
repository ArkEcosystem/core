
const popsicle = require('popsicle');
const schema = require('./schema');
const logger = require('../../core/logger');


class Peer {

  constructor(ip, port, config){
    this.ip = ip;
    this.port = port;
    this.url = (port % 443 == 0 ? 'https://' : 'http://') + `${ip}:${port}`;
    this.headers = {
      version: config.server.version,
      port: config.server.port,
      nethash: config.network.nethash
    };
  }

  toBroadcastInfo(){
    return {
      ip: this.ip, 
      port: this.port,
      version: this.version,
      os: this.os,
      status: this.status,
      height: this.height,
      delay: this.delay
    };
  }

  get(api){
    const temp = new Date().getTime();
    const that = this;
    return popsicle
      .request({
        method: 'GET',
        url: this.url + api,
        headers: this.headers,
        timeout: 10000
      })
      .use(popsicle.plugins.parse('json'))
      .then((res) => {
        that.delay = new Date().getTime() - temp;
        return Promise.resolve(res);
      })
      .then((res) => this.parseHeaders(res))
      .catch((error) => this.status = error.code)
      .then((res) => Promise.resolve(res.body));
  }

  parseHeaders(res){
    ['nethash', 'os', 'version', 'height'].forEach((key) => this[key] = res.headers[key]);
    this.status = 'OK';
    return Promise.resolve(res);
  }

  downloadBlocks(lastBlock){
    return popsicle
      .request({
        method: 'GET',
        url: this.url + '/peer/blocks?lastBlockHeight='+lastBlock.data.height,
        headers: this.headers,
        timeout: 60000
      })
      .use(popsicle.plugins.parse('json'))
      .then((res) => Promise.resolve(res.body));
  }


  ping(){
    return this
      .get('/peer/status')
      .then((body) => this.height = (body||{}).height);
  }

  getPeers(){
    return this.get('/peer/list').then((body) => Promise.resolve(body.peers));
  }
}

module.exports = Peer;