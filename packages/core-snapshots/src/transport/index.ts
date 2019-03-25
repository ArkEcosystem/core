import fs from "fs-extra";
import JSONStream from "JSONStream";
import msgpack from "msgpack-lite";
import QueryStream from "pg-query-stream";
import pluralize from "pluralize";
import zlib from "zlib";

import { app } from "@arkecosystem/core-container";
import { EventEmitter, Logger } from "@arkecosystem/core-interfaces";

import * as utils from "../utils";
import { codec } from "./codec";
import { canImportRecord, verifyData } from "./verification";

const logger = app.resolvePlugin<Logger.ILogger>("logger");
const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

export const exportTable = async (table, options) => {
    const snapFileName = utils.getPath(table, options.meta.folder);
    const gzip = zlib.createGzip();
    await fs.ensureFile(snapFileName);

    logger.info(
        `Starting to export table ${table} to folder ${
            options.meta.folder
        }, append:${!!options.blocks}, skipCompression: ${options.meta.skipCompression}`,
    );
    try {
        const snapshotWriteStream = fs.createWriteStream(snapFileName, options.blocks ? { flags: "a" } : {});
        const encodeStream = msgpack.createEncodeStream({ codec: codec[table] });
        const qs = new QueryStream(options.queries[table]);

        const data = await options.database.db.stream(qs, s => {
            if (options.meta.skipCompression) {
                return s.pipe(encodeStream).pipe(snapshotWriteStream);
            }

            return s
                .pipe(encodeStream)
                .pipe(gzip)
                .pipe(snapshotWriteStream);
        });
        logger.info(
            `Snapshot: ${table} done. ==> Total rows processed: ${data.processed}, duration: ${data.duration} ms`,
        );

        return {
            count: utils.calcRecordCount(table, data.processed, options.blocks),
            startHeight: utils.calcStartHeight(table, options.meta.startHeight, options.blocks),
            endHeight: options.meta.endHeight,
        };
    } catch (error) {
        app.forceExit("Error while exporting data via query stream", error);
        return null;
    }
};

export const importTable = async (table, options) => {
    const sourceFile = utils.getPath(table, options.meta.folder);
    const gunzip = zlib.createGunzip();
    const decodeStream = msgpack.createDecodeStream({ codec: codec[table] });
    logger.info(
        `Starting to import table ${table} from ${sourceFile}, skipCompression: ${options.meta.skipCompression}`,
    );

    const readStream = options.meta.skipCompression
        ? fs.createReadStream(sourceFile).pipe(decodeStream)
        : fs
              .createReadStream(sourceFile)
              .pipe(gunzip)
              .pipe(decodeStream);

    let values = [];
    let prevData = null;
    let counter = 0;
    const saveData = async data => {
        if (data && data.length > 0) {
            const insert = options.database.pgp.helpers.insert(data, options.database.getColumnSet(table));
            emitter.emit("progress", { value: counter, table });
            values = [];
            return options.database.db.none(insert);
        }
    };

    emitter.emit("start", { count: options.meta[table].count });
    // @ts-ignore
    for await (const record of readStream) {
        counter++;
        if (!verifyData(table, record, prevData, options.signatureVerification)) {
            app.forceExit(`Error verifying data. Payload ${JSON.stringify(record, null, 2)}`);
        }
        if (canImportRecord(table, record, options.lastBlock)) {
            values.push(record);
        }

        if (values.length % options.chunkSize === 0) {
            await saveData(values);
        }
        prevData = record;
    }

    if (values.length > 0) {
        await saveData(values);
    }
    emitter.emit("complete");
};

export const verifyTable = async (table, options) => {
    const sourceFile = utils.getPath(table, options.meta.folder);
    const gunzip = zlib.createGunzip();
    const decodeStream = msgpack.createDecodeStream({ codec: codec[table] });
    const readStream = options.meta.skipCompression
        ? fs.createReadStream(sourceFile).pipe(decodeStream)
        : fs
              .createReadStream(sourceFile)
              .pipe(gunzip)
              .pipe(decodeStream);

    logger.info(`Starting to verify snapshot file ${sourceFile}`);
    let prevData = null;

    decodeStream.on("data", data => {
        if (!verifyData(table, data, prevData, options.signatureVerification)) {
            app.forceExit(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`);
        }
        prevData = data;
    });

    readStream.on("finish", () => {
        logger.info(`Snapshot file ${sourceFile} succesfully verified`);
    });
};

export const backupTransactionsToJSON = async (snapFileName, query, database) => {
    const transactionBackupPath = utils.getFilePath(snapFileName, "rollbackTransactions");
    await fs.ensureFile(transactionBackupPath);
    const snapshotWriteStream = fs.createWriteStream(transactionBackupPath);
    const qs = new QueryStream(query);

    try {
        const data = await database.db.stream(qs, s => s.pipe(JSONStream.stringify()).pipe(snapshotWriteStream));
        logger.info(
            `${pluralize(
                "transaction",
                data.processed,
                true,
            )} from rollbacked blocks safely exported to file ${snapFileName}`,
        );
        return data;
    } catch (error) {
        app.forceExit("Error while exporting data via query stream", error);
    }
};
