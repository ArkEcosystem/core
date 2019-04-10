import deepmerge from "deepmerge";
import camelCase from "lodash.camelcase";
import get from "lodash.get";
import set from "lodash.set";
import { TransactionTypes } from "../enums";
import { InvalidMilestoneConfigurationError } from "../errors";
import { IMilestone } from "../interfaces";
import * as networks from "../networks";
import { NetworkName } from "../types";
import { feeManager } from "./fee";

export class ConfigManager {
    public config: any;
    public milestone: IMilestone;
    public milestones: any;
    private height: number;

    /**
     * @constructor
     */
    constructor() {
        this.setConfig(networks.devnet);
    }

    /**
     * Set config data.
     * @param {Object} config
     */
    public setConfig(config: any) {
        this.config = {};

        // Map the config.network values to the root
        for (const [key, value] of Object.entries(config.network)) {
            this.config[key] = value;
        }

        this.config.exceptions = config.exceptions;
        this.config.milestones = config.milestones;
        this.config.genesisBlock = config.genesisBlock;

        this.validateMilestones();

        this.buildConstants();
        this.buildFees();
    }

    /**
     * Set the configuration based on a preset.
     */
    public setFromPreset(network: NetworkName) {
        this.setConfig(this.getPreset(network));
    }

    /**
     * Get the configuration for a preset.
     */
    public getPreset(network: NetworkName) {
        return networks[network.toLowerCase()];
    }

    /**
     * Get all config data.
     */
    public all() {
        return this.config;
    }

    /**
     * Set individual config value.
     */
    public set(key: string, value: any) {
        set(this.config, key, value);
    }

    /**
     * Get specific config value.
     */
    public get<T = any>(key): T {
        return get(this.config, key) as T;
    }

    /**
     * Set config manager height.
     */
    public setHeight(value: number): void {
        this.height = value;
        this.buildFees();
    }

    /**
     * Get config manager height.
     */
    public getHeight(): number {
        return this.height;
    }

    /**
     * Get all config constants based on height.
     */
    public getMilestone(height?: number): { [key: string]: any } {
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

    /**
     * Build constant data based on active heights.
     */
    private buildConstants(): void {
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
                    `Bad milestone at height: ${
                        current.height
                    }. The number of delegates can only be changed at the beginning of a new round.`,
                );
            }
        }
    }

    /**
     * Build fees from config constants.
     */
    private buildFees(): void {
        for (const key of Object.keys(TransactionTypes)) {
            const type = TransactionTypes[key];
            if (typeof type === "number") {
                feeManager.set(type, this.getMilestone().fees.staticFees[camelCase(key)]);
            }
        }
    }
}

export const configManager = new ConfigManager();
