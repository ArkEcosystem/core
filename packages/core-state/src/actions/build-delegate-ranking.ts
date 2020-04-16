import { Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";

import { DposState } from "../dpos";

export class BuildDelegateRankingAction extends Services.Triggers.Action {
    public async execute(args: ActionArguments): Promise<void> {
        const dposState: DposState = args.dposState;

        return dposState.buildDelegateRanking();
    }
}
