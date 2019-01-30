import fs from "fs-extra";
import JSONStream from "JSONStream";
import msgpack from "msgpack-lite";
import QueryStream from "pg-query-stream";
import pluralize from "pluralize";
import zlib from "zlib";

import { app } from "@arkecosystem/core-kernel";

import * as utils from "../utils";
import { getCodec } from "./codecs";
import { canImportRecord, verifyData } from "./verification";

export const exportTable = async (table, options) => {
    const snapFileName = utils.getPath(table, options.meta.folder, options.codec);
    const codec = getCodec(options.codec);
    const gzip = zlib.createGzip();
    await fs.ensureFile(snapFileName);

    app.logger.info(
        `Starting to export table ${table} to folder ${options.meta.folder}, codec: ${
            options.codec
        }, append:${!!options.blocks}, skipCompression: ${options.meta.skipCompression}`,
    );
    try {
        const snapshotWriteStream = fs.createWriteStream(snapFileName, options.blocks ? { flags: "a" } : {});
        const encodeStream = msgpack.createEncodeStream(codec ? { codec: codec[table] } : {});
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
        app.logger.info(
            `Snapshot: ${table} done. ==> Total rows processed: ${data.processed}, duration: ${data.duration} ms`,
        );

        return {
            count: utils.calcRecordCount(table, data.processed, options.blocks),
            startHeight: utils.calcStartHeight(table, options.meta.startHeight, options.blocks),
            endHeight: options.meta.endHeight,
        };
    } catch (error) {
        // app.terminate("Error while exporting data via query stream", error);
        return null;
    }
};

export const importTable = async (table, options) => {
    const sourceFile = utils.getPath(table, options.meta.folder, options.codec);
    const codec = getCodec(options.codec);
    const gunzip = zlib.createGunzip();
    const decodeStream = msgpack.createDecodeStream(codec ? { codec: codec[table] } : {});
    app.logger.info(
        `Starting to import table ${table} from ${sourceFile}, codec: ${options.codec}, skipCompression: ${
            options.meta.skipCompression
        }`,
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
            app.emitter.emit("progress", { value: counter, table });
            values = [];
            return options.database.db.none(insert);
        }
    };

    app.emitter.emit("start", { count: options.meta[table].count });
    // @ts-ignore
    for await (const record of readStream) {
        counter++;
        if (!verifyData(table, record, prevData, options.signatureVerification)) {
            // app.terminate(`Error verifying data. Payload ${JSON.stringify(record, null, 2)}`);
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
    app.emitter.emit("complete");
};

export const verifyTable = async (table, options) => {
    const sourceFile = utils.getPath(table, options.meta.folder, options.codec);
    const codec = getCodec(options.codec);
    const gunzip = zlib.createGunzip();
    const decodeStream = msgpack.createDecodeStream(codec ? { codec: codec[table] } : {});
    const readStream = options.meta.skipCompression
        ? fs.createReadStream(sourceFile).pipe(decodeStream)
        : fs
              .createReadStream(sourceFile)
              .pipe(gunzip)
              .pipe(decodeStream);

    app.logger.info(`Starting to verify snapshot file ${sourceFile}`);
    let prevData = null;

    decodeStream.on("data", data => {
        if (!verifyData(table, data, prevData, options.signatureVerification)) {
            // app.terminate(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`);
        }
        prevData = data;
    });

    readStream.on("finish", () => {
        app.logger.info(`Snapshot file ${sourceFile} succesfully verified  :+1:`);
    });
};

export const backupTransactionsToJSON = async (snapFileName, query, database) => {
    const transactionBackupPath = utils.getFilePath(snapFileName, "rollbackTransactions");
    await fs.ensureFile(transactionBackupPath);
    const snapshotWriteStream = fs.createWriteStream(transactionBackupPath);
    const qs = new QueryStream(query);

    try {
        const data = await database.db.stream(qs, s => s.pipe(JSONStream.stringify()).pipe(snapshotWriteStream));
        app.logger.info(
            `${pluralize(
                "transaction",
                data.processed,
                true,
            )} from rollbacked blocks safely exported to file ${snapFileName}`,
        );
        return data;
    } catch (error) {
        // app.terminate("Error while exporting data via query stream", error);
    }
};
