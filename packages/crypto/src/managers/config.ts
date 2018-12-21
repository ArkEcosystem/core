import deepmerge from "deepmerge";
import camelCase from "lodash/camelCase";
import get from "lodash/get";
import set from "lodash/set";
import { Engine } from "../validation/engine";
import { feeManager } from "./fee";

import { EventEmitter } from "events";
import { TransactionTypes } from "../constants";
import * as networks from "../networks";

export class ConfigManager {
    public config: any;
    public height: any;
    public milestone: any;
    public milestones: any;

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
    public setConfig(config) {
        this.config = {};

        // Map the config.network values to the root
        for (const [key, value] of Object.entries(config.network)) {
            this.config[key] = value;
        }

        this.config.exceptions = config.exceptions;
        this.config.milestones = config.milestones;

        this.buildConstants();
        this.buildFees();
    }

    /**
     * Set the configuration based on a preset.
     * @param {String} network
     */
    public setFromPreset(network: string) {
        this.setConfig(this.getPreset(network));
    }

    /**
     * Get the configuration for a preset.
     * @param {String} network
     * @return {Object}
     */
    public getPreset(network: string) {
        return networks[network.toLowerCase()];
    }

    /**
     * Get all config data.
     * @return {Object}
     */
    public all() {
        return this.config;
    }

    /**
     * Set individual config value.
     * @param {String} key
     * @param {*}      value
     */
    public set(key, value) {
        set(this.config, key, value);
    }

    /**
     * Get specific config value.
     * @param  {String} key
     * @return {*}
     */
    public get(key) {
        return get(this.config, key);
    }

    /**
     * Set config manager height.
     * @param {Number} value
     */
    public setHeight(value) {
        this.height = value;
    }

    /**
     * Get config manager height.
     * @return {Number}
     */
    public getHeight() {
        return this.height;
    }

    /**
     * Get all config constants based on height.
     * @param  {(Number|undefined)} height
     * @return {*}
     */
    public getMilestone(height?) {
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
    private buildConstants() {
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

    /**
     * Build fees from config constants.
     */
    private buildFees() {
        for (const type of Object.keys(TransactionTypes)) {
            feeManager.set(TransactionTypes[type], this.getMilestone().fees.staticFees[camelCase(type)]);
        }
    }
}

export const configManager = new ConfigManager();
