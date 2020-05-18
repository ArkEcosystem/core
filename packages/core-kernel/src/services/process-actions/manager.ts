import { ProcessActionsService } from "../../contracts/kernel/process-actions";
import { InstanceManager } from "../../support/instance-manager";
import { Pm2ProcessActionsService } from "./drivers/pm2";

/**
 * @export
 * @class RemoteActionManager
 * @extends {InstanceManager<ProcessActionsService>}
 */
export class ProcessActionsManager extends InstanceManager<ProcessActionsService> {
    protected createPm2Driver(): ProcessActionsService {
        return this.app.resolve(Pm2ProcessActionsService);
    }

    protected getDefaultDriver(): string {
        return "pm2";
    }
}
