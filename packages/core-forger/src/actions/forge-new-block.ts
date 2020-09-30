import { Contracts, Services, Types } from "@arkecosystem/core-kernel";
import { ForgerService } from "../forger-service";
import { Delegate } from "../interfaces";

export class ForgeNewBlockAction extends Services.Triggers.Action {
    public async execute(args: Types.ActionArguments): Promise<void> {
        const forgerService: ForgerService = args.forgerService;
        const delegate: Delegate = args.delegate;
        const round: Contracts.P2P.CurrentRound = args.round;
        const networkState: Contracts.P2P.NetworkState = args.networkState;

        return forgerService.forgeNewBlock(delegate, round, networkState);
    }
}
