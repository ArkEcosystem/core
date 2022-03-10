import { Container, Contracts } from "@arkecosystem/core-kernel";
import mqtt from "mqtt";
import { Client as MQTTClient } from "mqtt/types";

import { IOptions } from "./interface";

@Container.injectable()
export default class Service {
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    // @ts-ignore
    private client: MQTTClient;
    // @ts-ignore
    private topic: string;
    // @ts-ignore
    private events: string[];

    public async listen(options: IOptions): Promise<void> {
        this.topic = options.topic;
        this.events = options.events;
        this.client = mqtt.connect(options.mqttBroker);
        this.client.on("connect", () => {
            this.logger.info(`[deadlock-delegate/mqtt] Connected to broker at ${options.mqttBroker}`);
            this.createSubscriptions();
        });
        this.client.on("disconnect", () =>
            this.logger.warning("[deadlock-delegate/mqtt] Received disconnect packets from broker"),
        );
        this.client.on("reconnect", () => this.logger.info("[deadlock-delegate/mqtt] Reconnecting broker"));
        this.client.on("error", (err) => this.logger.error(`[deadlock-delegate/mqtt] ${err}`));
    }

    public disconnect(): void {
        // force close the client
        this.client.end(true);
    }

    private createSubscriptions() {
        const subscribedToEvent: string[] = [];
        for (const event of this.events) {
            if (subscribedToEvent.includes(event)) {
                continue;
            }

            subscribedToEvent.push(event);
            this.subscribe(event);
        }
    }

    private subscribe(name: string) {
        this.emitter.listen(name, {
            handle: async (payload: any) => {
                const { name, data } = payload;
                this.logger.debug(`[deadlock-delegate/mqtt] Sending "${name}"" to "${this.topic}" topic"`);
                this.client.publish(this.topic, JSON.stringify({ event: name, data }));
            },
        });
    }
}
