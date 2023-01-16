import "jest-extended";

import { BlockchainController } from "@packages/core-api/src/controllers/blockchain";
import { Container, Utils } from "@packages/core-kernel";

import { Interfaces } from "@packages/crypto";

import { ItemResponse } from "../__support__";

const mockBlockData: Partial<Interfaces.IBlockData> = {
    id: "1",
    height: 1,
};

const burnWallet = {
    getBalance: jest.fn().mockReturnValue(Utils.BigNumber.ZERO),
};

const walletRepo = {
    getBurnWallet: jest.fn().mockReturnValue(burnWallet),
};

const stateStore = {
    getLastBlock: jest.fn().mockReturnValue({ data: mockBlockData }),
};

let controller: BlockchainController;

beforeEach(() => {
    const container = new Container.Container();
    container.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepo);
    container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
    container.bind(Container.Identifiers.Application).toConstantValue({});
    container.bind(Container.Identifiers.PluginConfiguration).toConstantValue({});

    controller = container.resolve<BlockchainController>(BlockchainController);
});

describe("BlockchainController", () => {
    describe("index", () => {
        it("should return last block from store", async () => {
            type BlockItemResponse = ItemResponse & {
                data: {
                    block: {
                        id: string;
                        height: number;
                    };
                    supply: string;
                    generated: string;
                    burned: string;
                };
            };

            const response = (await controller.index()) as BlockItemResponse;

            expect(response.data.supply).toBeString();
            expect(response.data.generated).toBeString();
            expect(response.data.burned).toBeString();
            expect(response.data.block).toEqual(mockBlockData);
        });
    });
});
