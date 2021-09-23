"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const JSONStream_1 = __importDefault(require("JSONStream"));
const msgpack_lite_1 = __importDefault(require("msgpack-lite"));
const pg_query_stream_1 = __importDefault(require("pg-query-stream"));
const pluralize_1 = __importDefault(require("pluralize"));
const zlib_1 = __importDefault(require("zlib"));
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const crypto_1 = require("@arkecosystem/crypto");
const utils = __importStar(require("../utils"));
const codec_1 = require("./codec");
const verification_1 = require("./verification");
const logger = core_container_1.app.resolvePlugin("logger");
const emitter = core_container_1.app.resolvePlugin("event-emitter");
const fixData = (table, data) => {
    if (table === "blocks" && data.height === 1) {
        data.id = crypto_1.Managers.configManager.get("genesisBlock").id;
    }
    // For version=1 transactions the nonce is set automatically at database level (by a trigger
    // on the transactions table). However, the database library we use is upset if we don't
    // provide it, so supply a dummy value here.
    if (table === "transactions" && data.version === 1) {
        data.nonce = "0";
    }
};
exports.exportTable = async (table, options) => {
    const snapFileName = utils.getFilePath(table, options.meta.folder);
    const gzip = zlib_1.default.createGzip();
    await fs_extra_1.default.ensureFile(snapFileName);
    logger.info(`Starting to export table ${table} to folder ${options.meta.folder}, append:${!!options.blocks}, skipCompression: ${options.meta.skipCompression}`);
    try {
        const snapshotWriteStream = fs_extra_1.default.createWriteStream(snapFileName, options.blocks ? { flags: "a" } : {});
        const encodeStream = msgpack_lite_1.default.createEncodeStream({ codec: codec_1.Codec[table] });
        const qs = new pg_query_stream_1.default(options.queries[table]);
        const data = await options.database.db.stream(qs, s => {
            if (options.meta.skipCompression) {
                return s.pipe(encodeStream).pipe(snapshotWriteStream);
            }
            return s
                .pipe(encodeStream)
                .pipe(gzip)
                .pipe(snapshotWriteStream);
        });
        logger.info(`Snapshot: ${table} done. ==> Total rows processed: ${data.processed}, duration: ${data.duration} ms`);
        return {
            count: utils.calcRecordCount(table, data.processed, options.blocks),
            startHeight: utils.calcStartHeight(table, options.meta.startHeight, options.blocks),
            endHeight: options.meta.endHeight,
        };
    }
    catch (error) {
        core_container_1.app.forceExit("Error while exporting data via query stream", error);
        return undefined;
    }
};
exports.importTable = async (table, options) => {
    const sourceFile = utils.getFilePath(table, options.meta.folder);
    const gunzip = zlib_1.default.createGunzip();
    const decodeStream = msgpack_lite_1.default.createDecodeStream({ codec: codec_1.Codec[table] });
    logger.info(`Starting to import table ${table} from ${sourceFile}, skipCompression: ${options.meta.skipCompression}`);
    const readStream = options.meta.skipCompression
        ? fs_extra_1.default.createReadStream(sourceFile).pipe(decodeStream)
        : fs_extra_1.default
            .createReadStream(sourceFile)
            .pipe(gunzip)
            .pipe(decodeStream);
    let values = [];
    let prevData;
    let counter = 0;
    const saveData = async (data) => {
        if (data && data.length > 0) {
            const insert = options.database.pgp.helpers.insert(data, options.database.getColumnSet(table));
            emitter.emit(core_event_emitter_1.ApplicationEvents.SnapshotProgress, { value: counter, table });
            values = [];
            return options.database.db.none(insert);
        }
    };
    emitter.emit(core_event_emitter_1.ApplicationEvents.SnapshotStart, { count: options.meta[table].count });
    // tslint:disable-next-line: await-promise
    for await (const record of readStream) {
        counter++;
        fixData(table, record);
        if (!verification_1.verifyData(table, record, prevData, options.verifySignatures)) {
            core_container_1.app.forceExit(`Error verifying data. Payload ${JSON.stringify(record, undefined, 2)}`);
        }
        if (verification_1.canImportRecord(table, record, options)) {
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
    emitter.emit(core_event_emitter_1.ApplicationEvents.SnapshotComplete);
};
exports.verifyTable = async (table, options) => {
    const sourceFile = utils.getFilePath(table, options.meta.folder);
    const gunzip = zlib_1.default.createGunzip();
    const decodeStream = msgpack_lite_1.default.createDecodeStream({ codec: codec_1.Codec[table] });
    const readStream = options.meta.skipCompression
        ? fs_extra_1.default.createReadStream(sourceFile).pipe(decodeStream)
        : fs_extra_1.default
            .createReadStream(sourceFile)
            .pipe(gunzip)
            .pipe(decodeStream);
    logger.info(`Starting to verify snapshot file ${sourceFile}`);
    let prevData;
    decodeStream.on("data", data => {
        fixData(table, data);
        if (!verification_1.verifyData(table, data, prevData, options.verifySignatures)) {
            core_container_1.app.forceExit(`Error verifying data. Payload ${JSON.stringify(data, undefined, 2)}`);
        }
        prevData = data;
    });
    readStream.on("finish", () => {
        logger.info(`Snapshot file ${sourceFile} successfully verified`);
    });
};
exports.backupTransactionsToJSON = async (snapFileName, query, database) => {
    const transactionBackupPath = utils.getFilePath(snapFileName, "rollbackTransactions");
    await fs_extra_1.default.ensureFile(transactionBackupPath);
    const snapshotWriteStream = fs_extra_1.default.createWriteStream(transactionBackupPath);
    const qs = new pg_query_stream_1.default(query);
    try {
        const data = await database.db.stream(qs, s => s.pipe(JSONStream_1.default.stringify()).pipe(snapshotWriteStream));
        logger.info(`${pluralize_1.default("transaction", data.processed, true)} from rollbacked blocks safely exported to file ${snapFileName}`);
        return data;
    }
    catch (error) {
        core_container_1.app.forceExit("Error while exporting data via query stream", error);
    }
};
//# sourceMappingURL=index.js.map