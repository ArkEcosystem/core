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
    private height: number | undefined;
    private milestone: IMilestone | undefined;
    private milestones: Record<string, any> | undefined;

    constructor() {
        this.setConfig((networks.devnet as unknown) as NetworkConfig);
    }

    public setConfig(config: NetworkConfig): void {
        this.config = {
            network: config.network,
            exceptions: config.exceptions,
            milestones: config.milestones,
            genesisBlock: config.genesisBlock,
        };

        this.validateMilestones();
        this.buildConstants();
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

        if (!this.milestones) {
            throw new Error();
        }

        return this.milestones.some(milestone => milestone.height === height);
    }

    public getMilestone(height?: number): { [key: string]: any } {
        if (!this.milestone || !this.milestones) {
            throw new Error();
        }

        if (!height && this.height) {
            height = this.height;
        }

        if (!height) {
            height = 1;
        }

        while (
            this.milestone.index < this.milestones.length - 1 &&
            height >= this.milestones[this.milestone.index + 1].height
        ) {
            this.milestone.index++;
            this.milestone.data = this.milestones[this.milestone.index];
        }

        while (height < this.milestones[this.milestone.index].height) {
            this.milestone.index--;
            this.milestone.data = this.milestones[this.milestone.index];
        }

        return this.milestone.data;
    }

    public getMilestones(): any {
        return this.milestones;
    }

    private buildConstants(): void {
        if (!this.config) {
            throw new Error();
        }

        this.milestones = this.config.milestones.sort((a, b) => a.height - b.height);
        this.milestone = {
            index: 0,
            data: this.milestones[0],
        };

        let lastMerged = 0;

        while (lastMerged < this.milestones.length - 1) {
            this.milestones[lastMerged + 1] = deepmerge(this.milestones[lastMerged], this.milestones[lastMerged + 1]);
            lastMerged++;
        }
    }

    private validateMilestones(): void {
        if (!this.config) {
            throw new Error();
        }

        const delegateMilestones = this.config.milestones
            .sort((a, b) => a.height - b.height)
            .filter(milestone => milestone.activeDelegates);

        for (let i = 1; i < delegateMilestones.length; i++) {
            const previous = delegateMilestones[i - 1];
            const current = delegateMilestones[i];

            if (previous.activeDelegates === current.activeDelegates) {
                continue;
            }

            if ((current.height - previous.height) % previous.activeDelegates !== 0) {
                throw new InvalidMilestoneConfigurationError(
                    `Bad milestone at height: ${current.height}. The number of delegates can only be changed at the beginning of a new round.`,
                );
            }
        }
    }
}

export const configManager = new ConfigManager();
