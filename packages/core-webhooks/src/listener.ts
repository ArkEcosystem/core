import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";

import * as conditions from "./conditions";
import { Database } from "./database";
import { Identifiers } from "./identifiers";
import { Webhook } from "./interfaces";

/**
 * @export
 * @class Listener
 */
@Container.injectable()
export class Listener {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Server
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;
    /**
     * @private
     * @type {Contracts.Kernel.Logger}
     * @memberof Broadcaster
     */
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    /**
     * @param {string} event
     * @memberof Listener
     */
    public async handle({ name, data }): Promise<void> {
        const webhooks: Webhook[] = this.getWebhooks(name, data);

        for (const webhook of webhooks) {
            await this.broadcast(webhook, data);
        }
    }

    /**
     * @param {Webhook} webhook
     * @param {number} timeout
     * @returns {Promise<void>}
     * @memberof Broadcaster
     */
    public async broadcast(webhook: Webhook, payload: object, timeout: number = 1500): Promise<void> {
        try {
            const { statusCode } = await Utils.http.post(webhook.target, {
                body: {
                    timestamp: +new Date(),
                    data: payload as any, // todo: utils currently expects a primitive as data
                    event: webhook.event,
                },
                headers: {
                    Authorization: webhook.token,
                },
                timeout,
            });

            this.logger.debug(
                `Webhooks Job ${webhook.id} completed! Event [${webhook.event}] has been transmitted to [${webhook.target}] with a status of [${statusCode}].`,
            );
        } catch (error) {
            this.logger.error(`Webhooks Job ${webhook.id} failed: ${error.message}`);
        }
    }

    /**
     * @private
     * @param {string} event
     * @param {object} payload
     * @returns {Webhook[]}
     * @memberof Listener
     */
    private getWebhooks(event: string, payload: object): Webhook[] {
        return this.app
            .get<Database>(Identifiers.Database)
            .findByEvent(event)
            .filter((webhook: Webhook) => {
                if (!webhook.enabled) {
                    return false;
                }

                if (!webhook.conditions || (Array.isArray(webhook.conditions) && !webhook.conditions.length)) {
                    return true;
                }

                for (const condition of webhook.conditions) {
                    try {
                        const satisfies = conditions[condition.condition];

                        if (satisfies(payload[condition.key], condition.value)) {
                            return true;
                        }
                    } catch (error) {
                        return false;
                    }
                }

                return false;
            });
    }
}
