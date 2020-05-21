import { ForgerService } from "@arkecosystem/core-forger/src/forger-service";
import { Delegate } from "@arkecosystem/core-forger/src/interfaces";
import { Contracts, Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";

export class ForgeNewBlockAction extends Services.Triggers.Action {
    public async execute(args: ActionArguments): Promise<void> {
        const forgerService: ForgerService = args.forgerService;
        const delegate: Delegate = args.delegate;
        const round: Contracts.P2P.CurrentRound = args.round;
        const networkState: Contracts.P2P.NetworkState = args.networkState;

        return forgerService.forgeNewBlock(delegate, round, networkState);
    }
}
