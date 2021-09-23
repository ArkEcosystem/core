"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const core_utils_1 = require("@arkecosystem/core-utils");
const conditions = __importStar(require("./conditions"));
const database_1 = require("./database");
exports.startListeners = () => {
    for (const event of Object.values(core_event_emitter_1.ApplicationEvents)) {
        core_container_1.app.resolvePlugin("event-emitter").on(event, async (payload) => {
            const webhooks = database_1.database.findByEvent(event).filter((webhook) => {
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
                    }
                    catch (error) {
                        return false;
                    }
                }
                return false;
            });
            for (const webhook of webhooks) {
                try {
                    const { status } = await core_utils_1.httpie.post(webhook.target, {
                        body: {
                            timestamp: +new Date(),
                            data: payload,
                            event: webhook.event,
                        },
                        headers: {
                            Authorization: webhook.token,
                        },
                        timeout: core_container_1.app.resolveOptions("webhooks").timeout,
                    });
                    core_container_1.app.resolvePlugin("logger").debug(`Webhooks Job ${webhook.id} completed! Event [${webhook.event}] has been transmitted to [${webhook.target}] with a status of [${status}].`);
                }
                catch (error) {
                    core_container_1.app.resolvePlugin("logger").error(`Webhooks Job ${webhook.id} failed: ${error.message}`);
                }
            }
        });
    }
};
//# sourceMappingURL=listener.js.map