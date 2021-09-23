"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const managers_1 = require("../managers");
class Slots {
    static getTime(time) {
        if (time === undefined) {
            time = dayjs_1.default().valueOf();
        }
        const start = dayjs_1.default(managers_1.configManager.getMilestone(1).epoch).valueOf();
        return Math.floor((time - start) / 1000);
    }
    static getTimeInMsUntilNextSlot() {
        const nextSlotTime = this.getSlotTime(this.getNextSlot());
        const now = this.getTime();
        return (nextSlotTime - now) * 1000;
    }
    static getSlotNumber(epoch) {
        if (epoch === undefined) {
            epoch = this.getTime();
        }
        return Math.floor(epoch / managers_1.configManager.getMilestone(1).blocktime);
    }
    static getSlotTime(slot) {
        return slot * managers_1.configManager.getMilestone(1).blocktime;
    }
    static getNextSlot() {
        return this.getSlotNumber() + 1;
    }
    static isForgingAllowed(epoch) {
        if (epoch === undefined) {
            epoch = this.getTime();
        }
        const blockTime = managers_1.configManager.getMilestone(1).blocktime;
        return epoch % blockTime < blockTime / 2;
    }
}
exports.Slots = Slots;
//# sourceMappingURL=slots.js.map