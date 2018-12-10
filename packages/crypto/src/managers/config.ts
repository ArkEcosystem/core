import deepmerge from "deepmerge";
import camelCase from "lodash/camelCase";
import { dynamicFeeManager } from "./dynamic-fee";
import { feeManager } from "./fee";

import { CONFIGURATIONS, TRANSACTION_TYPES } from "../constants";
import defaultConfig from "../networks/ark/devnet.json";

export class ConfigManager {
    public config: any;
    public height: any;
    public constant: any;
    public constants: any;

    /**
     * @constructor
     */
    constructor() {
        this.setConfig(defaultConfig);
    }

    /**
     * Set config data.
     * @param {Object} config
     */
    public setConfig(config) {
        this.config = {};

        for (const [key, value] of Object.entries(config)) {
            this.config[key] = value;
        }

        this.buildConstants();
        this.buildFees();
        this.buildAddonBytes();
    }

    /**
     * Get config from preset configurations.
     * @param {String} coin
     * @param {String} network
     */
    public setFromPreset(coin, network) {
        this.setConfig(CONFIGURATIONS[coin.toUpperCase()][network.toUpperCase()]);
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
        this.config[key] = value;
    }

    /**
     * Get specific config value.
     * @param  {String} key
     * @return {*}
     */
    public get(key) {
        return this.config[key];
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
     * Get specific config constant based on height 1.
     * @param  {String} key
     * @return {*}
     */
    public getConstant(key) {
        return this.getConstants()[key];
    }

    /**
     * Get all config constants based on height.
     * @param  {(Number|undefined)} height
     * @return {*}
     */
    public getConstants(height?) {
        if (!height && this.height) {
            height = this.height;
        }

        if (!height) {
            height = 1;
        }

        while (
            this.constant.index < this.constants.length - 1 &&
            height >= this.constants[this.constant.index + 1].height
        ) {
            this.constant.index++;
            this.constant.data = this.constants[this.constant.index];
        }

        while (height < this.constants[this.constant.index].height) {
            this.constant.index--;
            this.constant.data = this.constants[this.constant.index];
        }

        return this.constant.data;
    }

    /**
     * Build constant data based on active heights.
     */
    public buildConstants() {
        this.constants = this.config.constants.sort((a, b) => a.height - b.height);
        this.constant = {
            index: 0,
            data: this.constants[0],
        };

        let lastmerged = 0;

        while (lastmerged < this.constants.length - 1) {
            this.constants[lastmerged + 1] = deepmerge(this.constants[lastmerged], this.constants[lastmerged + 1]);
            lastmerged++;
        }
    }

    /**
     * Build fees from config constants.
     */
    public buildFees() {
        Object.keys(TRANSACTION_TYPES).forEach(type =>
            feeManager.set(TRANSACTION_TYPES[type], this.getConstant("fees").staticFees[camelCase(type)]),
        );
    }

    /**
     * Build addon bytes from config constants.
     */
    public buildAddonBytes() {
        if (this.getConstant("fees").dynamicFees.addonBytes) {
            Object.keys(TRANSACTION_TYPES).forEach(type =>
                dynamicFeeManager.set(
                    TRANSACTION_TYPES[type],
                    this.getConstant("fees").dynamicFees.addonBytes[camelCase(type)],
                ),
            );
        }
    }
}

const configManager = new ConfigManager();
export { configManager };
