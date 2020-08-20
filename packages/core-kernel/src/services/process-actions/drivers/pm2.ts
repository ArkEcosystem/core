import { ProcessAction, ProcessActionsService } from "../../../contracts/kernel/process-actions";
import { injectable } from "../../../ioc";

@injectable()
export class Pm2ProcessActionsService implements ProcessActionsService {
    private readonly pmx;

    public constructor() {
        this.pmx = require("@pm2/io");
    }

    public register(remoteAction: ProcessAction): void {
        this.pmx.action(remoteAction.name, (reply) => {
            remoteAction
                .handler()
                .then((response) => {
                    reply({ response: response });
                })
                .catch((err) => {
                    reply({ error: err.stack });
                });
        });
    }
}
