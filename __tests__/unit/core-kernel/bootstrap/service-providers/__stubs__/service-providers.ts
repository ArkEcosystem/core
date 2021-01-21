import Joi from "joi";
import { PluginDependency } from "@packages/core-kernel/src/contracts/kernel";
import { ServiceProvider } from "@packages/core-kernel/src/providers";

export class StubServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public version(): string {
        return "1.0.0";
    }
}

export class RequiredServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public async required(): Promise<boolean> {
        return true;
    }
}

export class InvalidConfigurationServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public configSchema(): object {
        return Joi.object({
            username: Joi.string().required(),
        });
    }
}

export class RequiredInvalidConfigurationServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public configSchema(): object {
        return Joi.object({
            username: Joi.string().required(),
        });
    }

    public async required(): Promise<boolean> {
        return true;
    }
}

export class ValidConfigurationServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public configDefaults() {
        return { username: "johndoe" };
    }

    public configSchema(): object {
        return Joi.object({
            username: Joi.string().required(),
        });
    }
}

export class RequiredDependencyCanBeFoundServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PluginDependency[] {
        return [{ name: "dep", required: true }];
    }
}

export class RequiredDependencyCannotBeFoundServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PluginDependency[] {
        return [{ name: "deps-required", required: true }];
    }
}

export class RequiredDependencyCannotBeFoundAsyncServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PluginDependency[] {
        return [{ name: "deps-required", required: async () => true }];
    }
}

export class OptionalDependencyCannotBeFoundServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PluginDependency[] {
        return [{ name: "deps-optional" }];
    }
}

export class RequiredDependencyVersionCanBeSatisfiedServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PluginDependency[] {
        return [{ name: "dep", version: "<=2.0.0", required: true }];
    }
}

export class RequiredDependencyVersionCannotBeSatisfiedServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PluginDependency[] {
        return [{ name: "dep", version: ">=2.0.0", required: true }];
    }
}

export class OptionalDependencyVersionCannotBeSatisfiedServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PluginDependency[] {
        return [{ name: "dep", version: ">=2.0.0" }];
    }
}

export class FaultyBootServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public async boot(): Promise<void> {
        throw new Error("Boot Error");
    }

    public name(): string {
        return "stub";
    }

    public version(): string {
        return "version";
    }
}

export class RequiredFaultyBootServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public async boot(): Promise<void> {
        throw new Error("Boot Error");
    }

    public name(): string {
        return "stub";
    }

    public async required(): Promise<boolean> {
        return true;
    }
}

export class DeferredServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public version(): string {
        return "version";
    }

    public async bootWhen(): Promise<boolean> {
        return process.env.DEFFERED_ENABLE === "true";
    }

    public async disposeWhen(): Promise<boolean> {
        return process.env.DEFFERED_DISABLE === "true";
    }
}

export class DeferredBootServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public version(): string {
        return "version";
    }

    public async bootWhen(serviceProvider?: string): Promise<boolean> {
        return process.env.DEFFERED_ENABLE === "true" && serviceProvider === "expected-stub";
    }
}

export class DeferredDisposeServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public version(): string {
        return "version";
    }

    public async disposeWhen(serviceProvider?: string): Promise<boolean> {
        return process.env.DEFFERED_DISABLE === "true" && serviceProvider === "expected-stub";
    }
}
