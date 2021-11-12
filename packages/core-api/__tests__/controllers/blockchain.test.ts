import "jest-extended";

import Hapi from "@hapi/hapi";
import { BlockchainController } from "@packages/core-api/src/controllers/blockchain";
import { Application } from "@packages/core-kernel";
import { Mocks } from "@packages/core-test-framework";
import { Interfaces } from "@packages/crypto";

import { initApp, ItemResponse } from "../__support__";

let app: Application;
let controller: BlockchainController;
const request = {} as unknown as Hapi.Request;
const h = {} as unknown as Hapi.ResponseToolkit;

beforeEach(() => {
    app = initApp();

    controller = app.resolve<BlockchainController>(BlockchainController);
});

afterEach(() => {
    Mocks.StateStore.setBlock(undefined);
});

describe("BlockchainController", () => {
    describe("index", () => {
        it("should return last block from store", async () => {
            const mockBlockData: Partial<Interfaces.IBlockData> = {
                id: "1",
                height: 1,
            };

            const mockBlock = {
                data: mockBlockData,
            };

            Mocks.StateStore.setBlock(mockBlock as Partial<Interfaces.IBlock>);

            type BlockItemResponse = ItemResponse & {
                data: {
                    block: {
                        id: string;
                        height: number;
                    };
                    supply: string;
                };
            };

            const response = (await controller.index(request, h)) as BlockItemResponse;

            expect(response.data.supply).toBeDefined();
            expect(response.data.block).toEqual(mockBlockData);
        });
    });
});
