# MQTT plugin for Ark Ecosystem

MQTT plugin that broadcasts events to an MQTT broker. At the moment this plugin only broadcasts but
might be extended with additional features as well as including an MQTT server so users won't have
to run a separate MQTT broker.

If you have any feature requests don't forget to open an Issue.

#### ❤️ Support maintenance and development of plugins
If you find this or other plugins useful please consider

- voting for `deadlock` delegate
- donating to `AWtgFYbvtLDYccJvC5MChk4dpiUy2Krt2U`

to support development new plugins and tools for Ark's Ecosystem and maintenance of existing ones. Full list of contributions can be found on [https://arkdelegates.live/delegate/deadlock/](https://arkdelegates.live/delegate/deadlock/contributions/). 🖖

## Installation

### Adding plugin to config

Before restarting your process, you need to add the plugin into the very end  `core.plugins` or `relay.plugins` section of `app.json` file:

```json
{
    "package": "@deadlock-delegate/mqtt",
    "options": {
        "enabled": true,
        "events": ["block.forged"],
        "topic": "ark/events",
        "mqttBroker": "mqtt://localhost:1883"
    }
}
```

### For production (eg. devnet/mainnet):

1. Install plugin: `ark plugin:install @deadlock-delegate/mqtt`
2. Add plugin to `app.json`
3. Start your node as you usually start it 

### For development (eg. testnet):

You can run a development MQTT broker by navigating to `etc/` directory in this project a run `docker-compose up`. This will start a MQTT broker in docker.

Assuming you don't run testnet locally via docker:

1. Clone this plugin into `plugins/` directory of the [core](https://github.com/ArkEcosystem/core/) project
2. Add plugin to `app.json`, for testnet the file can be found in: `core/packages/core/bin/config/testnet/app.json`
3. Go into the plugin's directory: `cd mqtt`
4. Build plugin: `yarn build`
5. Run `yarn full:testnet` inside `core/packages/core` directory to start testnet with mqtt plugin

## Credits

- [roks0n](https://github.com/roks0n)
- [console](https://github.com/c0nsol3)
- [All Contributors](../../contributors)

## License

[MIT](LICENSE) © deadlock delegate
