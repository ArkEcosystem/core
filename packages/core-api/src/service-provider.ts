import { Providers } from "@arkecosystem/core-kernel";

import Handlers from "./handlers";
import { Identifiers } from "./identifiers";
import { preparePlugins } from "./plugins";
import { Server } from "./server";
import {
    BlockResourceDbProvider,
    BlockResourceStateProvider,
    DbBlockService,
    DbTransactionProvider,
    DelegateResourceProvider,
    LockResourceProvider,
    PeerResourceProvider,
    TransactionResourceDbProvider,
    TransactionResourcePoolProvider,
    WalletResourceProvider,
} from "./services";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.DbBlockService).to(DbBlockService);
        this.app.bind(Identifiers.DbTransactionService).to(DbTransactionProvider);
        this.app.bind(Identifiers.BlockResourceDbProvider).to(BlockResourceDbProvider);
        this.app.bind(Identifiers.BlockResourceStateProvider).to(BlockResourceStateProvider);
        this.app.bind(Identifiers.TransactionResourceDbProvider).to(TransactionResourceDbProvider);
        this.app.bind(Identifiers.TransactionResourcePoolProvider).to(TransactionResourcePoolProvider);
        this.app.bind(Identifiers.WalletResourceProvider).to(WalletResourceProvider);
        this.app.bind(Identifiers.DelegateResourceProvider).to(DelegateResourceProvider);
        this.app.bind(Identifiers.LockResourceProvider).to(LockResourceProvider);
        this.app.bind(Identifiers.PeerResourceProvider).to(PeerResourceProvider);

        if (this.config().get("server.http.enabled")) {
            await this.buildServer("http", Identifiers.HTTP);
        }

        if (this.config().get("server.https.enabled")) {
            await this.buildServer("https", Identifiers.HTTPS);
        }
    }

    public async boot(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>(Identifiers.HTTP).boot();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>(Identifiers.HTTPS).boot();
        }
    }

    public async dispose(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>(Identifiers.HTTP).dispose();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>(Identifiers.HTTPS).dispose();
        }
    }

    private async buildServer(type: string, id: symbol): Promise<void> {
        this.app.bind<Server>(id).to(Server).inSingletonScope();

        const server: Server = this.app.get<Server>(id);

        await server.initialize(`Public API (${type.toUpperCase()})`, {
            ...this.config().get(`server.${type}`),
            ...{
                routes: {
                    cors: true,
                },
            },
        });

        await server.register(preparePlugins(this.config().get("plugins")));

        await server.register({
            plugin: Handlers,
            routes: { prefix: "/api" },
        });
    }
}
