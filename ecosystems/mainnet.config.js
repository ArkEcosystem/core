module.exports = {
  apps: [{
    name: 'ark-mainnet',
    script: './app/start-relay-node.js',
    args: '-c ./config/mainnet',
    exec_mode: 'fork',
    env: {
      'NODE_ENV': 'development',
      'NODE_PATH': '.'
    },
    env_production: {
      'NODE_ENV': 'production',
      'NODE_PATH': '.'
    }
  }]
}
