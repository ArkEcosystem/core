import { Contracts } from "@arkecosystem/core-kernel";
import { app } from "@arkecosystem/core-kernel";
import axios from "axios";
import * as conditions from "./conditions";
import { database } from "./database";

class WebhookManager {
    public config: any;
    public logger = app.resolve<Contracts.Logger.ILogger>("logger");

    /**
     * Set up the webhook app.
     * @return {void}
     */
    public async setUp() {
        const emitter = app.resolve<Contracts.EventEmitter.EventEmitter>("event-emitter");

        for (const event of app.blockchain.getEvents()) {
            emitter.on(event, async payload => {
                const webhooks = await database.findByEvent(event);

                for (const webhook of this.getMatchingWebhooks(webhooks, payload)) {
                    try {
                        const response = await axios.post(
                            webhook.target,
                            {
                                timestamp: +new Date(),
                                data: payload,
                                event: webhook.event,
                            },
                            {
                                headers: {
                                    Authorization: webhook.token,
                                },
                            },
                        );

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

    /**
     * Get all webhooks.
     * @param  {Array} webhooks
     * @param  {Object} payload
     * @return {Array}
     */
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
