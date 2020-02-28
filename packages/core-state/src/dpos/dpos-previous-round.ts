import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class DposPreviousRoundState implements Contracts.State.DposPreviousRoundState {
    @Container.inject(Container.Identifiers.BlockState)
    @Container.tagged("state", "clone")
    private readonly blockState!: Contracts.State.BlockState;

    @Container.inject(Container.Identifiers.DposState)
    @Container.tagged("state", "clone")
    private readonly dposState!: Contracts.State.DposState;

    public async revert(blocks: Interfaces.IBlock[], roundInfo: Contracts.Shared.RoundInfo): Promise<void> {
        for (const block of blocks.slice().reverse()) {
            if (block.data.height === 1) {
                break;
            }
            await this.blockState.revertBlock(block);
        }
        this.dposState.buildDelegateRanking();
        this.dposState.setDelegatesRound(roundInfo);
    }

    public getAllDelegates(): readonly Contracts.State.Wallet[] {
        return this.dposState.getAllDelegates();
    }

    public getRoundDelegates(): readonly Contracts.State.Wallet[] {
        return this.dposState.getRoundDelegates();
    }
}
