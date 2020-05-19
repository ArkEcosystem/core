import { CryptoManager } from "..";
import { ITransactionData, SchemaError, Validator } from "../interfaces";
import { BuilderFactory } from "./builders";
import { Deserializer } from "./deserializer";
import { TransactionFactory } from "./factory";
import { TransactionRegistry } from "./registry";
import { Serializer } from "./serializer";
import { Signer } from "./signer";
import { TransactionTypeFactory } from "./types";
import { Utils } from "./utils";
import { Verifier } from "./verifier";

export class TransactionTools<T, U extends ITransactionData = ITransactionData, E = SchemaError> {
    public Deserializer: Deserializer<T, U, E>;
    public Serializer: Serializer<T, U, E>;
    public Signer: Signer<T, U, E>;
    public Verifier: Verifier<T, U, E>;
    public Utils: Utils<T, U, E>;
    public TransactionRegistry: TransactionRegistry<T, U, E>;
    public TransactionTypeFactory: TransactionTypeFactory<T, U, E>;

    public constructor(cryptoManager: CryptoManager<T>, validator: Validator<U, E>) {
        this.TransactionRegistry = new TransactionRegistry(validator);
        this.TransactionTypeFactory = new TransactionTypeFactory(
            cryptoManager,
            this.TransactionRegistry.transactionTypes,
        );
        this.Deserializer = new Deserializer(cryptoManager, this.TransactionTypeFactory);
        this.Serializer = new Serializer(cryptoManager, this.TransactionTypeFactory);
        this.Utils = new Utils(cryptoManager, this.Serializer, this.TransactionTypeFactory);
        this.Verifier = new Verifier(cryptoManager, this.Utils, validator, this.TransactionTypeFactory);

        this.Signer = new Signer(cryptoManager, this.Utils);
    }
}

export class TransactionManager<T, U extends ITransactionData = ITransactionData, E = SchemaError> {
    public TransactionTools: TransactionTools<T, U, E>;
    public BuilderFactory: BuilderFactory<T, U, E>;
    public TransactionFactory: TransactionFactory<T, U, E>;

    public constructor(cryptoManager: CryptoManager<T>, validator: Validator<U, E>) {
        this.TransactionTools = new TransactionTools(cryptoManager, validator);
        this.TransactionFactory = new TransactionFactory(cryptoManager, this.TransactionTools);
        this.BuilderFactory = new BuilderFactory(cryptoManager);
        this.TransactionTools.TransactionTypeFactory.initialize(this.TransactionTools, this.TransactionFactory);
        this.BuilderFactory.initialize(this.TransactionTools, this.TransactionFactory);
    }
}
