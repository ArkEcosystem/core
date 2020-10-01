import { Contracts, Services, Types } from "@arkecosystem/core-kernel";
import { ForgerService } from "../forger-service";
import { Delegate } from "../interfaces";

export class IsForgingAllowedAction extends Services.Triggers.Action {
    public async execute(args: Types.ActionArguments): Promise<boolean> {
        const forgerService: ForgerService = args.forgerService;
        const delegate: Delegate = args.delegate;
        const networkState: Contracts.P2P.NetworkState = args.networkState;

        return forgerService.isForgingAllowed(networkState, delegate);
    }
}
