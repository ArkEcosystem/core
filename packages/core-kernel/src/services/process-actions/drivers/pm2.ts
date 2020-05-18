import pmx from "@pm2/io";

import { ProcessAction, ProcessActionsService } from "../../../contracts/kernel/process-actions";
import { injectable } from "../../../ioc";

@injectable()
export class Pm2ProcessActionsService implements ProcessActionsService {
    public register(remoteAction: ProcessAction): void {
        pmx.action(remoteAction.name, (reply) => {
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
