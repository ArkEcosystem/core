import "jest-extended";
import { Application, Container } from "@packages/core-kernel";
import { initApp, ItemResponse } from "../__support__";
import { BlockchainController } from "@packages/core-api/src/controllers/blockchain";
import { StateStoreMocks } from "./mocks";
import { Interfaces } from "@packages/crypto";

let app: Application;
let controller: BlockchainController;

beforeEach(() => {
    app = initApp();

    app
        .unbind(Container.Identifiers.StateStore);
    app
        .bind(Container.Identifiers.StateStore)
        .toConstantValue(StateStoreMocks.stateStore);

    controller = app.resolve<BlockchainController>(BlockchainController);
});

describe("BlockchainController", () => {
    describe("index", () => {
        it("should return last block from store", async () => {
            let mockBlockData: Partial<Interfaces.IBlockData> = {
                id: "1",
                height: 1,
            };

            let mockBlock: Partial<Interfaces.IBlock> = {
                data: mockBlockData as Interfaces.IBlockData
            };

            StateStoreMocks.setMockBlock(mockBlock);

            type BlockItemResponse = ItemResponse & {
                data: {
                    block: {
                        id: string,
                        height: number
                    },
                    supply: string
                },
            }

            let response = <BlockItemResponse>(await controller.index());

            expect(response.data.supply).toBeDefined();
            expect(response.data.block).toEqual(mockBlockData);
        });
    });
});
