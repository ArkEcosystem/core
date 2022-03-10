import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Server as SocketServer } from "socket.io";
import * as Systeminformation from "systeminformation";

import { IOptions } from "./interfaces";

@Container.injectable()
export default class Service {
    public static readonly ID = "@foly/socket-event-forwarder";

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    private server!: SocketServer;

    public async listen(options: IOptions): Promise<void> {
        this.server = new SocketServer(options.port);

        const logger = this.app.get<Contracts.Kernel.Logger>(Container.Identifiers.LogService);
        const emitter = this.app.get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService);
        const walletRepository = this.app.getTagged<Contracts.State.WalletRepository>(
            Container.Identifiers.WalletRepository,
            "state",
            "blockchain",
        );

        for (const event of options.events) {
            emitter.listen(event, {
                handle: async (payload: any) => {
                    if (payload.data && payload.data.generatorPublicKey) {
                        payload.data.username = walletRepository
                            .findByPublicKey(payload.data.generatorPublicKey)
                            .getAttribute("delegate.username");
                    }

                    logger.debug(`[${Service.ID}] Forwarded event ${payload.name}`);
                    this.server.emit(payload.name, payload.data);
                },
            });
        }

        if (options.customEvents.includes("systeminformation")) {
            setInterval(async () => {
                const packet = await Systeminformation.get({
                    mem: "*",
                    currentLoad: "*",
                    cpuTemperature: "*",
                    osInfo: "platform, release",
                    cpu: "speed, cores, speedmin, speedmax, processors, physicalCores",
                });

                packet.fs = [];

                for (const disk of await Systeminformation.fsSize()) {
                    packet.fs.push({
                        use: disk.use,
                        size: disk.size,
                        used: disk.used,
                    });
                }

                this.server.emit("systeminformation", packet);
                logger.debug(`[${Service.ID}] Forwarded event systeminformation`);

            }, options.systeminformationInterval);
        }

        if (options.customEvents.includes("network.latency")) {
            setInterval(async () => {
                this.server.emit("network.latency", await Systeminformation.inetChecksite("https://google.com"));
                logger.debug(`[${Service.ID}] Forwarded event network.latency`);
            }, options.networkLatencyInterval);
        }

        if (options.customEvents.includes("blockheight.current")) {
            const stateStore = this.app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore);

            setInterval(async () => {
                this.server.emit("blockheight.current", stateStore.getLastHeight());
                logger.debug(`[${Service.ID}] Forwarded event blockheight.current`);
            }, options.blockheightCurrentInterval);
        }

        if (options.customEvents.includes("transaction.confirmed") && options.confirmations.length) {
            const transactions: any[] = [];

            emitter.listen("transaction.applied", {
                handle: async (payload: any) => {
                    payload.data.confirmations = 0;

                    if (payload.data.senderPublicKey) {
                        payload.data.senderId = walletRepository
                            .findByPublicKey(payload.data.senderPublicKey)
                            .getAddress();
                    }

                    transactions.push(payload.data);
                },
            });

            emitter.listen("block.applied", {
                handle: async (payload: any) => {
                    for (const [index, transaction] of transactions.entries()) {
                        transaction.confirmations += 1;

                        if (options.confirmations.includes(transaction.confirmations)) {
                            this.server.emit("transaction.confirmed", transaction);
                            logger.debug(`[${Service.ID}] Forwarded event transaction.confirmed`);
                        }

                        if (transaction.confirmations >= Math.max(...options.confirmations)) {
                            transactions.splice(index, 1);
                            logger.debug(`[${Service.ID}] Removed transaction since the max confirmations is reached`);
                        }
                    }
                },
            });
        }
    }
}
