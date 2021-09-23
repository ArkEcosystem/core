"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const foreman_1 = require("@typeskrift/foreman");
class ProcessManager extends foreman_1.Foreman {
    restart(id) {
        return super.restart(id, { "update-env": true });
    }
    list() {
        return super.list() || [];
    }
}
exports.processManager = new ProcessManager();
//# sourceMappingURL=process-manager.js.map