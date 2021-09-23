{
  "targets": [{
    "target_name": "bcrypto",
    "sources": [
      "./src/torsion/src/aead.c",
      "./src/torsion/src/asn1.c",
      "./src/torsion/src/chacha20.c",
      "./src/torsion/src/cipher.c",
      "./src/torsion/src/drbg.c",
      "./src/torsion/src/dsa.c",
      "./src/torsion/src/ecc.c",
      "./src/torsion/src/encoding.c",
      "./src/torsion/src/entropy/env.c",
      "./src/torsion/src/entropy/hw.c",
      "./src/torsion/src/entropy/sys.c",
      "./src/torsion/src/hash.c",
      "./src/torsion/src/internal.c",
      "./src/torsion/src/kdf.c",
      "./src/torsion/src/mpi.c",
      "./src/torsion/src/poly1305.c",
      "./src/torsion/src/rand.c",
      "./src/torsion/src/rsa.c",
      "./src/torsion/src/salsa20.c",
      "./src/torsion/src/secretbox.c",
      "./src/torsion/src/siphash.c",
      "./src/torsion/src/util.c",
      "./src/bcrypto.cc"
    ],
    "cflags": [
      "-Wall",
      "-Wextra",
      "-Wno-implicit-fallthrough", # torsion
      "-Wno-nonnull-compare", # secp256k1
      "-Wno-unknown-warning", # gcc
      "-Wno-unknown-warning-option", # clang
      "-Wno-unused-function", # secp256k1
      "-Wno-unused-parameter", # bsd
      "-O3"
    ],
    "cflags_c": [
      "-std=c89",
      "-pedantic",
      "-Wcast-align",
      "-Wshadow",
      "-Wno-declaration-after-statement",
      "-Wno-long-long",
      "-Wno-overlength-strings"
    ],
    "include_dirs": [
      "./src/torsion/include"
    ],
    "variables": {
      "with_secp256k1%": "true"
    },
    "conditions": [
      ["OS=='win'", {
        "msbuild_settings": {
          "ClCompile": {
            "ObjectFileName": "$(IntDir)/%(Directory)/%(Filename)"
          },
          "Link": {
            "ImageHasSafeExceptionHandlers": "false"
          }
        }
      }],
      ["with_secp256k1=='true'", {
        "defines": [
          "BCRYPTO_USE_SECP256K1",
          # "BCRYPTO_USE_SECP256K1_LATEST",
          # "ECMULT_GEN_PREC_BITS=4",
          # "ECMULT_WINDOW_SIZE=15",
          "USE_NUM_NONE",
          "USE_FIELD_INV_BUILTIN",
          "USE_SCALAR_INV_BUILTIN",
          "USE_ENDOMORPHISM",
          "ENABLE_MODULE_ECDH",
          "ENABLE_MODULE_ELLIGATOR",
          "ENABLE_MODULE_EXTRA",
          "ENABLE_MODULE_RECOVERY",
          "ENABLE_MODULE_SCHNORRLEG"
          # "ENABLE_MODULE_SCHNORRSIG"
        ],
        "sources": [
          "./src/secp256k1/src/secp256k1.c",
          "./src/secp256k1/contrib/lax_der_parsing.c"
        ],
        # "include_dirs": [
        #   "./src/secp256k1",
        #   "./src/secp256k1/include",
        #   "./src/secp256k1/src"
        # ],
        "conditions": [
          ["node_byteorder=='big'", {
            "defines": [
              "WORDS_BIGENDIAN"
            ]
          }],
          ["target_arch=='x64' and OS!='win'", {
            "defines": [
              "HAVE___INT128",
              "USE_ASM_X86_64",
              "USE_FIELD_5X52",
              "USE_SCALAR_4X64"
            ]
          }, {
            "defines": [
              "USE_FIELD_10X26",
              "USE_SCALAR_8X32"
            ]
          }]
        ]
      }]
    ]
  }]
}
