import { app, Contracts } from "@arkecosystem/core-kernel";
import sqlite3 from "better-sqlite3";
import delay from "delay";
import { ensureFileSync, existsSync, unlinkSync } from "fs-extra";
import pluralize from "pluralize";
import SocketCluster from "socketcluster";
import { getHeaders } from "./utils/get-headers";

class PayloadProcessor {
    private payloadDatabasePath = `${process.env.CORE_PATH_DATA}/transactions-received.sqlite`;

    private databaseSize: number = (500 * 1024 * 1024) / 4096; // 500 MB
    private payloadDatabase: sqlite3.Database;
    private payloadQueue: any[] = [];
    private payloadOverflowQueue: any[] = [];
    private maxPayloadQueueSize = 100;
    private maxPayloadOverflowQueueSize = 50;
    private listener: any;

    public constructor() {
        if (existsSync(this.payloadDatabasePath)) {
            unlinkSync(this.payloadDatabasePath);
        }

        ensureFileSync(this.payloadDatabasePath);

        this.payloadDatabase = new sqlite3(this.payloadDatabasePath);
        this.payloadDatabase.exec(`
            PRAGMA auto_vacuum = FULL;
            PRAGMA journal_mode = OFF;
            PRAGMA max_page_count = ${this.databaseSize};
            CREATE TABLE IF NOT EXISTS payloads (id INTEGER PRIMARY KEY, payload BLOB NOT NULL)
            `);
        this.payloadDatabase.exec("DELETE FROM payloads");
    }

    public inject(socketCluster: SocketCluster): void {
        this.listener = socketCluster.listeners("workerMessage")[0];
        socketCluster.removeListener("workerMessage", this.listener);

        (socketCluster as any).on("workerMessage", async (workerId, req, res) => {
            if (req.endpoint === "p2p.peer.postTransactions") {
                this.addPayload({ workerId, req });
                if (this.totalPayloads() === 1) {
                    this.processPayloads();
                }
                return res(undefined, {
                    data: [],
                    headers: getHeaders(),
                });
            }
            return await this.listener(workerId, req, res);
        });
    }

    private async addPayload(payload) {
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
                } catch (error) {
                    app.ioc.get<Contracts.Kernel.Log.ILogger>("log").warning(
                        `Discarding ${pluralize(
                            "transaction payload",
                            overflowQueueSize,
                            true,
                        )} that could not be added to the disk storage`,
                    );
                }
                this.payloadOverflowQueue.length = 0;
            }
        } else {
            this.payloadQueue.push(payload);
        }
    }

    private totalPayloads() {
        const queueSize = this.payloadQueue.length + this.payloadOverflowQueue.length;
        return queueSize
            ? queueSize
            : this.payloadDatabase
                  .prepare("SELECT COUNT(*) FROM payloads")
                  .pluck()
                  .get();
    }

    private async processPayloads() {
        const payload = this.getNextPayload();
        if (payload) {
            await this.listener(payload.workerId, payload.req, () => {
                //
            });
            await delay(1); // 1ms delay allows the node to breathe
            this.payloadQueue.shift();
            setImmediate(() => this.processPayloads());
        }
    }

    private getNextPayload() {
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

export const payloadProcessor = new PayloadProcessor();
