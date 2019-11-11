import { Contracts } from "@arkecosystem/core-kernel";

// todo: review the implementation
export const transformPeer = (app: Contracts.Kernel.Application, model) => {
    return {
        ip: model.ip,
        port: model.port,
        ports: model.ports,
        version: model.version,
        height: model.state ? model.state.height : model.height,
        latency: model.latency,
    };
};
