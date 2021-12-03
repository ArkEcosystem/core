import { Interfaces, State } from "@packages/crypto";

export class StateService {
    private previousStates: Interfaces.IState[] = [];
    private lastState!: Interfaces.IState;

    public getLastHeight(): number {
        //
    }

    public getLastBlock(): Interfaces.IBlock {
        //
    }

    public async bootstrap(): Promise<void> {
        this.lastState = this.databaseStateService.getLastState();
    }

    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        const nextState = State.StateFactory.createNextState(this.lastState, block);

        // this.blockHandler.applyBlock
        // check if he have new round?
        // then build new delegate list
        // and applyIt

        //  nextState.complete(delegates);

        this.databaseStateService.saveState(nextState);
        this.previousStates.push(this.lastState);
        this.lastState = nextState;

        // clean up
    }

    public async revertLatestBlocks(nblocks: number): Promise<void> {
        const prevState = this.previousStates.pop();

        // await this.blockHandler.revertBlock(this.lastState.lastBlock)

        this.databaseStateService.deleteState(this.lastState);
        this.lastState = prevState;
    }

    // public async
}
