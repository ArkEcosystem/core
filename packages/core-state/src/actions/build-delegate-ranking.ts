import { Services, Types } from "@arkecosystem/core-kernel";

import { DposState } from "../dpos";

export class BuildDelegateRankingAction extends Services.Triggers.Action {
    public async execute(args: Types.ActionArguments): Promise<void> {
        const dposState: DposState = args.dposState;

        return dposState.buildDelegateRanking();
    }
}
