import "jest-extended";

import { BlockCommand } from "../../../../../packages/core-tester-cli/dist/commands/make/block";

describe("make:block", () => {
    it("should generate 1 block with default flags", async () => {
        const blocks = await BlockCommand.run(["--network=unitnet"]);

        expect(blocks).toHaveLength(1);

        expect(blocks[0].generatorPublicKey).toBe("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");
    });

    it("should generate 1 block with 10 transactions", async () => {
        const blocks = await BlockCommand.run(["--network=unitnet", "--transactions=10"]);

        expect(blocks[0].transactions).toHaveLength(10);
    });

    it("should generate 10 blocks", async () => {
        const blocks = await BlockCommand.run(["--network=unitnet", "--number=10"]);

        expect(blocks).toHaveLength(10);
    });

    it("should generate 10 blocks with 10 transactions", async () => {
        const blocks = await BlockCommand.run(["--network=unitnet", "--transactions=10"]);

        for (const block of blocks) {
            expect(block.transactions).toHaveLength(10);
        }
    });

    it("should generate a block with a custom passphrase", async () => {
        const blocks = await BlockCommand.run(["--network=unitnet", "--passphrase=123"]);

        expect(blocks[0].generatorPublicKey).toBe("03be686ed7f0539affbaf634f3bcc2b235e8e220e7be57e9397ab1c14c39137eb4");
    });
});
