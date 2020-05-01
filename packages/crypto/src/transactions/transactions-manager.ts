import { CryptoManager } from "..";
import { ITransactionData, Validator } from "../interfaces";
import { Deserializer } from "./deserializer";
import { TransactionFactory } from "./factory";
import { TransactionRegistry } from "./registry";
import { Serializer } from "./serializer";
import { Signer } from "./signer";
import { Utils } from "./utils";
import { Verifier } from "./verifier";

export class TransactionsManager<T, U extends ITransactionData, E> {
    public Deserializer: Deserializer<T, U, E>;
    public TransactionFactory: TransactionFactory<T, U, E>;
    public Serializer: Serializer<T, U, E>;
    public Signer: Signer<T, U, E>;
    public Verifier: Verifier<T, U, E>;
    public Utils: Utils<T, U, E>;
    public TransactionRegistry: TransactionRegistry<T, U, E>;

    public constructor(public cryptoManager: CryptoManager<T>, validator: Validator<U, E>) {
        this.Deserializer = new Deserializer(cryptoManager);
        this.Serializer = new Serializer(cryptoManager);
        this.Utils = new Utils(cryptoManager, this.Serializer);
        this.Verifier = new Verifier(cryptoManager, this.Utils, validator);
        this.Signer = new Signer(cryptoManager, this.Utils);
        this.TransactionRegistry = new TransactionRegistry(validator);
        this.TransactionFactory = new TransactionFactory(
            cryptoManager,
            this.Deserializer,
            this.Serializer,
            this.Verifier,
            this.Utils,
        );
    }
}
