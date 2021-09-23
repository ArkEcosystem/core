"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const delay_1 = __importDefault(require("delay"));
const fs_extra_1 = require("fs-extra");
const pluralize_1 = __importDefault(require("pluralize"));
const get_headers_1 = require("./utils/get-headers");
class PayloadProcessor {
    constructor() {
        this.payloadDatabasePath = `${process.env.CORE_PATH_DATA}/transactions-received.sqlite`;
        this.databaseSize = (500 * 1024 * 1024) / 4096; // 500 MB
        this.payloadQueue = [];
        this.payloadOverflowQueue = [];
        this.maxPayloadQueueSize = 100;
        this.maxPayloadOverflowQueueSize = 50;
        if (fs_extra_1.existsSync(this.payloadDatabasePath)) {
            fs_extra_1.unlinkSync(this.payloadDatabasePath);
        }
        fs_extra_1.ensureFileSync(this.payloadDatabasePath);
        this.payloadDatabase = new better_sqlite3_1.default(this.payloadDatabasePath);
        this.payloadDatabase.exec(`
            PRAGMA auto_vacuum = FULL;
            PRAGMA journal_mode = OFF;
            PRAGMA max_page_count = ${this.databaseSize};
            CREATE TABLE IF NOT EXISTS payloads (id INTEGER PRIMARY KEY, payload BLOB NOT NULL)
            `);
        this.payloadDatabase.exec("DELETE FROM payloads");
    }
    inject(socketCluster) {
        this.listener = socketCluster.listeners("workerMessage")[0];
        socketCluster.removeListener("workerMessage", this.listener);
        socketCluster.on("workerMessage", async (workerId, req, res) => {
            if (req.endpoint === "p2p.peer.postTransactions") {
                this.addPayload({ workerId, req });
                if (this.totalPayloads() === 1) {
                    this.processPayloads();
                }
                return res(undefined, {
                    data: [],
                    headers: get_headers_1.getHeaders(),
                });
            }
            return await this.listener(workerId, req, res);
        });
    }
    async addPayload(payload) {
        if (this.payloadQueue.length >= this.maxPayloadQueueSize) {
            this.payloadOverflowQueue.push(payload);
            if (this.payloadOverflowQueue.length >= this.maxPayloadOverflowQueueSize) {
                let overflowQueueSize = this.payloadOverflowQueue.length;
                try {
                    const query = this.payloadDatabase.prepare("INSERT INTO payloads (payload) VALUES (:payload)");
                    const saveToDB = this.payloadDatabase.transaction(data => {
                        for (const overflowingPayload of data) {
                            query.run({ payload: JSON.stringify(overflowingPayload) });
                            overflowQueueSize--;
                        }
                    });
                    saveToDB(this.payloadOverflowQueue);
                }
                catch (error) {
                    core_container_1.app.resolvePlugin("logger").warn(`Discarding ${pluralize_1.default("transaction payload", overflowQueueSize, true)} that could not be added to the disk storage`);
                }
                this.payloadOverflowQueue.length = 0;
            }
        }
        else {
            this.payloadQueue.push(payload);
        }
    }
    totalPayloads() {
        const queueSize = this.payloadQueue.length + this.payloadOverflowQueue.length;
        return queueSize
            ? queueSize
            : this.payloadDatabase
                .prepare("SELECT COUNT(*) FROM payloads")
                .pluck()
                .get();
    }
    async processPayloads() {
        const payload = this.getNextPayload();
        if (payload) {
            await this.listener(payload.workerId, payload.req, () => {
                //
            });
            await delay_1.default(1); // 1ms delay allows the node to breathe
            this.payloadQueue.shift();
            setImmediate(() => this.processPayloads());
        }
    }
    getNextPayload() {
        const payloadsFree = this.maxPayloadQueueSize - this.payloadQueue.length;
        if (payloadsFree > 0 && this.payloadQueue.length <= 1) {
            const payloadsFromDB = this.payloadDatabase
                .prepare(`SELECT id, payload FROM payloads LIMIT ${payloadsFree}`)
                .all();
            const payloadIds = [];
            for (const row of payloadsFromDB) {
                this.payloadQueue.push(JSON.parse(row.payload));
                payloadIds.push({ id: row.id });
            }
            const query = this.payloadDatabase.prepare("DELETE FROM payloads WHERE id = :id");
            const deleteFromDB = this.payloadDatabase.transaction(data => {
                for (const id of data) {
                    query.run(id);
                }
            });
            deleteFromDB(payloadIds);
        }
        if (this.payloadQueue.length <= 1 && this.payloadOverflowQueue.length > 0) {
            this.payloadQueue.push(...this.payloadOverflowQueue);
            this.payloadOverflowQueue.length = 0;
        }
        return this.payloadQueue[0];
    }
}
exports.payloadProcessor = new PayloadProcessor();
//# sourceMappingURL=payload-processor.js.map