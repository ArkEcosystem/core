import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { EventListener } from "./event-listener";
import { NetworkMonitor } from "./network-monitor";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerProcessor } from "./peer-processor";
import { PeerService } from "./peer-service";
import { PeerStorage } from "./peer-storage";
import { startSocketServer } from "./socket-server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("p2p.options", this.opts);

        this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Starting P2P Interface");

        const service: Contracts.P2P.IPeerService = this.makePeerService(this.opts);

        // tslint:disable-next-line: no-unused-expression
        new EventListener(service);

        if (!process.env.DISABLE_P2P_SERVER) {
            service.getMonitor().setServer(await startSocketServer(service, this.opts));
        }

        this.app.bind("p2p", service);
    }

    public async dispose(): Promise<void> {
        this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Stopping P2P Interface");

        this.app
            .resolve<Contracts.P2P.IPeerService>("p2p")
            .getMonitor()
            .stopServer();
    }

    public getDefaults(): Types.ConfigObject {
        return defaults;
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }

    private makePeerService(options): PeerService {
        const storage = new PeerStorage();
        const connector = new PeerConnector();

        const communicator = new PeerCommunicator(connector);
        const processor = new PeerProcessor({ storage, connector, communicator });
        const monitor = new NetworkMonitor({ storage, processor, communicator, options });

        return new PeerService({ storage, processor, connector, communicator, monitor });
    }
}
