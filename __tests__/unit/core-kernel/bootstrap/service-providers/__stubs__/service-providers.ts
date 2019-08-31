import Joi from "@hapi/joi";

import { ServiceProvider } from "@packages/core-kernel/src/providers";
import { PackageDependency } from "@packages/core-kernel/src/contracts/kernel";

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

export class RequiredDependencyCannotBeFoundServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PackageDependency[] {
        return [{ name: "deps-required", required: true }];
    }
}

export class RequiredDependencyCannotBeFoundAsyncServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PackageDependency[] {
        return [{ name: "deps-required", required: async () => true }];
    }
}

export class OptionalDependencyCannotBeFoundServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PackageDependency[] {
        return [{ name: "deps-optional" }];
    }
}

export class RequiredDependencyVersionCannotBeSatisfiedServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PackageDependency[] {
        return [{ name: "dep", version: ">=2.0.0", required: true }];
    }
}

export class OptionalDependencyVersionCannotBeSatisfiedServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "stub";
    }

    public dependencies(): PackageDependency[] {
        return [{ name: "dep", version: ">=2.0.0" }];
    }
}

export class FaultyBootServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public async boot(): Promise<void> {
        throw new Error("Boot Error");
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

    public async enableWhen(): Promise<boolean> {
        return !!process.env.DEFFERED_ENABLE;
    }

    public async disableWhen(): Promise<boolean> {
        return !!process.env.DEFFERED_DISABLE;
    }
}
