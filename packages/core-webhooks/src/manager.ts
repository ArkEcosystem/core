import { app } from "@arkecosystem/core-container";
import { Blockchain, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { httpie } from "@arkecosystem/core-utils";
import * as conditions from "./conditions";
import { database } from "./database";

class WebhookManager {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
    private readonly blockchain: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    public async setUp() {
        for (const event of this.blockchain.getEvents()) {
            this.emitter.on(event, async payload => {
                const webhooks = await database.findByEvent(event);

                for (const webhook of this.getMatchingWebhooks(webhooks, payload)) {
                    try {
                        const response = await httpie.post(webhook.target, {
                            body: {
                                timestamp: +new Date(),
                                data: payload,
                                event: webhook.event,
                            },
                            headers: {
                                Authorization: webhook.token,
                            },
                        });

                        this.logger.debug(
                            `Webhooks Job ${webhook.id} completed! Event [${webhook.event}] has been transmitted to [${
                                webhook.target
                            }] with a status of [${response.status}].`,
                        );
                    } catch (error) {
                        this.logger.error(`Webhooks Job ${webhook.id} failed: ${error.message}`);
                    }
                }
            });
        }
    }

    private getMatchingWebhooks(webhooks, payload) {
        const matches = [];

        for (const webhook of webhooks) {
            if (!webhook.enabled) {
                continue;
            }

            if (!webhook.conditions || (Array.isArray(webhook.conditions) && !webhook.conditions.length)) {
                matches.push(webhook);

                continue;
            }

            for (const condition of webhook.conditions) {
                const satisfies = conditions[condition.condition];

                if (!satisfies(payload[condition.key], condition.value)) {
                    continue;
                }

                matches.push(webhook);
            }
        }

        return matches;
    }
}

export const webhookManager = new WebhookManager();
