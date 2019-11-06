import { Container, Providers, Utils, Contracts } from "@arkecosystem/core-kernel";

// todo: review the implementation
export const transformPeer = (app: Contracts.Kernel.Application, model) => {
    const config: Providers.PluginConfiguration = Utils.assert.defined(
        app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("p2p")
            .config(),
    );

    return {
        ip: model.ip,
        port: +Utils.assert.defined<number>(config.get<number>("server.port")),
        ports: model.ports,
        version: model.version,
        height: model.state ? model.state.height : model.height,
        latency: model.latency,
    };
};
