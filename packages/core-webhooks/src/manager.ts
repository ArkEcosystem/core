import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { httpie } from "@arkecosystem/core-utils";
import * as conditions from "./conditions";
import { database } from "./database";
import { IWebhook } from "./interfaces";

export class WebhookManager {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    public async setUp(): Promise<void> {
        for (const event of Object.values(ApplicationEvents)) {
            this.emitter.on(event, async payload => {
                const { rows } = await database.findByEvent(event);

                for (const webhook of this.getMatchingWebhooks(rows, payload)) {
                    try {
                        const { status } = await httpie.post(webhook.target, {
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
                            }] with a status of [${status}].`,
                        );
                    } catch (error) {
                        this.logger.error(`Webhooks Job ${webhook.id} failed: ${error.message}`);
                    }
                }
            });
        }
    }

    private getMatchingWebhooks(webhooks: IWebhook[], payload): IWebhook[] {
        return webhooks.filter((webhook: IWebhook) => {
            if (!webhook.enabled) {
                return false;
            }

            if (!webhook.conditions || (Array.isArray(webhook.conditions) && !webhook.conditions.length)) {
                return true;
            }

            for (const condition of webhook.conditions) {
                const satisfies = conditions[condition.condition];

                if (satisfies(payload[condition.key], condition.value)) {
                    return true;
                }
            }

            return false;
        });
    }
}
