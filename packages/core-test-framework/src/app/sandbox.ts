import { Application, Container, Services } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { removeSync } from "fs-extra";
import { setGracefulCleanup } from "tmp";

import { GenerateNetwork } from "../generators";
import { ConfigPaths, SandboxCallback, SetUpArguments } from "./types";

export class Sandbox {
    /**
     * @private
     * @type {Application}
     * @memberof Sandbox
     */
    public readonly app: Application;

    /**
     * @private
     * @type {Container.interfaces.Container}
     * @memberof Sandbox
     */
    private readonly container: Container.interfaces.Container;

    /**
     * @private
     * @type {ConfigPaths}
     * @memberof Sandbox
     */
    private readonly paths: ConfigPaths;

    /**
     * Creates an instance of Sandbox.
     *
     * @param {SetUpArguments} [args]
     * @memberof Sandbox
     */
    public constructor(args?: SetUpArguments) {
        setGracefulCleanup();

        this.paths = new GenerateNetwork().generate(args ? args.crypto : {});

        this.container = new Container.Container();

        this.app = new Application(this.container);
    }

    /**
     * Set up the sandbox environment.
     *
     * @param {SandboxCallback} [callback]
     * @returns {Promise<import { app: Application; container: Container.interfaces.Container }>}
     * @memberof Sandbox
     */
    public async setUp(callback?: SandboxCallback): Promise<void> {
        // Configure Crypto
        const exceptions = require(this.paths.crypto.exceptions);
        const genesisBlock = require(this.paths.crypto.genesisBlock);
        const milestones = require(this.paths.crypto.milestones);
        const network = require(this.paths.crypto.network);

        Managers.configManager.setConfig({
            exceptions,
            genesisBlock,
            milestones,
            network,
        });

        this.app.get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository).merge({
            crypto: {
                exceptions,
                genesisBlock,
                milestones,
                network,
            },
        });

        // Configure Application
        process.env.CORE_PATH_CONFIG = this.paths.core.root;

        if (callback) {
            await callback({
                app: this.app,
                container: this.container,
            });

            this.snapshot();
        }
    }

    /**
     * Tear down the sandbox environment.
     *
     * @param {SandboxCallback} [callback]
     * @returns {Promise<void>}
     * @memberof Sandbox
     */
    public async tearDown(callback?: SandboxCallback): Promise<void> {
        try {
            await this.app.terminate();
        } catch (error) {
            // We encountered a unexpected error
        }

        removeSync(this.paths.crypto.root);
        removeSync(this.paths.core.root);

        if (callback) {
            await callback({ app: this.app, container: this.container });
        }
    }

    /**
     * Take a snapshot of the container.
     *
     * @memberof Sandbox
     */
    public snapshot(): void {
        this.container.snapshot();
    }

    /**
     * Restore the snapshot of the container.
     *
     * @memberof Sandbox
     */
    public restore(): void {
        try {
            this.container.restore();
        } catch {
            // No snapshot available to restore.
        }
    }
}
