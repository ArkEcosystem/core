import { app, Contracts, Enums } from "@arkecosystem/core-kernel";
import { httpie } from "@arkecosystem/core-utils";
import * as conditions from "./conditions";
import { database } from "./database";
import { IWebhook } from "./interfaces";

export const startListeners = (): void => {
    for (const event of Object.values(Enums.Event.State)) {
        app.resolve<Contracts.Kernel.IEventDispatcher>("events").listen(event, async payload => {
            const webhooks: IWebhook[] = database.findByEvent(event).filter((webhook: IWebhook) => {
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
                    const { status } = await httpie.post(webhook.target, {
                        body: {
                            timestamp: +new Date(),
                            data: payload,
                            event: webhook.event,
                        },
                        headers: {
                            Authorization: webhook.token,
                        },
                        timeout: app.resolve("webhooks.options").timeout,
                    });

                    app.resolve<Contracts.Kernel.ILogger>("log").debug(
                        `Webhooks Job ${webhook.id} completed! Event [${webhook.event}] has been transmitted to [${webhook.target}] with a status of [${status}].`,
                    );
                } catch (error) {
                    app.resolve<Contracts.Kernel.ILogger>("log").error(
                        `Webhooks Job ${webhook.id} failed: ${error.message}`,
                    );
                }
            }
        });
    }
};
