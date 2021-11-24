import deepmerge from "deepmerge";
import get from "lodash.get";
import set from "lodash.set";

import { InvalidMilestoneConfigurationError } from "../errors";
import { IMilestone } from "../interfaces";
import { NetworkConfig } from "../interfaces/networks";
import * as networks from "../networks";
import { NetworkName } from "../types";

export class ConfigManager {
    private config: NetworkConfig | undefined;
    private index = -1;
    private height?: number;
    private milestones: IMilestone[] = [];

    public constructor() {
        this.setConfig(networks.devnet as unknown as NetworkConfig);
    }

    public setConfig(config: NetworkConfig): void {
        this.milestones = [];
        this.config = {
            network: config.network,
            exceptions: config.exceptions,
            milestones: config.milestones,
            genesisBlock: config.genesisBlock,
        };

        for (const milestone of this.config.milestones) {
            this.setMilestone(milestone);
        }

        this.buildMilestones();
    }

    public setFromPreset(network: NetworkName): void {
        this.setConfig(this.getPreset(network));
    }

    public getPreset(network: NetworkName): NetworkConfig {
        return networks[network.toLowerCase()];
    }

    public all(): NetworkConfig | undefined {
        return this.config;
    }

    public set<T = any>(key: string, value: T): void {
        if (!this.config) {
            throw new Error();
        }

        set(this.config, key, value);
    }

    public get<T = any>(key: string): T {
        return get(this.config, key);
    }

    public setHeight(value: number): void {
        this.height = value;
    }

    public getHeight(): number | undefined {
        return this.height;
    }

    public isNewMilestone(height?: number): boolean {
        height = height || this.height;

        if (!height) {
            throw new Error();
        }

        return this.getMilestone(height).height === height;
    }

    public getMilestone(height?: number): IMilestone {
        height = height ?? this.height ?? 1;

        while (this.index < this.milestones.length - 1 && height >= this.milestones[this.index + 1].height) {
            this.index++;
        }

        while (height < this.milestones[this.index].height) {
            this.index--;
        }

        return this.milestones[this.index];
    }

    public setMilestone(milestone: IMilestone): void {
        this.milestones.push(milestone);
        this.buildMilestones();
    }

    public getMilestones(): readonly IMilestone[] {
        return this.milestones;
    }

    private buildMilestones(): void {
        this.index = -1;
        this.milestones.sort((a, b) => a.height - b.height);

        try {
            if (this.milestones.length === 0) {
                throw new InvalidMilestoneConfigurationError("No milestones.");
            }

            if (this.milestones[0].height !== 1) {
                throw new InvalidMilestoneConfigurationError("Invalid genesis milestone height.");
            }

            // merge milestones with same height
            for (let i = this.milestones.length - 1; i >= 1; i--) {
                const prev = this.milestones[i - 1];
                const next = this.milestones[i];

                if (prev.height === next.height) {
                    this.milestones[i - 1] = deepmerge(prev, next, {
                        arrayMerge: (dest, source, options) => source,
                    });

                    this.milestones.splice(i, 1);
                }
            }

            // merge milestones
            for (let i = 1; i < this.milestones.length; i++) {
                const prev = this.milestones[i - 1];
                const next = this.milestones[i];

                this.milestones[i] = deepmerge(prev, next, {
                    arrayMerge: (dest, source, options) => source,
                });
            }

            this.validateActiveDelegates();
        } catch (error) {
            this.milestones = [];
            throw error;
        }
    }

    private validateActiveDelegates(): void {
        let prev = this.milestones[0];

        for (const next of this.milestones.slice(1)) {
            if (next.activeDelegates === prev.activeDelegates) continue;

            if ((next.height - prev.height) % prev.activeDelegates !== 0) {
                const msg = `Bad milestone at height: ${next.height}. The number of delegates can only be changed at the beginning of a new round.`;
                throw new InvalidMilestoneConfigurationError(msg);
            }

            prev = next;
        }
    }
}

export const configManager = new ConfigManager();
