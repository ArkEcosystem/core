import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { DatabaseInteraction } from "@arkecosystem/core-state";
import { Crypto, Interfaces } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { MissingCommonBlockError } from "../../errors";
import { getPeerConfig } from "../utils/get-peer-config";
import { Controller } from "./controller";

export class PeerController extends Controller {
    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly peerStorage!: Contracts.P2P.PeerStorage;

    @Container.inject(Container.Identifiers.DatabaseInteraction)
    private readonly databaseInteraction!: DatabaseInteraction;

    public getPeers(request: Hapi.Request, h: Hapi.ResponseToolkit): Contracts.P2P.PeerBroadcast[] {
        return this.peerStorage
            .getPeers()
            .filter((peer) => peer.port !== -1)
            .map((peer) => peer.toBroadcast())
            .sort((a, b) => {
                Utils.assert.defined<number>(a.latency);
                Utils.assert.defined<number>(b.latency);

                return a.latency - b.latency;
            });
    }

    public async getCommonBlocks(
        request: Hapi.Request,
        h: Hapi.ResponseToolkit,
    ): Promise<{
        common: Interfaces.IBlockData;
        lastBlockHeight: number;
    }> {
        const commonBlocks: Interfaces.IBlockData[] = await this.databaseInteraction.getCommonBlocks(
            (request.payload as any).ids,
        );

        if (!commonBlocks.length) {
            throw new MissingCommonBlockError();
        }

        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
        return {
            common: commonBlocks.sort((a, b) => a.height - b.height)[commonBlocks.length - 1],
            lastBlockHeight: blockchain.getLastBlock().data.height,
        };
    }

    public async getStatus(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Contracts.P2P.PeerPingResponse> {
        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
        const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();

        if (!lastBlock) {
            return {
                state: {
                    height: 0,
                    forgingAllowed: false,
                    currentSlot: 0,
                    header: {},
                },
                config: getPeerConfig(this.app),
            };
        }

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
