'use strict'

exports.plugin = {
  pkg: {
    name: 'stub/plugin',
    version: '1.0.0'
  },
  alias: 'stub-plugin',
  register: (container, options) => {
    return {
      manager,
      options
    }
  }
}
