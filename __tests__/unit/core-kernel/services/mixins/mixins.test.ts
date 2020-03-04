import "jest-extended";

import { MixinService } from "@packages/core-kernel/src/services/mixins/mixins";
import { Constructor } from "@packages/core-kernel/src/types/container";

class User {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

function Timestamped<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        timestamp = new Date("2019-08-29");
    };
}

function Tagged<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        tag: string | null;

        constructor(...args: any[]) {
            super(...args);
            this.tag = "i am tagged";
        }
    };
}

function Activatable<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        isActivated = false;

        activate() {
            this.isActivated = true;
        }

        deactivate() {
            this.isActivated = false;
        }
    };
}

type AnyFunction<T = any> = (...input: any[]) => T;
type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>;

type TTimestamped = Mixin<typeof Timestamped>;
type TActivatable = Mixin<typeof Activatable>;
type TTagged = Mixin<typeof Tagged>;

type MixinUser = TTimestamped & TActivatable & TTagged & User;

let mixins: MixinService;
beforeEach(() => (mixins = new MixinService()));

it("should register all mixins", async () => {
    mixins.set("timestamped", Timestamped);
    mixins.set("tagged", Tagged);
    mixins.set("activatable", Activatable);

    expect(mixins.get("timestamped")).toEqual(Timestamped);
    expect(mixins.get("tagged")).toEqual(Tagged);
    expect(mixins.get("activatable")).toEqual(Activatable);

    expect(mixins.has("timestamped")).toBeTrue();
    expect(mixins.has("tagged")).toBeTrue();
    expect(mixins.has("activatable")).toBeTrue();

    mixins.forget("timestamped");
    mixins.forget("tagged");
    mixins.forget("activatable");

    expect(mixins.has("timestamped")).toBeFalse();
    expect(mixins.has("tagged")).toBeFalse();
    expect(mixins.has("activatable")).toBeFalse();
});

it("should apply a single macro", async () => {
    mixins.set("timestamped", Timestamped);

    const user: MixinUser = new (mixins.apply<MixinUser>("timestamped", User))();

    expect(user.timestamp).toEqual(new Date("2019-08-29"));
});

it("should apply all mixins", async () => {
    mixins.set("timestamped", Timestamped);
    mixins.set("tagged", Tagged);
    mixins.set("activatable", Activatable);

    const user: MixinUser = new (mixins.apply<MixinUser>(["timestamped", "tagged", "activatable"], User))();

    expect(user.timestamp).toEqual(new Date("2019-08-29"));
    expect(user.isActivated).toBeFalse();
    expect(user.tag).toBe("i am tagged");
});
