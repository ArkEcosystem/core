import { app, Container, Contracts, Enums, Utils } from "@arkecosystem/core-kernel";

import * as conditions from "./conditions";
import { database } from "./database";
import { Webhook } from "./interfaces";

export const startListeners = (): void => {
    for (const event of Object.values(Enums.Events.State)) {
        app.get<Contracts.Kernel.Events.EventDispatcher>(Container.Identifiers.EventDispatcherService).listen(
            event,
            async payload => {
                const webhooks: Webhook[] = database.findByEvent(event).filter((webhook: Webhook) => {
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

                for (const webhook of webhooks) {
                    try {
                        const { status } = await Utils.httpie.post(webhook.target, {
                            body: {
                                timestamp: +new Date(),
                                data: payload,
                                event: webhook.event,
                            },
                            headers: {
                                Authorization: webhook.token,
                            },
                            timeout: app.get<any>("webhooks.options").timeout,
                        });

                        app.log.debug(
                            `Webhooks Job ${webhook.id} completed! Event [${webhook.event}] has been transmitted to [${webhook.target}] with a status of [${status}].`,
                        );
                    } catch (error) {
                        app.log.error(`Webhooks Job ${webhook.id} failed: ${error.message}`);
                    }
                }
            },
        );
    }
};
