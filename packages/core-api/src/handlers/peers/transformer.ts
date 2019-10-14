import { app, Container, Providers } from "@arkecosystem/core-kernel";

// todo: review the implementation
export const transformPeer = model => {
    return {
        ip: model.ip,
        port: +app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("@arkecosystem/core-p2p")
            .config()
            .get("server.port"),
        ports: model.ports,
        version: model.version,
        height: model.state ? model.state.height : model.height,
        latency: model.latency,
    };
};
