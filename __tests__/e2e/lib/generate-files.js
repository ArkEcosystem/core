'use strict'

const path = require('path')
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

/**
 * Generates folder structure and files from network configuration
 * @param  {Object} options = { nodes: 3 }
 * @return {void}
 */
module.exports = (options) => {
  console.log('[generate-files] Start');
  
  (new GenerateManager(options)).generate()
}

class GenerateManager {
  /**
   * Create a new generate manager instance.
   * @param  {Object} options
   */
  constructor (options) {
    const nodes = []
    for (let i = 0; i < options.nodes ; i++) {
      nodes.push('node' + i)
    }
    this.nodes = nodes

    this.rootPath = path.dirname('../')
    this.coreRootPath = path.dirname('../../..')
  }

  async generate() {
    await this.copyCore()
    this.createFiles()
  }

  async copyCore() {
    console.log('[generate-files] Copying core into each node folder...');

    await Promise.all(this.nodes.map(node => {
      const nodePath = path.join(this.rootPath, 'dist', node)
      const copyCoreScript = path.join(this.rootPath, 'lib/utils/copy-core.sh')
      console.log(`Executing : mkdir -p ${nodePath} && bash ${copyCoreScript} ${this.coreRootPath}  ${nodePath}`)
      return exec(`mkdir -p ${nodePath} && bash ${copyCoreScript} ${this.coreRootPath} ${nodePath}`)
    }))

    console.log('[generate-files] Core copy done');
  }

  async createFiles() {
    // nginx files (proxy for external api requests to the nodes)
    const thisNginxPath = path.join(this.rootPath, 'lib/config/nginx')
    const distNginxPath = path.join(this.rootPath, 'dist', 'nginx')

    await exec(`mkdir ${distNginxPath}`)

    copyFiles([
      {
        from: thisNginxPath,
        to: distNginxPath,
        files: [ 'docker-compose.yml', 'nginx.conf' ]
      }
    ])
    console.log(`[generate-files] Files copy done for nginx`);

    const thisNetworkPath = path.join(this.coreRootPath, 'packages/core/bin/config/testnet')
    const thisDockerPath = path.join(this.rootPath, 'lib/config/docker')

    const delegates = JSON.parse(fs.readFileSync(path.join(thisNetworkPath, 'delegates.json'), 'utf8'));

    for (const [index, node] of this.nodes.entries()) {
      const distNodePath = path.join(this.rootPath, 'dist', node)
      const distCoreNetworkPath = path.join(distNodePath, 'packages/core/bin/config/testnet')
      const distDockerPath = path.join(distNodePath, 'docker/testnet-e2e')

      await exec(`mkdir ${distDockerPath}`)

      const arkScript = index > 0 ? 'ark.sh' : 'ark-network-start.sh'

      copyFiles([
        {
          from: thisDockerPath,
          to: distDockerPath,
          files: [ 'Dockerfile', 'docker-compose-stack.yml', 'docker-compose.yml', 'entrypoint.sh' ]
        },
        {
          from: thisDockerPath,
          to: distNodePath,
          files: [ [ arkScript, 'ark.sh' ] ]
        }
      ])
      
      // need to rework delegates.json to distribute them among the nodes
      const nodeDelegates = Object.assign({}, delegates)
      const chunkSize = Math.ceil(delegates.secrets.length / this.nodes.length)
      nodeDelegates.secrets = delegates.secrets.slice(index * chunkSize, (index + 1) * chunkSize)
      fs.writeFile(path.join(distCoreNetworkPath, 'delegates.json'),
          JSON.stringify(nodeDelegates, null, 2),
          (err) => {
            if (err) throw err;
      })

      // plugins.js minimumNetworkReach and coldStart to set to 1
      const plugins = fs.readFileSync(path.join(distCoreNetworkPath, 'plugins.js'), 'utf8');
      const pluginsFixed = plugins
        .replace(/minimumNetworkReach: \d+/, "minimumNetworkReach: 1")
        .replace(/coldStart: \d+/, "coldStart: 1")
        
      fs.writeFileSync(path.join(distCoreNetworkPath, 'plugins.js'), pluginsFixed);

      console.log(`[generate-files] Files copy done for ${node}`);
    }

    copyFiles([
      {
        from: thisDockerPath,
        to: path.join(this.rootPath, 'dist'),
        files: [ 'docker-init.sh', 'docker-start.sh' ]
      }
    ])

    console.log(`[generate-files] Docker files copy done`);

    function copyFiles(filesToCopy) {
      for (const copyParams of filesToCopy) {
        for (const fileName of copyParams.files) {
          const fileNameFrom = Array.isArray(fileName) ? fileName[0] : fileName
          const fileNameTo = Array.isArray(fileName) ? fileName[1] : fileName
          
          fs.createReadStream(path.join(copyParams.from, fileNameFrom))
            .pipe(fs.createWriteStream(path.join(copyParams.to, fileNameTo)))
        }
      }
    }
  }
}
