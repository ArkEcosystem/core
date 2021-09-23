const api = {};

module.exports = Object.assign(api,
                               require('./lib/comparison'),
                               require('./lib/ranges'),
                               require('./lib/functions'));
