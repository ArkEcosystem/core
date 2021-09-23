"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const update_1 = require("./update");
class ConfigManager {
    setup(config) {
        this.config = config;
        this.file = `${config.configDir}/config.json`;
        this.ensureDefaults();
    }
    get(key) {
        return this.read()[key];
    }
    set(key, value) {
        this.update({ [key]: value });
    }
    update(data) {
        this.write({ ...this.read(), ...data });
    }
    ensureDefaults() {
        if (!this.read()) {
            fs_extra_1.removeSync(this.file);
            fs_extra_1.ensureFileSync(this.file);
            this.write({
                token: this.config.bin,
                channel: update_1.getRegistryChannel(this.config),
            });
        }
    }
    read() {
        try {
            return fs_extra_1.readJsonSync(this.file);
        }
        catch (error) {
            return false;
        }
    }
    write(data) {
        fs_extra_1.writeJsonSync(this.file, data);
    }
}
exports.configManager = new ConfigManager();
//# sourceMappingURL=config.js.map