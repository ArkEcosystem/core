export const identity = {
    keys: {
        publicKey: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
        privateKey: "d8839c2432bfd0a67ef10a804ba991eabba19f154a3d707917681d45822a5712",
        compressed: true,
    },
    publicKey: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
    privateKey: "d8839c2432bfd0a67ef10a804ba991eabba19f154a3d707917681d45822a5712",
    address: "AGeYmgbg2LgGxRW2vNNJvQ88PknEJsYizC",
    wif: "Ue7A6vSx7ewATPp2dA6UbJ8F39DbZwaHTqhD1MrhzmJqRJmvfZ6C",
    passphrase: "this is a top secret passphrase",
};

export const fixture = {
    data: {
        publicKey: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
        signature:
            "304402200fb4adddd1f1d652b544ea6ab62828a0a65b712ed447e2538db0caebfa68929e02205ecb2e1c63b29879c2ecf1255db506d671c8b3fa6017f67cfd1bf07e6edd1cc8",
        message: "Hello World",
    },
    passphrase: "this is a top secret passphrase",
};

export const signedMessageEntries = [
    ["publicKey", identity.publicKey],
    [
        "signature",
        "3045022100b5ad008d8a2935cd2261c56ef1605b2e35810f47940277d1d8a6a202a08c6de0022021fcbf9ec9db67f8c7019ff2ce07376f8a203ea77f26f2f7d564d5b8f4bde1a7",
    ],
    ["message", "test"],
];
