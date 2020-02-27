"use strict";
exports.__esModule = true;
var core_container_1 = require("@arkecosystem/core-container");
var core_magistrate_crypto_1 = require("@arkecosystem/core-magistrate-crypto");
var crypto_1 = require("@arkecosystem/crypto");
var delegates_json_1 = require("../utils/config/testnet/delegates.json");
var defaultPassphrase = delegates_json_1.secrets[0];
var TransactionFactory = /** @class */ (function () {
    function TransactionFactory(builder) {
        this.network = "testnet";
        this.passphrase = defaultPassphrase;
        this.builder = builder;
    }
    TransactionFactory.transfer = function (recipientId, amount, vendorField) {
        if (amount === void 0) { amount = 2 * 1e8; }
        var builder = crypto_1.Transactions.BuilderFactory.transfer()
            .amount(crypto_1.Utils.BigNumber.make(amount).toFixed())
            .recipientId(recipientId || crypto_1.Identities.Address.fromPassphrase(defaultPassphrase));
        if (vendorField) {
            builder.vendorField(vendorField);
        }
        return new TransactionFactory(builder);
    };
    TransactionFactory.secondSignature = function (secondPassphrase) {
        return new TransactionFactory(crypto_1.Transactions.BuilderFactory.secondSignature().signatureAsset(secondPassphrase || defaultPassphrase));
    };
    TransactionFactory.delegateRegistration = function (username) {
        return new TransactionFactory(crypto_1.Transactions.BuilderFactory.delegateRegistration().usernameAsset(username));
    };
    TransactionFactory.delegateResignation = function () {
        return new TransactionFactory(crypto_1.Transactions.BuilderFactory.delegateResignation());
    };
    TransactionFactory.vote = function (publicKey) {
        return new TransactionFactory(crypto_1.Transactions.BuilderFactory.vote().votesAsset([
            "+" + (publicKey || crypto_1.Identities.PublicKey.fromPassphrase(defaultPassphrase)),
        ]));
    };
    TransactionFactory.unvote = function (publicKey) {
        return new TransactionFactory(crypto_1.Transactions.BuilderFactory.vote().votesAsset([
            "-" + (publicKey || crypto_1.Identities.PublicKey.fromPassphrase(defaultPassphrase)),
        ]));
    };
    TransactionFactory.multiSignature = function (participants, min) {
        var passphrases;
        if (!participants) {
            passphrases = [delegates_json_1.secrets[0], delegates_json_1.secrets[1], delegates_json_1.secrets[2]];
        }
        participants = participants || [
            crypto_1.Identities.PublicKey.fromPassphrase(delegates_json_1.secrets[0]),
            crypto_1.Identities.PublicKey.fromPassphrase(delegates_json_1.secrets[1]),
            crypto_1.Identities.PublicKey.fromPassphrase(delegates_json_1.secrets[2]),
        ];
        var factory = new TransactionFactory(crypto_1.Transactions.BuilderFactory.multiSignature().multiSignatureAsset({
            publicKeys: participants,
            min: min || participants.length
        }));
        if (passphrases) {
            factory.withPassphraseList(passphrases);
        }
        factory.withSenderPublicKey(participants[0]);
        return factory;
    };
    TransactionFactory.ipfs = function (ipfsId) {
        return new TransactionFactory(crypto_1.Transactions.BuilderFactory.ipfs().ipfsAsset(ipfsId));
    };
    TransactionFactory.htlcLock = function (lockAsset, recipientId, amount) {
        if (amount === void 0) { amount = 2 * 1e8; }
        var builder = crypto_1.Transactions.BuilderFactory.htlcLock()
            .htlcLockAsset(lockAsset)
            .amount(crypto_1.Utils.BigNumber.make(amount).toFixed())
            .recipientId(recipientId || crypto_1.Identities.Address.fromPassphrase(defaultPassphrase));
        return new TransactionFactory(builder);
    };
    TransactionFactory.htlcClaim = function (claimAsset) {
        return new TransactionFactory(crypto_1.Transactions.BuilderFactory.htlcClaim().htlcClaimAsset(claimAsset));
    };
    TransactionFactory.htlcRefund = function (refundAsset) {
        return new TransactionFactory(crypto_1.Transactions.BuilderFactory.htlcRefund().htlcRefundAsset(refundAsset));
    };
    TransactionFactory.multiPayment = function (payments) {
        var builder = crypto_1.Transactions.BuilderFactory.multiPayment();
        for (var _i = 0, payments_1 = payments; _i < payments_1.length; _i++) {
            var payment = payments_1[_i];
            builder.addPayment(payment.recipientId, payment.amount);
        }
        return new TransactionFactory(builder);
    };
    TransactionFactory.businessRegistration = function (businessRegistrationAsset) {
        var businessRegistrationBuilder = new core_magistrate_crypto_1.Builders.BusinessRegistrationBuilder();
        businessRegistrationBuilder.businessRegistrationAsset(businessRegistrationAsset);
        return new TransactionFactory(businessRegistrationBuilder);
    };
    TransactionFactory.businessResignation = function () {
        return new TransactionFactory(new core_magistrate_crypto_1.Builders.BusinessResignationBuilder());
    };
    TransactionFactory.businessUpdate = function (businessUpdateAsset) {
        var businessUpdateBuilder = new core_magistrate_crypto_1.Builders.BusinessUpdateBuilder();
        businessUpdateBuilder.businessUpdateAsset(businessUpdateAsset);
        return new TransactionFactory(businessUpdateBuilder);
    };
    TransactionFactory.bridgechainRegistration = function (bridgechainRegistrationAsset) {
        var bridgechainRegistrationBuilder = new core_magistrate_crypto_1.Builders.BridgechainRegistrationBuilder();
        bridgechainRegistrationBuilder.bridgechainRegistrationAsset(bridgechainRegistrationAsset);
        return new TransactionFactory(bridgechainRegistrationBuilder);
    };
    TransactionFactory.bridgechainResignation = function (registeredBridgechainId) {
        var bridgechainResignationBuilder = new core_magistrate_crypto_1.Builders.BridgechainResignationBuilder();
        bridgechainResignationBuilder.bridgechainResignationAsset(registeredBridgechainId);
        return new TransactionFactory(bridgechainResignationBuilder);
    };
    TransactionFactory.bridgechainUpdate = function (bridgechainUpdateAsset) {
        var bridgechainUpdateBuilder = new core_magistrate_crypto_1.Builders.BridgechainUpdateBuilder();
        bridgechainUpdateBuilder.bridgechainUpdateAsset(bridgechainUpdateAsset);
        return new TransactionFactory(bridgechainUpdateBuilder);
    };
    TransactionFactory.getNonce = function (publicKey) {
        try {
            return core_container_1.app.resolvePlugin("database").walletManager.getNonce(publicKey);
        }
        catch (_a) {
            return crypto_1.Utils.BigNumber.ZERO;
        }
    };
    TransactionFactory.prototype.withFee = function (fee) {
        this.fee = crypto_1.Utils.BigNumber.make(fee);
        return this;
    };
    TransactionFactory.prototype.withTimestamp = function (timestamp) {
        this.timestamp = timestamp;
        return this;
    };
    TransactionFactory.prototype.withNetwork = function (network) {
        this.network = network;
        return this;
    };
    TransactionFactory.prototype.withHeight = function (height) {
        crypto_1.Managers.configManager.setHeight(height);
        return this;
    };
    TransactionFactory.prototype.withSenderPublicKey = function (sender) {
        this.senderPublicKey = sender;
        return this;
    };
    TransactionFactory.prototype.withNonce = function (nonce) {
        this.nonce = nonce;
        return this;
    };
    TransactionFactory.prototype.withExpiration = function (expiration) {
        this.expiration = expiration;
        return this;
    };
    TransactionFactory.prototype.withVersion = function (version) {
        this.version = version;
        return this;
    };
    TransactionFactory.prototype.withPassphrase = function (passphrase) {
        this.passphrase = passphrase;
        return this;
    };
    TransactionFactory.prototype.withSecondPassphrase = function (secondPassphrase) {
        this.secondPassphrase = secondPassphrase;
        return this;
    };
    TransactionFactory.prototype.withPassphraseList = function (passphrases) {
        this.passphraseList = passphrases;
        return this;
    };
    TransactionFactory.prototype.withPassphrasePair = function (passphrases) {
        this.passphrase = passphrases.passphrase;
        this.secondPassphrase = passphrases.secondPassphrase;
        return this;
    };
    TransactionFactory.prototype.withPassphrasePairs = function (passphrases) {
        this.passphrasePairs = passphrases;
        return this;
    };
    TransactionFactory.prototype.create = function (quantity) {
        if (quantity === void 0) { quantity = 1; }
        return this.make(quantity, "getStruct");
    };
    TransactionFactory.prototype.createOne = function () {
        return this.create(1)[0];
    };
    TransactionFactory.prototype.build = function (quantity) {
        if (quantity === void 0) { quantity = 1; }
        return this.make(quantity, "build");
    };
    TransactionFactory.prototype.getNonce = function () {
        if (this.nonce) {
            return this.nonce;
        }
        return TransactionFactory.getNonce(this.senderPublicKey);
    };
    TransactionFactory.prototype.make = function (quantity, method) {
        var _this = this;
        if (quantity === void 0) { quantity = 1; }
        if (this.passphrasePairs && this.passphrasePairs.length) {
            return this.passphrasePairs.map(function (passphrasePair) {
                return _this.withPassphrase(passphrasePair.passphrase)
                    .withSecondPassphrase(passphrasePair.secondPassphrase)
                    .sign(quantity, method)[0];
            });
        }
        return this.sign(quantity, method);
    };
    TransactionFactory.prototype.sign = function (quantity, method) {
        crypto_1.Managers.configManager.setFromPreset(this.network);
        if (!this.senderPublicKey) {
            this.senderPublicKey = crypto_1.Identities.PublicKey.fromPassphrase(this.passphrase);
        }
        var transactions = [];
        var nonce = this.getNonce();
        for (var i = 0; i < quantity; i++) {
            if (this.builder.constructor.name === "TransferBuilder") {
                // @FIXME: when we use any of the "withPassphrase*" methods the builder will
                // always remember the previous vendor field instead generating a new one on each iteration
                var vendorField = this.builder.data.vendorField;
                if (!vendorField || (vendorField && vendorField.startsWith("Test Transaction"))) {
                    this.builder.vendorField("Test Transaction " + (i + 1));
                }
            }
            if (this.builder.constructor.name === "DelegateRegistrationBuilder") {
                // @FIXME: when we use any of the "withPassphrase*" methods the builder will
                // always remember the previous username instead generating a new one on each iteration
                if (!this.builder.data.asset.delegate.username) {
                    this.builder = crypto_1.Transactions.BuilderFactory.delegateRegistration().usernameAsset(this.getRandomUsername());
                }
            }
            if (this.version) {
                this.builder.version(this.version);
            }
            if (this.builder.data.version > 1) {
                nonce = nonce.plus(1);
                this.builder.nonce(nonce);
            }
            if (this.fee) {
                this.builder.fee(this.fee.toFixed());
            }
            if (this.timestamp) {
                this.builder.data.timestamp = this.timestamp;
            }
            if (this.senderPublicKey) {
                this.builder.senderPublicKey(this.senderPublicKey);
            }
            if (this.expiration) {
                this.builder.expiration(this.expiration);
            }
            var sign = true;
            if (this.passphraseList && this.passphraseList.length) {
                sign = this.builder.constructor.name === "MultiSignatureBuilder";
                for (var i_1 = 0; i_1 < this.passphraseList.length; i_1++) {
                    this.builder.multiSign(this.passphraseList[i_1], i_1);
                }
            }
            var testnet = ["unitnet", "testnet"].includes(crypto_1.Managers.configManager.get("network.name"));
            if (sign) {
                var aip11 = crypto_1.Managers.configManager.getMilestone().aip11;
                if (this.builder.data.version === 1 && aip11) {
                    crypto_1.Managers.configManager.getMilestone().aip11 = false;
                }
                else if (testnet) {
                    crypto_1.Managers.configManager.getMilestone().aip11 = true;
                }
                this.builder.sign(this.passphrase);
                if (this.secondPassphrase) {
                    this.builder.secondSign(this.secondPassphrase);
                }
            }
            var transaction = this.builder[method]();
            if (testnet) {
                crypto_1.Managers.configManager.getMilestone().aip11 = true;
            }
            transactions.push(transaction);
        }
        return transactions;
    };
    TransactionFactory.prototype.getRandomUsername = function () {
        return Math.random()
            .toString(36)
            .toLowerCase();
    };
    return TransactionFactory;
}());
exports.TransactionFactory = TransactionFactory;
