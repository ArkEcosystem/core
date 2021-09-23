var chokidar = require('chokidar');

module.exports.attach = function (scMasterInstance, options) {
  if (!options) {
    options = {};
  }
  chokidar.watch('.', options).on('change', (filePath) => {
    console.log('   !! File ' + filePath + ' was modified. Restarting workers...');
    scMasterInstance.killWorkers({immediate: true});
  });
};
