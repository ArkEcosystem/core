import { Container } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
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

    public getBlocksInCurrentRound(): Interfaces.IBlock[] {
        return this.blocksInCurrentRound;
    }

    public setBlocksInCurrentRound(blocksInCurrentRound: Interfaces.IBlock[]): void {
        this.blocksInCurrentRound = blocksInCurrentRound;
    }

    public resetBlocksInCurrentRound(): void {
        this.blocksInCurrentRound = [];
    }
}
