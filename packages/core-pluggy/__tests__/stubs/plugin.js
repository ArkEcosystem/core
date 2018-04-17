exports.plugin = {
  pkg: {
    name: "stub/plugin",
    version: "1.0.0"
  },
  alias: 'stub-plugin',
  register: (hook, config, app) => {
    return {
      hook,
      config,
      app
    }
  }
}
