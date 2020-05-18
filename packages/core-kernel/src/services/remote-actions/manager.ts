import { RemoteActionsService } from "../../contracts/kernel/remote-actions";
import { InstanceManager } from "../../support/instance-manager";
import { Pm2RemoteActionsService } from "./drivers/pm2";

/**
 * @export
 * @class RemoteActionManager
 * @extends {InstanceManager<RemoteActionsService>}
 */
export class RemoteActionManager extends InstanceManager<RemoteActionsService> {
    protected createPm2Driver(): RemoteActionsService {
        return this.app.resolve(Pm2RemoteActionsService);
    }

    protected getDefaultDriver(): string {
        return "pm2";
    }
}
