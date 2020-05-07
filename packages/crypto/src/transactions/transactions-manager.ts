import { CryptoManager } from "..";
import { ITransactionData, Validator } from "../interfaces";
import { BuilderFactory } from "./builders";
import { Deserializer } from "./deserializer";
import { TransactionFactory } from "./factory";
import { TransactionRegistry } from "./registry";
import { Serializer } from "./serializer";
import { Signer } from "./signer";
import { TransactionTypeFactory } from "./types";
import { Utils } from "./utils";
import { Verifier } from "./verifier";

export class TransactionsManager<T, U extends ITransactionData, E = any> {
    public Deserializer: Deserializer<T, U, E>;
    public TransactionFactory: TransactionFactory<T, U, E>;
    public Serializer: Serializer<T, U, E>;
    public Signer: Signer<T, U, E>;
    public Verifier: Verifier<T, U, E>;
    public Utils: Utils<T, U, E>;
    public TransactionRegistry: TransactionRegistry<T, U, E>;
    public BuilderFactory: BuilderFactory<T, U, E>;
    public TransactionTypeFactory: TransactionTypeFactory<T, U, E>;

    public constructor(cryptoManager: CryptoManager<T>, validator: Validator<U, E>) {
        // @ts-ignore TODO: resolve this circular dependency
        this.TransactionRegistry = new TransactionRegistry(cryptoManager, this.Verifier, validator);
        this.TransactionTypeFactory = this.TransactionRegistry.TransactionTypeFactory;
        this.Deserializer = new Deserializer(cryptoManager, this.TransactionTypeFactory);
        this.Serializer = new Serializer(cryptoManager, this.TransactionTypeFactory);
        this.Utils = new Utils(cryptoManager, this.Serializer, this.TransactionTypeFactory);
        this.Verifier = new Verifier(cryptoManager, this.Utils, validator, this.TransactionTypeFactory);
        // TODO:
        // @ts-ignore
        this.TransactionTypeFactory.verifier = this.Verifier;
        this.Signer = new Signer(cryptoManager, this.Utils);
        this.TransactionFactory = new TransactionFactory(
            cryptoManager,
            this.Deserializer,
            this.Serializer,
            this.Verifier,
            this.Utils,
            this.TransactionTypeFactory,
        );
        // TODO: sort this out - these should be broken apart into other steps
        this.BuilderFactory = new BuilderFactory(cryptoManager, this);
    }
}
