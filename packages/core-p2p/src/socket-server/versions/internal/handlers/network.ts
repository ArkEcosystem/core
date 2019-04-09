import { P2P } from "@arkecosystem/core-interfaces";

export const getNetworkState = async (service: P2P.IPeerService) => ({
    data: await service.getMonitor().getNetworkState(),
});
