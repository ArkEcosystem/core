import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { httpie } from "@arkecosystem/core-utils";
import * as conditions from "./conditions";
import { database } from "./database";
import { IWebhook } from "./interfaces";

export function startListeners(): void {
    for (const event of Object.values(ApplicationEvents)) {
        app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter").on(event, async payload => {
            const webhooks: IWebhook[] = database.findByEvent(event).filter((webhook: IWebhook) => {
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

            for (const webhook of webhooks) {
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

                    app.resolvePlugin<Logger.ILogger>("logger").debug(
                        `Webhooks Job ${webhook.id} completed! Event [${webhook.event}] has been transmitted to [${
                            webhook.target
                        }] with a status of [${status}].`,
                    );
                } catch (error) {
                    app.resolvePlugin<Logger.ILogger>("logger").error(
                        `Webhooks Job ${webhook.id} failed: ${error.message}`,
                    );
                }
            }
        });
    }
}
