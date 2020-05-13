import pmx from "@pm2/io";

import { RemoteAction, RemoteActionsService } from "../../../contracts/kernel/remote-actions";
import { injectable } from "../../../ioc";

@injectable()
export class Pm2RemoteActionsService implements RemoteActionsService {
    public register(remoteAction: RemoteAction): void {
        pmx.action(remoteAction.name, remoteAction.handler);
    }
}
