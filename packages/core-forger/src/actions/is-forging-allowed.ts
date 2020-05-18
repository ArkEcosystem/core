import { ForgerService } from "@arkecosystem/core-forger/src/forger-service";
import { Delegate } from "@arkecosystem/core-forger/src/interfaces";
import { Contracts, Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";

export class IsForgingAllowedAction extends Services.Triggers.Action {
    public async execute(args: ActionArguments): Promise<boolean> {
        const forgerService: ForgerService = args.forgerService;
        const delegate: Delegate = args.delegate;
        const networkState: Contracts.P2P.NetworkState = args.networkState;

        return forgerService.isForgingAllowed(networkState, delegate);
    }
}
