import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { DatabaseInterceptor } from "@arkecosystem/core-state";
import { Crypto, Interfaces } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { constants } from "../../constants";
import { MissingCommonBlockError } from "../../errors";
import { getPeerIp } from "../../utils/get-peer-ip";
import { getPeerConfig } from "../utils/get-peer-config";
import { Controller } from "./controller";

export class PeerController extends Controller {
    @Container.inject(Container.Identifiers.PeerRepository)
    private readonly peerRepository!: Contracts.P2P.PeerRepository;

    @Container.inject(Container.Identifiers.DatabaseInterceptor)
    private readonly databaseInterceptor!: DatabaseInterceptor;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    public getPeers(request: Hapi.Request, h: Hapi.ResponseToolkit): Contracts.P2P.PeerBroadcast[] {
        const peerIp = getPeerIp(request.socket);

        return this.peerRepository
            .getPeers()
            .filter((peer) => peer.ip !== peerIp)
            .filter((peer) => peer.port !== -1)
            .sort((a, b) => {
                Utils.assert.defined<number>(a.latency);
                Utils.assert.defined<number>(b.latency);

                return a.latency - b.latency;
            })
            .slice(0, constants.MAX_PEERS_GETPEERS)
            .map((peer) => peer.toBroadcast());
    }

    public async getCommonBlocks(
        request: Hapi.Request,
        h: Hapi.ResponseToolkit,
    ): Promise<{
        common: Interfaces.IBlockData;
        lastBlockHeight: number;
    }> {
        const commonBlocks: Interfaces.IBlockData[] = await this.databaseInterceptor.getCommonBlocks(
            (request.payload as any).ids,
        );

        if (!commonBlocks.length) {
            throw new MissingCommonBlockError();
        }

        return {
            common: commonBlocks.sort((a, b) => a.height - b.height)[commonBlocks.length - 1],
            lastBlockHeight: this.blockchain.getLastBlock().data.height,
        };
    }

    public async getStatus(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Contracts.P2P.PeerPingResponse> {
        const lastBlock: Interfaces.IBlock = this.blockchain.getLastBlock();

        const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, lastBlock.data.height);
        const slotInfo = Crypto.Slots.getSlotInfo(blockTimeLookup);

        return {
            state: {
                height: lastBlock.data.height,
                forgingAllowed: slotInfo.forgingStatus,
                currentSlot: slotInfo.slotNumber,
                header: lastBlock.getHeader(),
            },
            config: getPeerConfig(this.app),
        };
    }
}
