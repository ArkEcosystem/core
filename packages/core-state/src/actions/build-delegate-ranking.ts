import { Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";
import { DposState } from "../dpos";

export class BuildDelegateRankingAction extends Services.Triggers.Action {
    public execute(args: ActionArguments): any {
        let dposState: DposState = args.dposState;

        return dposState.buildDelegateRanking();
    }
}
