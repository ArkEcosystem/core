import { Container } from "@packages/core-kernel";
import { Interfaces } from "@packages/crypto";
import assert from "assert";

@Container.injectable()
export class RoundState {
    private blocksInCurrentRound: Interfaces.IBlock[] = [];

    public pushBlock(block: Interfaces.IBlock): void {
        this.blocksInCurrentRound.push(block);
    }

    public popBlock(): Interfaces.IBlock {
        const block = this.blocksInCurrentRound.pop();
        assert(block);

        return block!;
    }

    public resetBlocksInCurrentRound(): void {
        this.blocksInCurrentRound = [];
    }

    public getBlocksInCurrentRound(): Interfaces.IBlock[] {
        return this.blocksInCurrentRound;
    }
}
