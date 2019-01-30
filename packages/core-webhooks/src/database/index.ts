import { app } from "@arkecosystem/core-kernel";
import fs from "fs-extra";
import path from "path";
import Sequelize from "sequelize";
import Umzug from "umzug";

class Database {
    public connection: any;
    public model: any;

    /**
     * Set up the database connection.
     * @param  {Object} config
     * @return {void}
     */
    public async setUp(config) {
        if (this.connection) {
            throw new Error("Webhooks database already initialised");
        }

        if (config.dialect === "sqlite" && config.storage !== ":memory:") {
            await fs.ensureFile(config.storage);
        }

        this.connection = new Sequelize({
            ...config,
            ...{ operatorsAliases: Sequelize.Op },
        });

        try {
            await this.connection.authenticate();
            await this.__runMigrations();
            this.__registerModels();
        } catch (error) {
            // app.terminate("Unable to connect to the database!", error);
        }
    }

    /**
     * Paginate all webhooks.
     * @param  {Object} params
     * @return {Object}
     */
    public paginate(params) {
        return this.model.findAndCountAll(params);
    }

    /**
     * Get a webhook for the given id.
     * @param  {Number} id
     * @return {Object}
     */
    public findById(id) {
        return this.model.findById(id);
    }

    /**
     * Get all webhooks for the given event.
     * @param  {String} event
     * @return {Array}
     */
    public findByEvent(event) {
        return this.model.findAll({ where: { event } });
    }

    /**
     * Store a new webhook.
     * @param  {Object} data
     * @return {Object}
     */
    public create(data) {
        return this.model.create(data);
    }

    /**
     * Update the webhook for the given id.
     * @param  {Number} id
     * @param  {Object} data
     * @return {Boolean}
     */
    public async update(id, data) {
        try {
            const webhook = await this.model.findById(id);

            webhook.update(data);

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Destroy the webhook for the given id.
     * @param  {Number} id
     * @return {Boolean}
     */
    public async destroy(id) {
        try {
            const webhook = await this.model.findById(id);

            webhook.destroy();

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Run all migrations.
     * @return {Boolean}
     */
    public async __runMigrations() {
        const umzug = new Umzug({
            storage: "sequelize",
            storageOptions: {
                sequelize: this.connection,
            },
            migrations: {
                params: [this.connection.getQueryInterface(), Sequelize],
                path: path.join(__dirname, "migrations"),
            },
        });

        return umzug.up();
    }

    /**
     * Register all models.
     * @return {void}
     */
    public __registerModels() {
        this.model = this.connection.define(
            "webhook",
            {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER,
                },
                event: Sequelize.STRING,
                target: Sequelize.STRING,
                conditions: Sequelize.JSON,
                token: {
                    unique: true,
                    type: Sequelize.STRING,
                },
                enabled: Sequelize.BOOLEAN,
            },
            {},
        );
    }
}

export const database = new Database();
