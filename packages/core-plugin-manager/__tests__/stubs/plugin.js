'use strict';

exports.plugin = {
  pkg: {
    name: 'stub/plugin',
    version: '1.0.0'
  },
  alias: 'stub-plugin',
  register: (manager, options) => {
    return {
      manager,
      hook,
      options
    }
  }
}
