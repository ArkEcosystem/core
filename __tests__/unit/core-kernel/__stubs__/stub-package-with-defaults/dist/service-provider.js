const {
    Providers
} = require("@arkecosystem/core-kernel");

class ServiceProvider extends Providers.ServiceProvider {
    async register() {
        //
    }

    async boot() {
        //
    }

    async dispose() {
        //
    }

    configDefaults() {
        return {
            key: "value"
        };
    }
}

exports.ServiceProvider = ServiceProvider;
