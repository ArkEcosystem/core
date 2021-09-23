/**
 * bcrypto.cc - fast native bindings to crypto functions
 * Copyright (c) 2016-2020, Christopher Jeffrey (MIT License)
 * https://github.com/bcoin-org/bcrypto
 */

#include <stdint.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#include <node_api.h>

#include <torsion/aead.h>
#include <torsion/chacha20.h>
#include <torsion/cipher.h>
#include <torsion/drbg.h>
#include <torsion/dsa.h>
#include <torsion/ecc.h>
#include <torsion/encoding.h>
#include <torsion/hash.h>
#include <torsion/kdf.h>
#include <torsion/poly1305.h>
#include <torsion/rand.h>
#include <torsion/rsa.h>
#include <torsion/salsa20.h>
#include <torsion/secretbox.h>
#include <torsion/siphash.h>
#include <torsion/util.h>

#ifdef BCRYPTO_USE_SECP256K1
#include "secp256k1/include/secp256k1.h"
#include "secp256k1/include/secp256k1_ecdh.h"
#include "secp256k1/include/secp256k1_elligator.h"
#include "secp256k1/include/secp256k1_extra.h"
#include "secp256k1/include/secp256k1_recovery.h"
#include "secp256k1/include/secp256k1_schnorrleg.h"
#ifdef BCRYPTO_USE_SECP256K1_LATEST
#include "secp256k1/include/secp256k1_schnorrsig.h"
#endif
#include "secp256k1/contrib/lax_der_parsing.h"
#endif

#define CHECK(expr) do {                            \
  if (!(expr))                                      \
    bcrypto_assert_fail(__FILE__, __LINE__, #expr); \
} while (0)

#define ENTROPY_SIZE 32
#define SCRATCH_SIZE 64

#define MAX_BUFFER_LENGTH \
  (sizeof(uintptr_t) == 4 ? 0x3ffffffful : 0xfffffffful)

#define MAX_STRING_LENGTH \
  (sizeof(uintptr_t) == 4 ? ((1ul << 28) - 16ul) : ((1ul << 29) - 24ul))

#define JS_ERR_CONTEXT "Could not create context."
#define JS_ERR_FINAL "Could not finalize context."
#define JS_ERR_SIGNATURE "Invalid signature."
#define JS_ERR_SIGNATURE_SIZE "Invalid signature size."
#define JS_ERR_PRIVKEY "Invalid private key."
#define JS_ERR_PRIVKEY_SIZE "Invalid private key size."
#define JS_ERR_PUBKEY "Invalid public key."
#define JS_ERR_PUBKEY_SIZE "Invalid public key size."
#define JS_ERR_SCALAR "Invalid scalar."
#define JS_ERR_SCALAR_SIZE "Invalid scalar size."
#define JS_ERR_POINT "Invalid point."
#define JS_ERR_POINT_SIZE "Invalid point size."
#define JS_ERR_SIGN "Could not sign."
#define JS_ERR_KEY "Invalid key."
#define JS_ERR_KEY_SIZE "Invalid key size."
#define JS_ERR_IV "Invalid IV."
#define JS_ERR_IV_SIZE "Invalid IV size."
#define JS_ERR_NONCE "Invalid nonce."
#define JS_ERR_NONCE_SIZE "Invalid nonce size."
#define JS_ERR_SECRET_SIZE "Invalid secret size."
#define JS_ERR_TAG "Invalid tag."
#define JS_ERR_TAG_SIZE "Invalid tag size."
#define JS_ERR_ENTROPY "Invalid entropy."
#define JS_ERR_ENTROPY_SIZE "Invalid entropy size."
#define JS_ERR_PREIMAGE "Invalid preimage."
#define JS_ERR_PREIMAGE_SIZE "Invalid preimage size."
#define JS_ERR_RECOVERY_PARAM "Invalid recovery parameter."
#define JS_ERR_NO_SCHNORR "Schnorr is not supported."
#define JS_ERR_RANDOM "Randomization failed."
#define JS_ERR_PREFIX_SIZE "Invalid prefix length."
#define JS_ERR_GENERATE "Could not generate key."
#define JS_ERR_ENCRYPT "Could not encrypt."
#define JS_ERR_DECRYPT "Could not decrypt."
#define JS_ERR_VEIL "Could not veil."
#define JS_ERR_UNVEIL "Could not unveil."
#define JS_ERR_PARAMS "Invalid params."
#define JS_ERR_INIT "Context is not initialized."
#define JS_ERR_STATE "Invalid state."
#define JS_ERR_ENCODE "Encoding failed."
#define JS_ERR_DECODE "Decoding failed."
#define JS_ERR_OUTPUT_SIZE "Invalid output size."
#define JS_ERR_NODE_SIZE "Invalid node sizes."
#define JS_ERR_DERIVE "Derivation failed."
#define JS_ERR_MSG_SIZE "Invalid message size."
#define JS_ERR_ALLOC "Allocation failed."
#define JS_ERR_ARG "Invalid argument."
#define JS_ERR_OPT "Could not set option."
#define JS_ERR_GET "Could not get value."
#define JS_ERR_CRYPT "Could not encipher."
#define JS_ERR_RNG "RNG failure."

#define JS_THROW(msg) do {                              \
  CHECK(napi_throw_error(env, NULL, (msg)) == napi_ok); \
  return NULL;                                          \
} while (0)

#define JS_ASSERT(cond, msg) if (!(cond)) JS_THROW(msg)

#define JS_CHECK_ALLOC(expr) JS_ASSERT((expr) == napi_ok, JS_ERR_ALLOC)

/*
 * Structs
 */

typedef struct bcrypto_blake2b_s {
  blake2b_t ctx;
  int started;
} bcrypto_blake2b_t;

typedef struct bcrypto_blake2s_s {
  blake2s_t ctx;
  int started;
} bcrypto_blake2s_t;

typedef struct bcrypto_chacha20_s {
  chacha20_t ctx;
  int started;
} bcrypto_chacha20_t;

typedef struct bcrypto_cipher_s {
  cipher_stream_t ctx;
  int type;
  int mode;
  int encrypt;
  int started;
  int has_tag;
} bcrypto_cipher_t;

typedef struct bcrypto_ctr_drbg_s {
  ctr_drbg_t ctx;
  uint32_t bits;
  int derivation;
  int started;
} bcrypto_ctr_drbg_t;

typedef struct bcrypto_mont_s {
  mont_curve_t *ctx;
  size_t scalar_size;
  size_t scalar_bits;
  size_t field_size;
  size_t field_bits;
} bcrypto_mont_curve_t;

typedef struct bcrypto_edwards_s {
  edwards_curve_t *ctx;
  edwards_scratch_t *scratch;
  size_t scalar_size;
  size_t scalar_bits;
  size_t field_size;
  size_t field_bits;
  size_t priv_size;
  size_t pub_size;
  size_t sig_size;
} bcrypto_edwards_curve_t;

typedef struct bcrypto_hash_s {
  hash_t ctx;
  int type;
  int started;
} bcrypto_hash_t;

typedef struct bcrypto_hash_drbg_s {
  hash_drbg_t ctx;
  int type;
  int started;
} bcrypto_hash_drbg_t;

typedef struct bcrypto_hmac_s {
  hmac_t ctx;
  int type;
  int started;
} bcrypto_hmac_t;

typedef struct bcrypto_hmac_drbg_s {
  hmac_drbg_t ctx;
  int type;
  int started;
} bcrypto_hmac_drbg_t;

typedef struct bcrypto_keccak_s {
  keccak_t ctx;
  int started;
} bcrypto_keccak_t;

typedef struct bcrypto_poly1305_s {
  poly1305_t ctx;
  int started;
} bcrypto_poly1305_t;

typedef struct bcrypto_rc4_s {
  rc4_t ctx;
  int started;
} bcrypto_rc4_t;

typedef struct bcrypto_rng_s {
  rng_t ctx;
  int started;
} bcrypto_rng_t;

typedef struct bcrypto_salsa20_s {
  salsa20_t ctx;
  int started;
} bcrypto_salsa20_t;

#ifdef BCRYPTO_USE_SECP256K1
typedef struct bcrypto_secp256k1_s {
  secp256k1_context *ctx;
  secp256k1_scratch_space *scratch;
} bcrypto_secp256k1_t;
#endif

typedef struct bcrypto_wei_s {
  wei_curve_t *ctx;
  wei_scratch_t *scratch;
  size_t scalar_size;
  size_t scalar_bits;
  size_t field_size;
  size_t field_bits;
  size_t sig_size;
  size_t legacy_size;
  size_t schnorr_size;
} bcrypto_wei_curve_t;

/*
 * Assertions
 */

static void
bcrypto_assert_fail(const char *file, int line, const char *expr) {
  fprintf(stderr, "%s:%d: Assertion `%s' failed.\n", file, line, expr);
  fflush(stderr);
  abort();
}

/*
 * Allocation
 */

static void *
bcrypto_malloc(size_t size) {
  if (size == 0)
    return NULL;

  return malloc(size);
}

static void
bcrypto_free(void *ptr) {
  if (ptr != NULL)
    free(ptr);
}

static void *
bcrypto_xmalloc(size_t size) {
  void *ptr;

  if (size == 0)
    return NULL;

  ptr = malloc(size);

  CHECK(ptr != NULL);

  return ptr;
}

/*
 * N-API Extras
 */

static napi_status
read_value_string_latin1(napi_env env, napi_value value,
                         char **str, size_t *length) {
  char *buf;
  size_t buflen;
  napi_status status;

  status = napi_get_value_string_latin1(env, value, NULL, 0, &buflen);

  if (status != napi_ok)
    return status;

  buf = (char *)bcrypto_malloc(buflen + 1);

  if (buf == NULL)
    return napi_generic_failure;

  status = napi_get_value_string_latin1(env,
                                        value,
                                        buf,
                                        buflen + 1,
                                        length);

  if (status != napi_ok) {
    bcrypto_free(buf);
    return status;
  }

  CHECK(*length == buflen);

  *str = buf;

  return napi_ok;
}

/*
 * AEAD
 */

static void
bcrypto_aead_destroy_(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(aead_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_aead_create(napi_env env, napi_callback_info info) {
  aead_t *ctx = (aead_t *)bcrypto_xmalloc(sizeof(aead_t));
  napi_value handle;

  ctx->mode = -1;

  CHECK(napi_create_external(env,
                             ctx,
                             bcrypto_aead_destroy_,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_aead_init(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  const uint8_t *key, *iv;
  size_t key_len, iv_len;
  aead_t *ctx;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ctx) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&iv, &iv_len) == napi_ok);

  JS_ASSERT(key_len >= 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(iv_len == 8 || iv_len == 12 || iv_len == 16
         || iv_len == 24 || iv_len == 28 || iv_len == 32, JS_ERR_IV_SIZE);

  aead_init(ctx, key, iv, iv_len);

  return argv[0];
}

static napi_value
bcrypto_aead_aad(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *aad;
  size_t aad_len;
  aead_t *ctx;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ctx) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&aad, &aad_len) == napi_ok);

  JS_ASSERT(ctx->mode != -1, JS_ERR_INIT);
  JS_ASSERT(ctx->mode == 0, JS_ERR_STATE);

  aead_aad(ctx, aad, aad_len);

  return argv[0];
}

static napi_value
bcrypto_aead_encrypt(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *msg;
  size_t msg_len;
  aead_t *ctx;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ctx) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);

  JS_ASSERT(ctx->mode != -1, JS_ERR_INIT);
  JS_ASSERT(ctx->mode == 0 || ctx->mode == 1, JS_ERR_STATE);

  aead_encrypt(ctx, msg, msg, msg_len);

  return argv[1];
}

static napi_value
bcrypto_aead_decrypt(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *msg;
  size_t msg_len;
  aead_t *ctx;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ctx) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);

  JS_ASSERT(ctx->mode != -1, JS_ERR_INIT);
  JS_ASSERT(ctx->mode == 0 || ctx->mode == 2, JS_ERR_STATE);

  aead_decrypt(ctx, msg, msg, msg_len);

  return argv[1];
}

static napi_value
bcrypto_aead_auth(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *msg;
  size_t msg_len;
  aead_t *ctx;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ctx) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);

  JS_ASSERT(ctx->mode != -1, JS_ERR_INIT);
  JS_ASSERT(ctx->mode == 0 || ctx->mode == 3, JS_ERR_STATE);

  aead_auth(ctx, msg, msg_len);

  return argv[1];
}

static napi_value
bcrypto_aead_final(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[16];
  aead_t *ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ctx) == napi_ok);

  JS_ASSERT(ctx->mode != -1, JS_ERR_INIT);

  aead_final(ctx, out);

  CHECK(napi_create_buffer_copy(env, 16, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_aead_destroy(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  aead_t *ctx;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ctx) == napi_ok);

  ctx->mode = -1;

  return argv[0];
}

static napi_value
bcrypto_aead_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t mac[16];
  const uint8_t *tag;
  size_t tag_len;
  aead_t *ctx;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ctx) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&tag, &tag_len) == napi_ok);

  JS_ASSERT(ctx->mode != -1, JS_ERR_INIT);
  JS_ASSERT(tag_len == 16, JS_ERR_TAG_SIZE);

  aead_final(ctx, mac);

  ok = aead_verify(mac, tag);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_aead_static_encrypt(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[16];
  const uint8_t *key, *iv, *aad;
  size_t key_len, iv_len, aad_len;
  uint8_t *msg;
  size_t msg_len;
  aead_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&iv, &iv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&aad, &aad_len) == napi_ok);

  JS_ASSERT(key_len >= 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(iv_len == 8 || iv_len == 12 || iv_len == 16
         || iv_len == 24 || iv_len == 28 || iv_len == 32, JS_ERR_IV_SIZE);

  aead_init(&ctx, key, iv, iv_len);
  aead_aad(&ctx, aad, aad_len);
  aead_encrypt(&ctx, msg, msg, msg_len);
  aead_final(&ctx, out);

  cleanse(&ctx, sizeof(aead_t));

  CHECK(napi_create_buffer_copy(env, 16, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_aead_static_decrypt(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t mac[16];
  const uint8_t *key, *iv, *tag, *aad;
  size_t key_len, iv_len, tag_len, aad_len;
  uint8_t *msg;
  size_t msg_len;
  aead_t ctx;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&iv, &iv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&tag, &tag_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&aad, &aad_len) == napi_ok);

  JS_ASSERT(key_len >= 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(iv_len == 8 || iv_len == 12 || iv_len == 16
         || iv_len == 24 || iv_len == 28 || iv_len == 32, JS_ERR_IV_SIZE);
  JS_ASSERT(tag_len == 16, JS_ERR_TAG_SIZE);

  aead_init(&ctx, key, iv, iv_len);
  aead_aad(&ctx, aad, aad_len);
  aead_decrypt(&ctx, msg, msg, msg_len);
  aead_final(&ctx, mac);

  cleanse(&ctx, sizeof(aead_t));

  ok = aead_verify(mac, tag);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_aead_static_auth(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t mac[16];
  const uint8_t *key, *iv, *msg, *tag, *aad;
  size_t key_len, iv_len, msg_len, tag_len, aad_len;
  aead_t ctx;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&iv, &iv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&tag, &tag_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&aad, &aad_len) == napi_ok);

  JS_ASSERT(key_len >= 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(iv_len == 8 || iv_len == 12 || iv_len == 16
         || iv_len == 24 || iv_len == 28 || iv_len == 32, JS_ERR_IV_SIZE);
  JS_ASSERT(tag_len == 16, JS_ERR_TAG_SIZE);

  aead_init(&ctx, key, iv, iv_len);
  aead_aad(&ctx, aad, aad_len);
  aead_auth(&ctx, msg, msg_len);
  aead_final(&ctx, mac);

  cleanse(&ctx, sizeof(aead_t));

  ok = aead_verify(mac, tag);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

/*
 * Base16
 */

static napi_value
bcrypto_base16_encode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *out;
  size_t out_len;
  const uint8_t *data;
  size_t data_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len <= 0x7fffffff, JS_ERR_ENCODE);

  out_len = base16_encode_size(data_len);

  JS_ASSERT(out_len <= MAX_STRING_LENGTH, JS_ERR_ALLOC);

  out = (char *)bcrypto_malloc(out_len + 1);

  JS_ASSERT(out != NULL, JS_ERR_ALLOC);

  base16_encode(out, &out_len, data, data_len);

  if (napi_create_string_latin1(env, out, out_len, &result) != napi_ok)
    goto fail;

  bcrypto_free(out);

  return result;
fail:
  bcrypto_free(out);
  JS_THROW(JS_ERR_ENCODE);
}

static napi_value
bcrypto_base16_decode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t *out;
  size_t out_len;
  char *str;
  size_t str_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  out_len = base16_decode_size(str_len);

  if (out_len > MAX_BUFFER_LENGTH)
    goto fail;

  if (napi_create_buffer(env, out_len, (void **)&out, &result) != napi_ok)
    goto fail;

  if (!base16_decode(out, &out_len, str, str_len))
    goto fail;

  bcrypto_free(str);

  return result;
fail:
  bcrypto_free(str);
  JS_THROW(JS_ERR_DECODE);
}

static napi_value
bcrypto_base16_test(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *str;
  size_t str_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  ok = base16_test(str, str_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(str);

  return result;
}

/*
 * Base16 (Little Endian)
 */

static napi_value
bcrypto_base16le_encode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *out;
  size_t out_len;
  const uint8_t *data;
  size_t data_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len <= 0x7fffffff, JS_ERR_ENCODE);

  out_len = base16le_encode_size(data_len);

  JS_ASSERT(out_len <= MAX_STRING_LENGTH, JS_ERR_ALLOC);

  out = (char *)bcrypto_malloc(out_len + 1);

  JS_ASSERT(out != NULL, JS_ERR_ALLOC);

  base16le_encode(out, &out_len, data, data_len);

  if (napi_create_string_latin1(env, out, out_len, &result) != napi_ok)
    goto fail;

  bcrypto_free(out);

  return result;
fail:
  bcrypto_free(out);
  JS_THROW(JS_ERR_ENCODE);
}

static napi_value
bcrypto_base16le_decode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t *out;
  size_t out_len;
  char *str;
  size_t str_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  out_len = base16le_decode_size(str_len);

  if (out_len > MAX_BUFFER_LENGTH)
    goto fail;

  if (napi_create_buffer(env, out_len, (void **)&out, &result) != napi_ok)
    goto fail;

  if (!base16le_decode(out, &out_len, str, str_len))
    goto fail;

  bcrypto_free(str);

  return result;
fail:
  bcrypto_free(str);
  JS_THROW(JS_ERR_DECODE);
}

static napi_value
bcrypto_base16le_test(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *str;
  size_t str_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  ok = base16le_test(str, str_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(str);

  return result;
}

/*
 * Base32
 */

static napi_value
bcrypto_base32_encode(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  char *out;
  size_t out_len;
  const uint8_t *data;
  size_t data_len;
  bool pad;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[1], &pad) == napi_ok);

  JS_ASSERT(data_len <= 0x7fffffff, JS_ERR_ENCODE);

  out_len = base32_encode_size(data_len, pad);

  JS_ASSERT(out_len <= MAX_STRING_LENGTH, JS_ERR_ALLOC);

  out = (char *)bcrypto_malloc(out_len + 1);

  JS_ASSERT(out != NULL, JS_ERR_ALLOC);

  base32_encode(out, &out_len, data, data_len, pad);

  if (napi_create_string_latin1(env, out, out_len, &result) != napi_ok)
    goto fail;

  bcrypto_free(out);

  return result;
fail:
  bcrypto_free(out);
  JS_THROW(JS_ERR_ENCODE);
}

static napi_value
bcrypto_base32_decode(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *out;
  size_t out_len;
  char *str;
  size_t str_len;
  bool unpad;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  CHECK(napi_get_value_bool(env, argv[1], &unpad) == napi_ok);

  out_len = base32_decode_size(str, str_len);

  if (out_len > MAX_BUFFER_LENGTH)
    goto fail;

  if (napi_create_buffer(env, out_len, (void **)&out, &result) != napi_ok)
    goto fail;

  if (!base32_decode(out, &out_len, str, str_len, unpad))
    goto fail;

  bcrypto_free(str);

  return result;
fail:
  bcrypto_free(str);
  JS_THROW(JS_ERR_DECODE);
}

static napi_value
bcrypto_base32_test(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  char *str;
  size_t str_len;
  bool unpad;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  CHECK(napi_get_value_bool(env, argv[1], &unpad) == napi_ok);

  ok = base32_test(str, str_len, unpad);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(str);

  return result;
}

/*
 * Base32-Hex
 */

static napi_value
bcrypto_base32hex_encode(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  char *out;
  size_t out_len;
  const uint8_t *data;
  size_t data_len;
  bool pad;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[1], &pad) == napi_ok);

  JS_ASSERT(data_len <= 0x7fffffff, JS_ERR_ENCODE);

  out_len = base32hex_encode_size(data_len, pad);

  JS_ASSERT(out_len <= MAX_STRING_LENGTH, JS_ERR_ALLOC);

  out = (char *)bcrypto_malloc(out_len + 1);

  JS_ASSERT(out != NULL, JS_ERR_ALLOC);

  base32hex_encode(out, &out_len, data, data_len, pad);

  if (napi_create_string_latin1(env, out, out_len, &result) != napi_ok)
    goto fail;

  bcrypto_free(out);

  return result;
fail:
  bcrypto_free(out);
  JS_THROW(JS_ERR_ENCODE);
}

static napi_value
bcrypto_base32hex_decode(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *out;
  size_t out_len;
  char *str;
  size_t str_len;
  bool unpad;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  CHECK(napi_get_value_bool(env, argv[1], &unpad) == napi_ok);

  out_len = base32hex_decode_size(str, str_len);

  if (out_len > MAX_BUFFER_LENGTH)
    goto fail;

  if (napi_create_buffer(env, out_len, (void **)&out, &result) != napi_ok)
    goto fail;

  if (!base32hex_decode(out, &out_len, str, str_len, unpad))
    goto fail;

  bcrypto_free(str);

  return result;
fail:
  bcrypto_free(str);
  JS_THROW(JS_ERR_DECODE);
}

static napi_value
bcrypto_base32hex_test(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  char *str;
  size_t str_len;
  bool unpad;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  CHECK(napi_get_value_bool(env, argv[1], &unpad) == napi_ok);

  ok = base32hex_test(str, str_len, unpad);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(str);

  return result;
}

/*
 * Base58
 */

static napi_value
bcrypto_base58_encode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *out;
  size_t out_len;
  const uint8_t *data;
  size_t data_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len <= 0x7fffffff, JS_ERR_ENCODE);

  out_len = BASE58_ENCODE_SIZE(data_len);

  JS_ASSERT(out_len <= MAX_STRING_LENGTH, JS_ERR_ALLOC);

  out = (char *)bcrypto_malloc(out_len + 1);

  JS_ASSERT(out != NULL, JS_ERR_ALLOC);

  if (!base58_encode(out, &out_len, data, data_len))
    goto fail;

  if (napi_create_string_latin1(env, out, out_len, &result) != napi_ok)
    goto fail;

  bcrypto_free(out);

  return result;
fail:
  bcrypto_free(out);
  JS_THROW(JS_ERR_ENCODE);
}

static napi_value
bcrypto_base58_decode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t *out;
  size_t out_len;
  char *str;
  size_t str_len;
  napi_value ab, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  if (str_len > 0xffffffff)
    goto fail;

  out_len = BASE58_DECODE_SIZE(str_len);

  if (out_len > MAX_BUFFER_LENGTH)
    goto fail;

  if (napi_create_arraybuffer(env, out_len, (void **)&out, &ab) != napi_ok)
    goto fail;

  if (!base58_decode(out, &out_len, str, str_len))
    goto fail;

  CHECK(napi_create_typedarray(env, napi_uint8_array, out_len,
                               ab, 0, &result) == napi_ok);

  bcrypto_free(str);

  return result;
fail:
  bcrypto_free(str);
  JS_THROW(JS_ERR_DECODE);
}

static napi_value
bcrypto_base58_test(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *str;
  size_t str_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  ok = base58_test(str, str_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(str);

  return result;
}

/*
 * Base64
 */

static napi_value
bcrypto_base64_encode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *out;
  size_t out_len;
  const uint8_t *data;
  size_t data_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len <= 0x7fffffff, JS_ERR_ENCODE);

  out_len = base64_encode_size(data_len);

  JS_ASSERT(out_len <= MAX_STRING_LENGTH, JS_ERR_ALLOC);

  out = (char *)bcrypto_malloc(out_len + 1);

  JS_ASSERT(out != NULL, JS_ERR_ALLOC);

  base64_encode(out, &out_len, data, data_len);

  if (napi_create_string_latin1(env, out, out_len, &result) != napi_ok)
    goto fail;

  bcrypto_free(out);

  return result;
fail:
  bcrypto_free(out);
  JS_THROW(JS_ERR_ENCODE);
}

static napi_value
bcrypto_base64_decode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t *out;
  size_t out_len;
  char *str;
  size_t str_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  out_len = base64_decode_size(str, str_len);

  if (out_len > MAX_BUFFER_LENGTH)
    goto fail;

  if (napi_create_buffer(env, out_len, (void **)&out, &result) != napi_ok)
    goto fail;

  if (!base64_decode(out, &out_len, str, str_len))
    goto fail;

  bcrypto_free(str);

  return result;
fail:
  bcrypto_free(str);
  JS_THROW(JS_ERR_DECODE);
}

static napi_value
bcrypto_base64_test(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *str;
  size_t str_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  ok = base64_test(str, str_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(str);

  return result;
}

/*
 * Base64-URL
 */

static napi_value
bcrypto_base64url_encode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *out;
  size_t out_len;
  const uint8_t *data;
  size_t data_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len <= 0x7fffffff, JS_ERR_ENCODE);

  out_len = base64url_encode_size(data_len);

  JS_ASSERT(out_len <= MAX_STRING_LENGTH, JS_ERR_ALLOC);

  out = (char *)bcrypto_malloc(out_len + 1);

  JS_ASSERT(out != NULL, JS_ERR_ALLOC);

  base64url_encode(out, &out_len, data, data_len);

  if (napi_create_string_latin1(env, out, out_len, &result) != napi_ok)
    goto fail;

  bcrypto_free(out);

  return result;
fail:
  bcrypto_free(out);
  JS_THROW(JS_ERR_ENCODE);
}

static napi_value
bcrypto_base64url_decode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t *out;
  size_t out_len;
  char *str;
  size_t str_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  out_len = base64url_decode_size(str, str_len);

  if (out_len > MAX_BUFFER_LENGTH)
    goto fail;

  if (napi_create_buffer(env, out_len, (void **)&out, &result) != napi_ok)
    goto fail;

  if (!base64url_decode(out, &out_len, str, str_len))
    goto fail;

  bcrypto_free(str);

  return result;
fail:
  bcrypto_free(str);
  JS_THROW(JS_ERR_DECODE);
}

static napi_value
bcrypto_base64url_test(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char *str;
  size_t str_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);

  JS_CHECK_ALLOC(read_value_string_latin1(env, argv[0], &str, &str_len));

  ok = base64url_test(str, str_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(str);

  return result;
}

/*
 * Bcrypt
 */

static napi_value
bcrypto_bcrypt_hash192(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[24];
  uint32_t rounds;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &rounds) == napi_ok);

  JS_ASSERT(rounds >= 4 && rounds <= 31, JS_ERR_DERIVE);

  bcrypt_hash192(out, pass, pass_len, salt, salt_len, rounds);

  CHECK(napi_create_buffer_copy(env, 24, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_bcrypt_hash256(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  uint32_t rounds;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &rounds) == napi_ok);

  JS_ASSERT(rounds >= 4 && rounds <= 31, JS_ERR_DERIVE);

  bcrypt_hash256(out, pass, pass_len, salt, salt_len, rounds);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_bcrypt_pbkdf(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t *out;
  uint32_t rounds, out_len;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &rounds) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  JS_ASSERT(bcrypt_pbkdf(out, pass, pass_len, salt, salt_len, rounds, out_len),
            JS_ERR_DERIVE);

  return result;
}

typedef struct bcrypto_bcrypt_worker_s {
  uint8_t *pass;
  size_t pass_len;
  uint8_t *salt;
  size_t salt_len;
  uint32_t rounds;
  uint8_t *out;
  uint32_t out_len;
  const char *error;
  napi_async_work work;
  napi_deferred deferred;
} bcrypto_bcrypt_worker_t;

static void
bcrypto_bcrypt_execute_(napi_env env, void *data) {
  bcrypto_bcrypt_worker_t *w = (bcrypto_bcrypt_worker_t *)data;

  if (!bcrypt_pbkdf(w->out, w->pass, w->pass_len,
                            w->salt, w->salt_len,
                            w->rounds, w->out_len)) {
    w->error = JS_ERR_DERIVE;
  }

  cleanse(w->pass, w->pass_len);
  cleanse(w->salt, w->salt_len);
}

static void
bcrypto_bcrypt_complete_(napi_env env, napi_status status, void *data) {
  bcrypto_bcrypt_worker_t *w = (bcrypto_bcrypt_worker_t *)data;
  napi_value result, strval, errval;

  if (w->error == NULL && status == napi_ok)
    status = napi_create_buffer_copy(env, w->out_len, w->out, NULL, &result);

  if (status != napi_ok)
    w->error = JS_ERR_DERIVE;

  if (w->error == NULL) {
    CHECK(napi_resolve_deferred(env, w->deferred, result) == napi_ok);
  } else {
    CHECK(napi_create_string_latin1(env, w->error, NAPI_AUTO_LENGTH,
                                    &strval) == napi_ok);
    CHECK(napi_create_error(env, NULL, strval, &errval) == napi_ok);
    CHECK(napi_reject_deferred(env, w->deferred, errval) == napi_ok);
  }

  CHECK(napi_delete_async_work(env, w->work) == napi_ok);

  bcrypto_free(w->pass);
  bcrypto_free(w->salt);
  bcrypto_free(w->out);
  bcrypto_free(w);
}

static napi_value
bcrypto_bcrypt_pbkdf_async(napi_env env, napi_callback_info info) {
  bcrypto_bcrypt_worker_t *worker;
  napi_value argv[4];
  size_t argc = 4;
  uint8_t *out;
  uint32_t rounds, out_len;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value workname, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &rounds) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  out = (uint8_t *)bcrypto_malloc(out_len);

  JS_ASSERT(out != NULL || out_len == 0, JS_ERR_ALLOC);

  worker = (bcrypto_bcrypt_worker_t *)bcrypto_xmalloc(sizeof(bcrypto_bcrypt_worker_t));
  worker->pass = (uint8_t *)bcrypto_malloc(pass_len);
  worker->pass_len = pass_len;
  worker->salt = (uint8_t *)bcrypto_malloc(salt_len);
  worker->salt_len = salt_len;
  worker->rounds = rounds;
  worker->out = out;
  worker->out_len = out_len;
  worker->error = NULL;

  if ((worker->pass == NULL && pass_len != 0)
      || (worker->salt == NULL && salt_len != 0)) {
    bcrypto_free(worker->pass);
    bcrypto_free(worker->salt);
    bcrypto_free(worker->out);
    bcrypto_free(worker);
    JS_THROW(JS_ERR_DERIVE);
  }

  memcpy(worker->pass, pass, pass_len);
  memcpy(worker->salt, salt, salt_len);

  CHECK(napi_create_string_latin1(env, "bcrypto:bcrypt_pbkdf",
                                  NAPI_AUTO_LENGTH, &workname) == napi_ok);

  CHECK(napi_create_promise(env, &worker->deferred, &result) == napi_ok);

  CHECK(napi_create_async_work(env,
                               NULL,
                               workname,
                               bcrypto_bcrypt_execute_,
                               bcrypto_bcrypt_complete_,
                               worker,
                               &worker->work) == napi_ok);

  CHECK(napi_queue_async_work(env, worker->work) == napi_ok);

  return result;
}

static napi_value
bcrypto_bcrypt_derive(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[31];
  uint32_t rounds, minor;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &rounds) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &minor) == napi_ok);

  JS_ASSERT(bcrypt_derive(out, pass, pass_len, salt, salt_len, rounds, minor),
            JS_ERR_DERIVE);

  CHECK(napi_create_buffer_copy(env, 31, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_bcrypt_generate(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  char out[62];
  uint32_t rounds, minor;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &rounds) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &minor) == napi_ok);

  JS_ASSERT(bcrypt_generate(out, pass, pass_len, salt, salt_len, rounds, minor),
            JS_ERR_DERIVE);

  CHECK(napi_create_string_latin1(env, out, NAPI_AUTO_LENGTH,
                                  &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_bcrypt_generate_with_salt64(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  char out[62];
  uint32_t rounds, minor;
  const uint8_t *pass;
  char salt[23 + 1];
  size_t pass_len, salt_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_value_string_latin1(env, argv[1], salt, sizeof(salt),
                                     &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &rounds) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &minor) == napi_ok);

  JS_ASSERT(salt_len != sizeof(salt) - 1, JS_ERR_DERIVE);

  ok = bcrypt_generate_with_salt64(out, pass, pass_len, salt, rounds, minor);

  JS_ASSERT(ok, JS_ERR_DERIVE);

  CHECK(napi_create_string_latin1(env, out, NAPI_AUTO_LENGTH,
                                  &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_bcrypt_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pass;
  char record[62 + 1];
  size_t pass_len, record_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_value_string_latin1(env, argv[1], record, sizeof(record),
                                     &record_len) == napi_ok);

  ok = record_len != sizeof(record) - 1
    && bcrypt_verify(pass, pass_len, record);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

/*
 * Bech32
 */

static napi_value
bcrypto_bech32_serialize(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  char str[BECH32_MAX_SERIALIZE_SIZE + 1];
  char hrp[BECH32_MAX_HRP_SIZE + 2];
  const uint8_t *data;
  size_t hrp_len, data_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_string_latin1(env, argv[0], hrp, sizeof(hrp),
                                     &hrp_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(hrp_len != sizeof(hrp) - 1, JS_ERR_ENCODE);
  JS_ASSERT(hrp_len == strlen(hrp), JS_ERR_ENCODE);
  JS_ASSERT(bech32_serialize(str, hrp, data, data_len), JS_ERR_ENCODE);

  CHECK(napi_create_string_latin1(env, str, NAPI_AUTO_LENGTH,
                                  &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_bech32_deserialize(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char hrp[BECH32_MAX_HRP_SIZE + 1];
  uint8_t data[BECH32_MAX_DESERIALIZE_SIZE];
  char str[BECH32_MAX_SERIALIZE_SIZE + 2];
  size_t data_len, str_len;
  napi_value hrpval, dataval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_string_latin1(env, argv[0], str, sizeof(str),
                                     &str_len) == napi_ok);

  JS_ASSERT(str_len != sizeof(str) - 1, JS_ERR_ENCODE);
  JS_ASSERT(str_len == strlen(str), JS_ERR_ENCODE);
  JS_ASSERT(bech32_deserialize(hrp, data, &data_len, str), JS_ERR_ENCODE);

  CHECK(napi_create_string_latin1(env, hrp, NAPI_AUTO_LENGTH,
                                  &hrpval) == napi_ok);

  CHECK(napi_create_buffer_copy(env, data_len, data, NULL,
                                &dataval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, hrpval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, dataval) == napi_ok);

  return result;
}

static napi_value
bcrypto_bech32_is(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char str[BECH32_MAX_SERIALIZE_SIZE + 2];
  size_t str_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_string_latin1(env, argv[0], str, sizeof(str),
                                     &str_len) == napi_ok);

  ok = str_len != sizeof(str) - 1
    && str_len == strlen(str)
    && bech32_is(str);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_bech32_convert_bits(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t *out;
  size_t out_len;
  const uint8_t *data;
  size_t data_len;
  uint32_t srcbits, dstbits;
  bool pad;
  napi_value result;
  size_t tmp_len = 0;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &srcbits) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &dstbits) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[3], &pad) == napi_ok);

  JS_ASSERT(data_len < ((size_t)1 << 28), JS_ERR_ENCODE);
  JS_ASSERT(srcbits >= 1 && srcbits <= 8, JS_ERR_ENCODE);
  JS_ASSERT(dstbits >= 1 && dstbits <= 8, JS_ERR_ENCODE);

  out_len = BECH32_CONVERT_SIZE(data_len, srcbits, dstbits, (size_t)pad);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  ok = bech32_convert_bits(out, &tmp_len, dstbits,
                           data, data_len, srcbits, pad);

  JS_ASSERT(ok, JS_ERR_ENCODE);

  CHECK(tmp_len == out_len);

  return result;
}

static napi_value
bcrypto_bech32_encode(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  char addr[BECH32_MAX_ENCODE_SIZE + 1];
  char hrp[BECH32_MAX_HRP_SIZE + 2];
  size_t hrp_len;
  uint32_t version;
  const uint8_t *data;
  size_t data_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_string_latin1(env, argv[0], hrp, sizeof(hrp),
                                     &hrp_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &version) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(hrp_len != sizeof(hrp) - 1, JS_ERR_ENCODE);
  JS_ASSERT(hrp_len == strlen(hrp), JS_ERR_ENCODE);
  JS_ASSERT(bech32_encode(addr, hrp, version, data, data_len), JS_ERR_ENCODE);

  CHECK(napi_create_string_latin1(env, addr, NAPI_AUTO_LENGTH,
                                  &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_bech32_decode(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char hrp[BECH32_MAX_HRP_SIZE + 1];
  unsigned int version;
  uint8_t data[BECH32_MAX_DECODE_SIZE];
  char addr[BECH32_MAX_ENCODE_SIZE + 2];
  size_t data_len, addr_len;
  napi_value hrpval, versionval, dataval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_string_latin1(env, argv[0], addr, sizeof(addr),
                                     &addr_len) == napi_ok);

  JS_ASSERT(addr_len != sizeof(addr) - 1, JS_ERR_ENCODE);
  JS_ASSERT(addr_len == strlen(addr), JS_ERR_ENCODE);

  JS_ASSERT(bech32_decode(hrp, &version, data, &data_len, addr), JS_ERR_ENCODE);

  CHECK(napi_create_string_latin1(env, hrp, NAPI_AUTO_LENGTH,
                                  &hrpval) == napi_ok);

  CHECK(napi_create_uint32(env, version, &versionval) == napi_ok);

  CHECK(napi_create_buffer_copy(env, data_len, data, NULL,
                                &dataval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 3, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, hrpval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, versionval) == napi_ok);
  CHECK(napi_set_element(env, result, 2, dataval) == napi_ok);

  return result;
}

static napi_value
bcrypto_bech32_test(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  char addr[BECH32_MAX_ENCODE_SIZE + 2];
  size_t addr_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_string_latin1(env, argv[0], addr, sizeof(addr),
                                     &addr_len) == napi_ok);

  ok = addr_len != sizeof(addr) - 1
    && addr_len == strlen(addr)
    && bech32_test(addr);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

/*
 * BLAKE2b
 */

static void
bcrypto_blake2b_destroy(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_blake2b_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_blake2b_create(napi_env env, napi_callback_info info) {
  bcrypto_blake2b_t *blake =
    (bcrypto_blake2b_t *)bcrypto_xmalloc(sizeof(bcrypto_blake2b_t));
  napi_value handle;

  blake->started = 0;

  CHECK(napi_create_external(env,
                             blake,
                             bcrypto_blake2b_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_blake2b_init(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint32_t out_len;
  const uint8_t *key;
  size_t key_len;
  bcrypto_blake2b_t *blake;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&blake) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(out_len != 0 && out_len <= 64, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(key_len <= 64, JS_ERR_KEY_SIZE);

  blake2b_init(&blake->ctx, out_len, key, key_len);
  blake->started = 1;

  return argv[0];
}

static napi_value
bcrypto_blake2b_update(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *in;
  size_t in_len;
  bcrypto_blake2b_t *blake;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&blake) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(blake->started, JS_ERR_INIT);

  blake2b_update(&blake->ctx, in, in_len);

  return argv[0];
}

static napi_value
bcrypto_blake2b_final(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[64];
  size_t out_len;
  bcrypto_blake2b_t *blake;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&blake) == napi_ok);

  JS_ASSERT(blake->started, JS_ERR_INIT);

  out_len = blake->ctx.outlen;

  blake2b_final(&blake->ctx, out);
  blake->started = 0;

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_blake2b_digest(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[64];
  const uint8_t *in, *key;
  size_t in_len, key_len;
  uint32_t out_len;
  blake2b_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&in, &in_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(out_len != 0 && out_len <= 64, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(key_len <= 64, JS_ERR_KEY_SIZE);

  blake2b_init(&ctx, out_len, key, key_len);
  blake2b_update(&ctx, in, in_len);
  blake2b_final(&ctx, out);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_blake2b_root(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[64];
  const uint8_t *left, *right, *key;
  size_t left_len, right_len, key_len;
  uint32_t out_len;
  blake2b_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&left,
                             &left_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&right,
                             &right_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(out_len != 0 && out_len <= 64, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(key_len <= 64, JS_ERR_KEY_SIZE);
  JS_ASSERT(left_len == out_len && right_len == out_len, JS_ERR_NODE_SIZE);

  blake2b_init(&ctx, out_len, key, key_len);
  blake2b_update(&ctx, left, left_len);
  blake2b_update(&ctx, right, right_len);
  blake2b_final(&ctx, out);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_blake2b_multi(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[64];
  const uint8_t *x, *y, *z, *key;
  size_t x_len, y_len, z_len, key_len;
  uint32_t out_len;
  blake2b_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&x, &x_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&y, &y_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&z, &z_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(out_len != 0 && out_len <= 64, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(key_len <= 64, JS_ERR_KEY_SIZE);

  blake2b_init(&ctx, out_len, key, key_len);
  blake2b_update(&ctx, x, x_len);
  blake2b_update(&ctx, y, y_len);
  blake2b_update(&ctx, z, z_len);
  blake2b_final(&ctx, out);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

/*
 * BLAKE2s
 */

static void
bcrypto_blake2s_destroy(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_blake2s_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_blake2s_create(napi_env env, napi_callback_info info) {
  bcrypto_blake2s_t *blake =
    (bcrypto_blake2s_t *)bcrypto_xmalloc(sizeof(bcrypto_blake2s_t));
  napi_value handle;

  blake->started = 0;

  CHECK(napi_create_external(env,
                             blake,
                             bcrypto_blake2s_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_blake2s_init(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint32_t out_len;
  const uint8_t *key;
  size_t key_len;
  bcrypto_blake2s_t *blake;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&blake) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(out_len != 0 && out_len <= 64, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(key_len <= 64, JS_ERR_KEY_SIZE);

  blake2s_init(&blake->ctx, out_len, key, key_len);
  blake->started = 1;

  return argv[0];
}

static napi_value
bcrypto_blake2s_update(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *in;
  size_t in_len;
  bcrypto_blake2s_t *blake;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&blake) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(blake->started, JS_ERR_INIT);

  blake2s_update(&blake->ctx, in, in_len);

  return argv[0];
}

static napi_value
bcrypto_blake2s_final(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[64];
  size_t out_len;
  bcrypto_blake2s_t *blake;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&blake) == napi_ok);

  JS_ASSERT(blake->started, JS_ERR_INIT);

  out_len = blake->ctx.outlen;

  blake2s_final(&blake->ctx, out);
  blake->started = 0;

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_blake2s_digest(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[64];
  const uint8_t *in, *key;
  size_t in_len, key_len;
  uint32_t out_len;
  blake2s_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&in, &in_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(out_len != 0 && out_len <= 64, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(key_len <= 64, JS_ERR_KEY_SIZE);

  blake2s_init(&ctx, out_len, key, key_len);
  blake2s_update(&ctx, in, in_len);
  blake2s_final(&ctx, out);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_blake2s_root(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[64];
  const uint8_t *left, *right, *key;
  size_t left_len, right_len, key_len;
  uint32_t out_len;
  blake2s_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&left,
                             &left_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&right,
                             &right_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(out_len != 0 && out_len <= 64, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(key_len <= 64, JS_ERR_KEY_SIZE);
  JS_ASSERT(left_len == out_len && right_len == out_len, JS_ERR_NODE_SIZE);

  blake2s_init(&ctx, out_len, key, key_len);
  blake2s_update(&ctx, left, left_len);
  blake2s_update(&ctx, right, right_len);
  blake2s_final(&ctx, out);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_blake2s_multi(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[64];
  const uint8_t *x, *y, *z, *key;
  size_t x_len, y_len, z_len, key_len;
  uint32_t out_len;
  blake2s_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&x, &x_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&y, &y_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&z, &z_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(out_len != 0 && out_len <= 64, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(key_len <= 64, JS_ERR_KEY_SIZE);

  blake2s_init(&ctx, out_len, key, key_len);
  blake2s_update(&ctx, x, x_len);
  blake2s_update(&ctx, y, y_len);
  blake2s_update(&ctx, z, z_len);
  blake2s_final(&ctx, out);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

/*
 * Cash32
 */

static napi_value
bcrypto_cash32_serialize(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  char str[CASH32_MAX_SERIALIZE_SIZE + 1];
  char prefix[CASH32_MAX_PREFIX_SIZE + 2];
  size_t prefix_len;
  const uint8_t *data;
  size_t data_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_string_latin1(env, argv[0], prefix, sizeof(prefix),
                                     &prefix_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(prefix_len != sizeof(prefix) - 1, JS_ERR_ENCODE);
  JS_ASSERT(prefix_len == strlen(prefix), JS_ERR_ENCODE);

  JS_ASSERT(cash32_serialize(str, prefix, data, data_len), JS_ERR_ENCODE);

  CHECK(napi_create_string_latin1(env, str, NAPI_AUTO_LENGTH,
                                  &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_cash32_deserialize(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  char prefix[CASH32_MAX_PREFIX_SIZE + 1];
  uint8_t data[CASH32_MAX_DESERIALIZE_SIZE];
  char str[CASH32_MAX_SERIALIZE_SIZE + 2];
  char fallback[CASH32_MAX_PREFIX_SIZE + 2];
  size_t data_len, str_len, fallback_len;
  napi_value preval, dataval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_string_latin1(env, argv[0], str, sizeof(str),
                                     &str_len) == napi_ok);
  CHECK(napi_get_value_string_latin1(env, argv[1], fallback, sizeof(fallback),
                                     &fallback_len) == napi_ok);

  JS_ASSERT(str_len != sizeof(str) - 1, JS_ERR_ENCODE);
  JS_ASSERT(str_len == strlen(str), JS_ERR_ENCODE);
  JS_ASSERT(fallback_len != sizeof(fallback) - 1, JS_ERR_ENCODE);
  JS_ASSERT(fallback_len == strlen(fallback), JS_ERR_ENCODE);

  JS_ASSERT(cash32_deserialize(prefix, data, &data_len, str, fallback),
            JS_ERR_ENCODE);

  CHECK(napi_create_string_latin1(env, prefix, NAPI_AUTO_LENGTH,
                                  &preval) == napi_ok);

  CHECK(napi_create_buffer_copy(env, data_len, data, NULL,
                                &dataval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, preval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, dataval) == napi_ok);

  return result;
}

static napi_value
bcrypto_cash32_is(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  char str[CASH32_MAX_SERIALIZE_SIZE + 2];
  char fallback[CASH32_MAX_PREFIX_SIZE + 2];
  size_t str_len, fallback_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_string_latin1(env, argv[0], str, sizeof(str),
                                     &str_len) == napi_ok);
  CHECK(napi_get_value_string_latin1(env, argv[1], fallback, sizeof(fallback),
                                     &fallback_len) == napi_ok);

  ok = str_len != sizeof(str) - 1
    && str_len == strlen(str)
    && fallback_len != sizeof(fallback) - 1
    && fallback_len == strlen(fallback)
    && cash32_is(str, fallback);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_cash32_convert_bits(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t *out;
  size_t out_len;
  const uint8_t *data;
  size_t data_len;
  uint32_t srcbits, dstbits;
  bool pad;
  napi_value result;
  size_t tmp_len = 0;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &srcbits) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &dstbits) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[3], &pad) == napi_ok);

  JS_ASSERT(data_len < ((size_t)1 << 28), JS_ERR_ENCODE);
  JS_ASSERT(srcbits >= 1 && srcbits <= 8, JS_ERR_ENCODE);
  JS_ASSERT(dstbits >= 1 && dstbits <= 8, JS_ERR_ENCODE);

  out_len = CASH32_CONVERT_SIZE(data_len, srcbits, dstbits, (size_t)pad);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  ok = cash32_convert_bits(out, &tmp_len, dstbits,
                           data, data_len, srcbits, pad);

  JS_ASSERT(ok, JS_ERR_ENCODE);

  CHECK(tmp_len == out_len);

  return result;
}

static napi_value
bcrypto_cash32_encode(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  char addr[CASH32_MAX_ENCODE_SIZE + 1];
  char prefix[CASH32_MAX_PREFIX_SIZE + 2];
  size_t prefix_len;
  uint32_t type;
  const uint8_t *data;
  size_t data_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_string_latin1(env, argv[0], prefix, sizeof(prefix),
                                     &prefix_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(prefix_len != sizeof(prefix) - 1, JS_ERR_ENCODE);
  JS_ASSERT(prefix_len == strlen(prefix), JS_ERR_ENCODE);

  JS_ASSERT(cash32_encode(addr, prefix, type, data, data_len), JS_ERR_ENCODE);

  CHECK(napi_create_string_latin1(env, addr, NAPI_AUTO_LENGTH,
                                  &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_cash32_decode(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  unsigned int type;
  uint8_t data[CASH32_MAX_DECODE_SIZE];
  char addr[CASH32_MAX_ENCODE_SIZE + 2];
  char expect[CASH32_MAX_PREFIX_SIZE + 2];
  size_t data_len, addr_len, expect_len;
  napi_value typeval, dataval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_string_latin1(env, argv[0], addr, sizeof(addr),
                                     &addr_len) == napi_ok);
  CHECK(napi_get_value_string_latin1(env, argv[1], expect, sizeof(expect),
                                     &expect_len) == napi_ok);

  JS_ASSERT(addr_len != sizeof(addr) - 1, JS_ERR_ENCODE);
  JS_ASSERT(addr_len == strlen(addr), JS_ERR_ENCODE);
  JS_ASSERT(expect_len != sizeof(expect) - 1, JS_ERR_ENCODE);
  JS_ASSERT(expect_len == strlen(expect), JS_ERR_ENCODE);

  JS_ASSERT(cash32_decode(&type, data, &data_len, addr, expect), JS_ERR_ENCODE);

  CHECK(napi_create_uint32(env, type, &typeval) == napi_ok);

  CHECK(napi_create_buffer_copy(env, data_len, data, NULL,
                                &dataval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, typeval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, dataval) == napi_ok);

  return result;
}

static napi_value
bcrypto_cash32_test(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  char addr[CASH32_MAX_ENCODE_SIZE + 2];
  char expect[CASH32_MAX_PREFIX_SIZE + 2];
  size_t addr_len, expect_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_string_latin1(env, argv[0], addr, sizeof(addr),
                                     &addr_len) == napi_ok);
  CHECK(napi_get_value_string_latin1(env, argv[1], expect, sizeof(expect),
                                     &expect_len) == napi_ok);

  ok = addr_len != sizeof(addr) - 1
    && addr_len == strlen(addr)
    && expect_len != sizeof(expect) - 1
    && expect_len == strlen(expect)
    && cash32_test(addr, expect);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

/*
 * ChaCha20
 */

static void
bcrypto_chacha20_destroy_(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_chacha20_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_chacha20_create(napi_env env, napi_callback_info info) {
  bcrypto_chacha20_t *chacha =
    (bcrypto_chacha20_t *)bcrypto_xmalloc(sizeof(bcrypto_chacha20_t));
  napi_value handle;

  chacha->started = 0;

  CHECK(napi_create_external(env,
                             chacha,
                             bcrypto_chacha20_destroy_,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_chacha20_init(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  const uint8_t *key, *nonce;
  size_t key_len, nonce_len;
  int64_t ctr;
  bcrypto_chacha20_t *chacha;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&chacha) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&nonce,
                             &nonce_len) == napi_ok);
  CHECK(napi_get_value_int64(env, argv[3], &ctr) == napi_ok);

  JS_ASSERT(key_len == 16 || key_len == 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(nonce_len == 8 || nonce_len == 12
         || nonce_len == 16 || nonce_len == 24
         || nonce_len == 28 || nonce_len == 32, JS_ERR_NONCE_SIZE);

  chacha20_init(&chacha->ctx, key, key_len, nonce, nonce_len, ctr);
  chacha->started = 1;

  return argv[0];
}

static napi_value
bcrypto_chacha20_encrypt(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *msg;
  size_t msg_len;
  bcrypto_chacha20_t *chacha;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&chacha) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);

  JS_ASSERT(chacha->started, JS_ERR_INIT);

  chacha20_encrypt(&chacha->ctx, msg, msg, msg_len);

  return argv[1];
}

static napi_value
bcrypto_chacha20_destroy(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_chacha20_t *chacha;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&chacha) == napi_ok);

  chacha->started = 0;

  return argv[0];
}

static napi_value
bcrypto_chacha20_derive(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  const uint8_t *key, *nonce;
  size_t key_len, nonce_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&nonce,
                             &nonce_len) == napi_ok);

  JS_ASSERT(key_len == 16 || key_len == 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(nonce_len == 16, JS_ERR_NONCE_SIZE);

  chacha20_derive(out, key, key_len, nonce);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

/*
 * Cipher
 */

static void
bcrypto_cipher_destroy_(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_cipher_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_cipher_create(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint32_t type, mode;
  bool encrypt;
  bcrypto_cipher_t *cipher;
  napi_value handle;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &mode) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &encrypt) == napi_ok);

  JS_ASSERT(type <= CIPHER_MAX, JS_ERR_CONTEXT);
  JS_ASSERT(mode <= CIPHER_MODE_MAX, JS_ERR_CONTEXT);

  cipher = (bcrypto_cipher_t *)bcrypto_xmalloc(sizeof(bcrypto_cipher_t));
  cipher->type = type;
  cipher->mode = mode;
  cipher->encrypt = encrypt;
  cipher->started = 0;
  cipher->has_tag = 0;

  CHECK(napi_create_external(env,
                             cipher,
                             bcrypto_cipher_destroy_,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_cipher_init(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  const uint8_t *key, *iv;
  size_t key_len, iv_len;
  bcrypto_cipher_t *cipher;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&iv, &iv_len) == napi_ok);

  ok = cipher_stream_init(&cipher->ctx,
                          cipher->type,
                          cipher->mode,
                          cipher->encrypt,
                          key, key_len,
                          iv, iv_len);

  JS_ASSERT(ok, JS_ERR_CONTEXT);

  cipher->started = 1;
  cipher->has_tag = 0;

  return argv[0];
}

static napi_value
bcrypto_cipher_set_padding(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  bool padding;
  bcrypto_cipher_t *cipher;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[1], &padding) == napi_ok);

  JS_ASSERT(cipher->started, JS_ERR_INIT);
  JS_ASSERT(cipher_stream_set_padding(&cipher->ctx, padding), JS_ERR_OPT);

  return argv[0];
}

static napi_value
bcrypto_cipher_set_aad(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *aad;
  size_t aad_len;
  bcrypto_cipher_t *cipher;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&aad, &aad_len) == napi_ok);

  JS_ASSERT(cipher->started, JS_ERR_INIT);
  JS_ASSERT(cipher_stream_set_aad(&cipher->ctx, aad, aad_len), JS_ERR_OPT);

  return argv[0];
}

static napi_value
bcrypto_cipher_set_ccm(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  const uint8_t *aad;
  size_t aad_len;
  uint32_t msg_len, tag_len;
  bcrypto_cipher_t *cipher;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &msg_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &tag_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&aad, &aad_len) == napi_ok);

  JS_ASSERT(cipher->started, JS_ERR_INIT);

  ok = cipher_stream_set_ccm(&cipher->ctx, msg_len, tag_len, aad, aad_len);

  JS_ASSERT(ok, JS_ERR_OPT);

  cipher->started = 1;

  return argv[0];
}


static napi_value
bcrypto_cipher_set_tag(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *tag;
  size_t tag_len;
  bcrypto_cipher_t *cipher;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&tag, &tag_len) == napi_ok);

  JS_ASSERT(cipher->started, JS_ERR_INIT);
  JS_ASSERT(cipher_stream_set_tag(&cipher->ctx, tag, tag_len), JS_ERR_OPT);

  return argv[0];
}

static napi_value
bcrypto_cipher_get_tag(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[16];
  size_t out_len;
  bcrypto_cipher_t *cipher;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);

  JS_ASSERT(cipher->has_tag, JS_ERR_INIT);
  JS_ASSERT(cipher_stream_get_tag(&cipher->ctx, out, &out_len), JS_ERR_GET);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_cipher_update(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *out;
  size_t out_len;
  const uint8_t *in;
  size_t in_len;
  bcrypto_cipher_t *cipher;
  napi_value ab, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(cipher->started, JS_ERR_INIT);

  out_len = cipher_stream_update_size(&cipher->ctx, in_len);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_arraybuffer(env, out_len, (void **)&out, &ab));

  cipher_stream_update(&cipher->ctx, out, &out_len, in, in_len);

  CHECK(napi_create_typedarray(env, napi_uint8_array, out_len,
                               ab, 0, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_cipher_crypt(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t *out;
  const uint8_t *in;
  size_t out_len, in_len;
  bcrypto_cipher_t *cipher;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&out, &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(cipher->started, JS_ERR_INIT);
  JS_ASSERT(out_len == in_len, JS_ERR_CRYPT);

  ok = cipher_stream_crypt(&cipher->ctx, out, in, in_len);

  JS_ASSERT(ok, JS_ERR_CRYPT);

  return argv[1];
}

static napi_value
bcrypto_cipher_final(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[CIPHER_MAX_FINAL_SIZE];
  size_t out_len;
  bcrypto_cipher_t *cipher;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);

  JS_ASSERT(cipher->started, JS_ERR_INIT);
  JS_ASSERT(cipher_stream_final(&cipher->ctx, out, &out_len), JS_ERR_FINAL);

  cipher->started = 0;
  cipher->has_tag = 1;

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_cipher_destroy(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_cipher_t *cipher;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&cipher) == napi_ok);

  cipher->started = 0;

  return argv[0];
}

static napi_value
bcrypto_cipher_encrypt(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t *out;
  size_t out_len;
  uint32_t type, mode;
  const uint8_t *key, *iv, *in;
  size_t key_len, iv_len, in_len;
  napi_value ab, result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &mode) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&iv, &iv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(type <= CIPHER_MAX, JS_ERR_CONTEXT);
  JS_ASSERT(mode <= CIPHER_MODE_MAX, JS_ERR_CONTEXT);

  out_len = CIPHER_MAX_ENCRYPT_SIZE(in_len);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_arraybuffer(env, out_len, (void **)&out, &ab));

  ok = cipher_static_encrypt(out, &out_len,
                             type, mode,
                             key, key_len,
                             iv, iv_len,
                             in, in_len);

  JS_ASSERT(ok, JS_ERR_ENCRYPT);

  CHECK(napi_create_typedarray(env, napi_uint8_array, out_len,
                               ab, 0, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_cipher_decrypt(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t *out;
  size_t out_len;
  uint32_t type, mode;
  const uint8_t *key, *iv, *in;
  size_t key_len, iv_len, in_len;
  napi_value ab, result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &mode) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&iv, &iv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(type <= CIPHER_MAX, JS_ERR_CONTEXT);
  JS_ASSERT(mode <= CIPHER_MODE_MAX, JS_ERR_CONTEXT);

  out_len = CIPHER_MAX_DECRYPT_SIZE(in_len);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_arraybuffer(env, out_len, (void **)&out, &ab));

  ok = cipher_static_decrypt(out, &out_len,
                             type, mode,
                             key, key_len,
                             iv, iv_len,
                             in, in_len);

  JS_ASSERT(ok, JS_ERR_DECRYPT);

  CHECK(napi_create_typedarray(env, napi_uint8_array, out_len,
                               ab, 0, &result) == napi_ok);

  return result;
}

/*
 * Cleanse
 */

static napi_value
bcrypto_cleanse(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t *buf;
  size_t buf_len;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&buf, &buf_len) == napi_ok);

  cleanse(buf, buf_len);

  return argv[0];
}

/*
 * CTR-DRBG
 */

static void
bcrypto_ctr_drbg_destroy(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_ctr_drbg_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_ctr_drbg_create(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t bits;
  bool derivation;
  bcrypto_ctr_drbg_t *drbg;
  napi_value handle;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_uint32(env, argv[0], &bits) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[1], &derivation) == napi_ok);

  JS_ASSERT(bits == 128 || bits == 192 || bits == 256, JS_ERR_ARG);

  drbg = (bcrypto_ctr_drbg_t *)bcrypto_xmalloc(sizeof(bcrypto_ctr_drbg_t));
  drbg->bits = bits;
  drbg->derivation = derivation;
  drbg->started = 0;

  CHECK(napi_create_external(env,
                             drbg,
                             bcrypto_ctr_drbg_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_ctr_drbg_init(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t *nonce, *pers;
  size_t nonce_len, pers_len;
  bcrypto_ctr_drbg_t *drbg;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&drbg) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&nonce,
                             &nonce_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&pers,
                             &pers_len) == napi_ok);

  ctr_drbg_init(&drbg->ctx, drbg->bits, drbg->derivation,
                nonce, nonce_len, pers, pers_len);

  drbg->started = 1;

  return argv[0];
}

static napi_value
bcrypto_ctr_drbg_reseed(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t *nonce, *add;
  size_t nonce_len, add_len;
  bcrypto_ctr_drbg_t *drbg;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&drbg) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&nonce,
                             &nonce_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&add, &add_len) == napi_ok);

  JS_ASSERT(drbg->started, JS_ERR_INIT);

  ctr_drbg_reseed(&drbg->ctx, nonce, nonce_len, add, add_len);

  return argv[0];
}

static napi_value
bcrypto_ctr_drbg_generate(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t *out;
  uint32_t out_len;
  const uint8_t *add;
  size_t add_len;
  bcrypto_ctr_drbg_t *drbg;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&drbg) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&add, &add_len) == napi_ok);

  JS_ASSERT(drbg->started, JS_ERR_INIT);
  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  ctr_drbg_generate(&drbg->ctx, out, out_len, add, add_len);

  return result;
}

/*
 * DSA
 */

static napi_value
bcrypto_dsa_params_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[DSA_MAX_PARAMS_SIZE];
  size_t out_len = DSA_MAX_PARAMS_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(dsa_params_create(out, &out_len, key, key_len), JS_ERR_KEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_params_generate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[DSA_MAX_PARAMS_SIZE];
  size_t out_len = DSA_MAX_PARAMS_SIZE;
  uint32_t bits;
  const uint8_t *entropy;
  size_t entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_uint32(env, argv[0], &bits) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(dsa_params_generate(out, &out_len, bits, entropy), JS_ERR_GENERATE);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

typedef struct bcrypto_dsa_worker_s {
  uint32_t bits;
  uint8_t entropy[ENTROPY_SIZE];
  uint8_t out[DSA_MAX_PARAMS_SIZE];
  size_t out_len;
  const char *error;
  napi_async_work work;
  napi_deferred deferred;
} bcrypto_dsa_worker_t;

static void
bcrypto_dsa_execute_(napi_env env, void *data) {
  bcrypto_dsa_worker_t *w = (bcrypto_dsa_worker_t *)data;

  if (!dsa_params_generate(w->out, &w->out_len, w->bits, w->entropy))
    w->error = JS_ERR_GENERATE;

  cleanse(w->entropy, ENTROPY_SIZE);
}

static void
bcrypto_dsa_complete_(napi_env env, napi_status status, void *data) {
  bcrypto_dsa_worker_t *w = (bcrypto_dsa_worker_t *)data;
  napi_value result, strval, errval;

  if (w->error == NULL && status == napi_ok)
    status = napi_create_buffer_copy(env, w->out_len, w->out, NULL, &result);

  if (status != napi_ok)
    w->error = JS_ERR_GENERATE;

  if (w->error == NULL) {
    CHECK(napi_resolve_deferred(env, w->deferred, result) == napi_ok);
  } else {
    CHECK(napi_create_string_latin1(env, w->error, NAPI_AUTO_LENGTH,
                                    &strval) == napi_ok);
    CHECK(napi_create_error(env, NULL, strval, &errval) == napi_ok);
    CHECK(napi_reject_deferred(env, w->deferred, errval) == napi_ok);
  }

  CHECK(napi_delete_async_work(env, w->work) == napi_ok);

  bcrypto_free(w);
}

static napi_value
bcrypto_dsa_params_generate_async(napi_env env, napi_callback_info info) {
  bcrypto_dsa_worker_t *worker;
  napi_value argv[2];
  size_t argc = 2;
  uint32_t bits;
  const uint8_t *entropy;
  size_t entropy_len;
  napi_value workname, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_uint32(env, argv[0], &bits) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  worker = (bcrypto_dsa_worker_t *)bcrypto_xmalloc(sizeof(bcrypto_dsa_worker_t));
  worker->bits = bits;
  worker->out_len = DSA_MAX_PARAMS_SIZE;
  worker->error = NULL;

  memcpy(worker->entropy, entropy, ENTROPY_SIZE);

  CHECK(napi_create_string_latin1(env, "bcrypto:dsa_params_generate",
                                  NAPI_AUTO_LENGTH, &workname) == napi_ok);

  CHECK(napi_create_promise(env, &worker->deferred, &result) == napi_ok);

  CHECK(napi_create_async_work(env,
                               NULL,
                               workname,
                               bcrypto_dsa_execute_,
                               bcrypto_dsa_complete_,
                               worker,
                               &worker->work) == napi_ok);

  CHECK(napi_queue_async_work(env, worker->work) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_dsa_params_bits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  size_t bits;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  bits = dsa_params_bits(key, key_len);

  JS_ASSERT(bits != 0, JS_ERR_PARAMS);

  CHECK(napi_create_uint32(env, bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_params_qbits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  size_t bits;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  bits = dsa_params_qbits(key, key_len);

  JS_ASSERT(bits != 0, JS_ERR_PARAMS);

  CHECK(napi_create_uint32(env, bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_params_verify(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  const uint8_t *key;
  size_t key_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  ok = dsa_params_verify(key, key_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_params_import(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[DSA_MAX_PARAMS_SIZE];
  size_t out_len = DSA_MAX_PARAMS_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(dsa_params_import(out, &out_len, key, key_len), JS_ERR_PARAMS);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)key, key_len);

  return result;
}

static napi_value
bcrypto_dsa_params_export(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[DSA_MAX_PARAMS_SIZE];
  size_t out_len = DSA_MAX_PARAMS_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(dsa_params_export(out, &out_len, key, key_len), JS_ERR_PARAMS);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_privkey_create(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[DSA_MAX_PRIV_SIZE];
  size_t out_len = DSA_MAX_PRIV_SIZE;
  const uint8_t *key, *entropy;
  size_t key_len, entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(dsa_privkey_create(out, &out_len, key, key_len, entropy),
            JS_ERR_PARAMS);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);
  cleanse(out, out_len);

  return result;
}

static napi_value
bcrypto_dsa_privkey_bits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  size_t bits;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  bits = dsa_privkey_bits(key, key_len);

  JS_ASSERT(bits != 0, JS_ERR_PRIVKEY);

  CHECK(napi_create_uint32(env, bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_privkey_qbits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  size_t bits;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  bits = dsa_privkey_qbits(key, key_len);

  JS_ASSERT(bits != 0, JS_ERR_PRIVKEY);

  CHECK(napi_create_uint32(env, bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_privkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  const uint8_t *key;
  size_t key_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  ok = dsa_privkey_verify(key, key_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_privkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[DSA_MAX_PRIV_SIZE];
  size_t out_len = DSA_MAX_PRIV_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(dsa_privkey_import(out, &out_len, key, key_len), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)key, key_len);
  cleanse(out, out_len);

  return result;
}

static napi_value
bcrypto_dsa_privkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[DSA_MAX_PRIV_SIZE];
  size_t out_len = DSA_MAX_PRIV_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(dsa_privkey_export(out, &out_len, key, key_len), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse(out, out_len);

  return result;
}

static napi_value
bcrypto_dsa_pubkey_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[DSA_MAX_PUB_SIZE];
  size_t out_len = DSA_MAX_PUB_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(dsa_pubkey_create(out, &out_len, key, key_len), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_pubkey_bits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  size_t bits;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  bits = dsa_pubkey_bits(key, key_len);

  JS_ASSERT(bits != 0, JS_ERR_PUBKEY);

  CHECK(napi_create_uint32(env, bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_pubkey_qbits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  size_t bits;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  bits = dsa_pubkey_qbits(key, key_len);

  JS_ASSERT(bits != 0, JS_ERR_PUBKEY);

  CHECK(napi_create_uint32(env, bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_pubkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  const uint8_t *key;
  size_t key_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  ok = dsa_pubkey_verify(key, key_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_pubkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[DSA_MAX_PUB_SIZE];
  size_t out_len = DSA_MAX_PUB_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(dsa_pubkey_import(out, &out_len, key, key_len), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)key, key_len);

  return result;
}

static napi_value
bcrypto_dsa_pubkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[DSA_MAX_PUB_SIZE];
  size_t out_len = DSA_MAX_PUB_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(dsa_pubkey_export(out, &out_len, key, key_len), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_signature_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[DSA_MAX_DER_SIZE];
  size_t out_len = DSA_MAX_DER_SIZE;
  const uint8_t *sig;
  size_t sig_len;
  uint32_t size;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &size) == napi_ok);

  JS_ASSERT(dsa_sig_export(out, &out_len, sig, sig_len, size),
            JS_ERR_SIGNATURE);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_signature_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[DSA_MAX_SIG_SIZE];
  size_t out_len = DSA_MAX_SIG_SIZE;
  const uint8_t *der;
  size_t der_len;
  uint32_t size;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&der, &der_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &size) == napi_ok);

  JS_ASSERT(dsa_sig_import(out, &out_len, der, der_len, size),
            JS_ERR_SIGNATURE);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_sign(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[DSA_MAX_SIG_SIZE];
  size_t out_len = DSA_MAX_SIG_SIZE;
  const uint8_t *msg, *key, *entropy;
  size_t msg_len, key_len, entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(dsa_sign(out, &out_len, msg, msg_len, key, key_len, entropy),
            JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_dsa_sign_der(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[DSA_MAX_DER_SIZE];
  size_t out_len = DSA_MAX_DER_SIZE;
  const uint8_t *msg, *key, *entropy;
  size_t msg_len, key_len, entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(dsa_sign(out, &out_len, msg, msg_len, key, key_len, entropy),
            JS_ERR_SIGN);

  CHECK(dsa_sig_export(out, &out_len, out, out_len, 0));

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_dsa_verify(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  const uint8_t *msg, *sig, *key;
  size_t msg_len, sig_len, key_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  ok = dsa_verify(msg, msg_len, sig, sig_len, key, key_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_verify_der(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t sig[DSA_MAX_SIG_SIZE];
  size_t sig_len = DSA_MAX_SIG_SIZE;
  const uint8_t *msg, *der, *key;
  size_t msg_len, der_len, key_len, size;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&der, &der_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  size = (dsa_pubkey_qbits(key, key_len) + 7) / 8;

  ok = size > 0
    && dsa_sig_import(sig, &sig_len, der, der_len, size)
    && dsa_verify(msg, msg_len, sig, sig_len, key, key_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_dsa_derive(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[DSA_MAX_SIZE];
  size_t out_len = DSA_MAX_SIZE;
  const uint8_t *pub, *priv;
  size_t pub_len, priv_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(dsa_derive(out, &out_len, pub, pub_len, priv, priv_len),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse(out, out_len);

  return result;
}

/*
 * EB2K
 */

static napi_value
bcrypto_eb2k_derive(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t *key, *iv;
  uint32_t type, key_len, iv_len;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value keyval, ivval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &key_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[4], &iv_len) == napi_ok);

  JS_ASSERT(key_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);
  JS_ASSERT(iv_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, key_len, (void **)&key, &keyval));
  JS_CHECK_ALLOC(napi_create_buffer(env, iv_len, (void **)&iv, &ivval));

  if (!eb2k_derive(key, iv, type, pass, pass_len,
                   salt, salt_len, key_len, iv_len)) {
    goto fail;
  }

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, keyval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, ivval) == napi_ok);

  return result;
fail:
  bcrypto_free(key);
  bcrypto_free(iv);
  JS_THROW(JS_ERR_DERIVE);
}

/*
 * ECDH
 */

static napi_value
bcrypto_ecdh_privkey_generate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *entropy;
  size_t entropy_len;
  uint8_t out[ECDH_MAX_PRIV_SIZE];
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  ecdh_privkey_generate(ec->ctx, out, entropy);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_ecdh_privkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  ok = priv_len == ec->scalar_size && ecdh_privkey_verify(ec->ctx, priv);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_privkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDH_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdh_privkey_export(ec->ctx, out, priv), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_privkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDH_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(ecdh_privkey_import(ec->ctx, out, priv, priv_len),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_create(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDH_MAX_PUB_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);

  ecdh_pubkey_create(ec->ctx, out, priv);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_convert(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  size_t out_len;
  const uint8_t *pub;
  size_t pub_len;
  int32_t sign;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[2], &sign) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(ecdh_pubkey_convert(ec->ctx, out, pub, sign), JS_ERR_PUBKEY);

  out_len = ec->field_size + ((ec->field_bits & 7) == 0);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_from_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDH_MAX_PUB_SIZE];
  const uint8_t *data;
  size_t data_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len == ec->field_size, JS_ERR_PREIMAGE_SIZE);

  ecdh_pubkey_from_uniform(ec->ctx, out, data);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_to_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[MONT_MAX_FIELD_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  uint32_t hint;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &hint) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(ecdh_pubkey_to_uniform(ec->ctx, out, pub, hint), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size,
                                out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_from_hash(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDH_MAX_PUB_SIZE];
  const uint8_t *data;
  size_t data_len;
  bool pake;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &pake) == napi_ok);

  JS_ASSERT(data_len == ec->field_size * 2, JS_ERR_PREIMAGE_SIZE);
  JS_ASSERT(ecdh_pubkey_from_hash(ec->ctx, out, data, pake), JS_ERR_PREIMAGE);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_to_hash(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[MONT_MAX_FIELD_SIZE * 2];
  const uint8_t *pub, *entropy;
  size_t pub_len, entropy_len;
  uint32_t subgroup;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &subgroup) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(ecdh_pubkey_to_hash(ec->ctx, out, pub, subgroup, entropy),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size * 2,
                                out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = pub_len == ec->field_size && ecdh_pubkey_verify(ec->ctx, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t x[MONT_MAX_FIELD_SIZE];
  uint8_t y[MONT_MAX_FIELD_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  int32_t sign;
  bcrypto_mont_curve_t *ec;
  napi_value bx, by, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[2], &sign) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(ecdh_pubkey_export(ec->ctx, x, y, pub, sign), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size, x, NULL, &bx) == napi_ok);
  CHECK(napi_create_buffer_copy(env, ec->field_size, y, NULL, &by) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, bx) == napi_ok);
  CHECK(napi_set_element(env, result, 1, by) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDH_MAX_PUB_SIZE];
  const uint8_t *x;
  size_t x_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&x, &x_len) == napi_ok);

  JS_ASSERT(ecdh_pubkey_import(ec->ctx, out, x, x_len), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_is_small(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = pub_len == ec->field_size && ecdh_pubkey_is_small(ec->ctx, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_pubkey_has_torsion(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = pub_len == ec->field_size && ecdh_pubkey_has_torsion(ec->ctx, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdh_derive(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDH_MAX_PUB_SIZE];
  const uint8_t *pub, *priv;
  size_t pub_len, priv_len;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdh_derive(ec->ctx, out, pub, priv), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

/*
 * ECDSA
 */

static napi_value
bcrypto_ecdsa_privkey_generate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *entropy;
  size_t entropy_len;
  uint8_t out[ECDSA_MAX_PRIV_SIZE];
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  ecdsa_privkey_generate(ec->ctx, out, entropy);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_ecdsa_privkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  ok = priv_len == ec->scalar_size && ecdsa_privkey_verify(ec->ctx, priv);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_privkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDSA_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdsa_privkey_export(ec->ctx, out, priv), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_privkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDSA_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(ecdsa_privkey_import(ec->ctx, out, priv, priv_len), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_privkey_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_PRIV_SIZE];
  const uint8_t *priv, *tweak;
  size_t priv_len, tweak_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(ecdsa_privkey_tweak_add(ec->ctx, out, priv, tweak), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_privkey_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_PRIV_SIZE];
  const uint8_t *priv, *tweak;
  size_t priv_len, tweak_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(ecdsa_privkey_tweak_mul(ec->ctx, out, priv, tweak), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_privkey_reduce(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDSA_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(ecdsa_privkey_reduce(ec->ctx, out, priv, priv_len), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_privkey_negate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDSA_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdsa_privkey_negate(ec->ctx, out, priv), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_privkey_invert(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDSA_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdsa_privkey_invert(ec->ctx, out, priv), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_create(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *priv;
  size_t priv_len;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdsa_pubkey_create(ec->ctx, out, &out_len, priv, compress),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_convert(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *pub;
  size_t pub_len;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  ok = ecdsa_pubkey_convert(ec->ctx, out, &out_len, pub, pub_len, compress);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_from_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *data;
  size_t data_len;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(data_len == ec->field_size, JS_ERR_PREIMAGE_SIZE);

  ecdsa_pubkey_from_uniform(ec->ctx, out, &out_len, data, compress);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_to_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[WEI_MAX_FIELD_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  uint32_t hint;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &hint) == napi_ok);

  JS_ASSERT(ecdsa_pubkey_to_uniform(ec->ctx, out, pub, pub_len, hint),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size,
                                out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_from_hash(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *data;
  size_t data_len;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(data_len == ec->field_size * 2, JS_ERR_PREIMAGE_SIZE);
  JS_ASSERT(ecdsa_pubkey_from_hash(ec->ctx, out, &out_len, data, compress),
            JS_ERR_PREIMAGE);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_to_hash(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[WEI_MAX_FIELD_SIZE * 2];
  const uint8_t *pub, *entropy;
  size_t pub_len, entropy_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(ecdsa_pubkey_to_hash(ec->ctx, out, pub, pub_len, 0, entropy),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size * 2,
                                out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = ecdsa_pubkey_verify(ec->ctx, pub, pub_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t x[WEI_MAX_FIELD_SIZE];
  uint8_t y[WEI_MAX_FIELD_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value bx, by, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  JS_ASSERT(ecdsa_pubkey_export(ec->ctx, x, y, pub, pub_len), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size, x, NULL, &bx) == napi_ok);
  CHECK(napi_create_buffer_copy(env, ec->field_size, y, NULL, &by) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, bx) == napi_ok);
  CHECK(napi_set_element(env, result, 1, by) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *x, *y;
  size_t x_len, y_len;
  int32_t sign;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&x, &x_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&y, &y_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[3], &sign) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[4], &compress) == napi_ok);

  ok = ecdsa_pubkey_import(ec->ctx, out, &out_len,
                           x, x_len, y, y_len, sign,
                           compress);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[3], &compress) == napi_ok);

  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  ok = ecdsa_pubkey_tweak_add(ec->ctx, out, &out_len,
                              pub, pub_len, tweak, compress);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[3], &compress) == napi_ok);

  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  ok = ecdsa_pubkey_tweak_mul(ec->ctx, out, &out_len,
                              pub, pub_len, tweak, compress);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_combine(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  uint32_t i, length;
  const uint8_t **pubs;
  size_t *pub_lens;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value item, result;
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(length != 0, JS_ERR_PUBKEY);

  pubs = (const uint8_t **)bcrypto_malloc(length * sizeof(uint8_t *));
  pub_lens = (size_t *)bcrypto_malloc(length * sizeof(size_t));

  if (pubs == NULL || pub_lens == NULL)
    goto fail;

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_buffer_info(env, item, (void **)&pubs[i],
                               &pub_lens[i]) == napi_ok);
  }

  ok = ecdsa_pubkey_combine(ec->ctx, out, &out_len,
                            pubs, pub_lens, length,
                            compress);

fail:
  bcrypto_free(pubs);
  bcrypto_free(pub_lens);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_pubkey_negate(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *pub;
  size_t pub_len;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  ok = ecdsa_pubkey_negate(ec->ctx, out, &out_len, pub, pub_len, compress);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_signature_normalize(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDSA_MAX_SIG_SIZE];
  const uint8_t *sig;
  size_t sig_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  JS_ASSERT(sig_len == ec->sig_size, JS_ERR_SIGNATURE_SIZE);
  JS_ASSERT(ecdsa_sig_normalize(ec->ctx, out, sig), JS_ERR_SIGNATURE);

  CHECK(napi_create_buffer_copy(env,
                                ec->sig_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_signature_normalize_der(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDSA_MAX_DER_SIZE];
  size_t out_len = ECDSA_MAX_DER_SIZE;
  const uint8_t *sig;
  size_t sig_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  JS_ASSERT(ecdsa_sig_import_lax(ec->ctx, out, sig, sig_len), JS_ERR_SIGNATURE);
  JS_ASSERT(ecdsa_sig_normalize(ec->ctx, out, out), JS_ERR_SIGNATURE);
  JS_ASSERT(ecdsa_sig_export(ec->ctx, out, &out_len, out), JS_ERR_SIGNATURE);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_signature_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDSA_MAX_DER_SIZE];
  size_t out_len = ECDSA_MAX_DER_SIZE;
  const uint8_t *sig;
  size_t sig_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  JS_ASSERT(sig_len == ec->sig_size, JS_ERR_SIGNATURE_SIZE);
  JS_ASSERT(ecdsa_sig_export(ec->ctx, out, &out_len, sig), JS_ERR_SIGNATURE);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_signature_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDSA_MAX_SIG_SIZE];
  const uint8_t *sig;
  size_t sig_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  JS_ASSERT(ecdsa_sig_import_lax(ec->ctx, out, sig, sig_len), JS_ERR_SIGNATURE);

  CHECK(napi_create_buffer_copy(env,
                                ec->sig_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_is_low_s(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *sig;
  size_t sig_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  ok = sig_len == ec->sig_size && ecdsa_is_low_s(ec->ctx, sig);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_is_low_der(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t tmp[ECDSA_MAX_SIG_SIZE];
  const uint8_t *sig;
  size_t sig_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  ok = ecdsa_sig_import_lax(ec->ctx, tmp, sig, sig_len)
    && ecdsa_is_low_s(ec->ctx, tmp);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_sign(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_SIG_SIZE];
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdsa_sign(ec->ctx, out, NULL, msg, msg_len, priv), JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env,
                                ec->sig_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_sign_recoverable(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_SIG_SIZE];
  unsigned int param;
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value sigval, paramval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdsa_sign(ec->ctx, out, &param, msg, msg_len, priv), JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env,
                                ec->sig_size,
                                out,
                                NULL,
                                &sigval) == napi_ok);

  CHECK(napi_create_uint32(env, param, &paramval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, sigval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, paramval) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_sign_der(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_DER_SIZE];
  size_t out_len = ECDSA_MAX_DER_SIZE;
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdsa_sign(ec->ctx, out, NULL, msg, msg_len, priv), JS_ERR_SIGN);
  JS_ASSERT(ecdsa_sig_export(ec->ctx, out, &out_len, out), JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_sign_recoverable_der(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[ECDSA_MAX_DER_SIZE];
  size_t out_len = ECDSA_MAX_DER_SIZE;
  unsigned int param;
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value sigval, paramval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdsa_sign(ec->ctx, out, &param, msg, msg_len, priv), JS_ERR_SIGN);
  JS_ASSERT(ecdsa_sig_export(ec->ctx, out, &out_len, out), JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &sigval) == napi_ok);
  CHECK(napi_create_uint32(env, param, &paramval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, sigval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, paramval) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_verify(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t tmp[ECDSA_MAX_SIG_SIZE];
  const uint8_t *msg, *sig, *pub;
  size_t msg_len, sig_len, pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);

  ok = sig_len == ec->sig_size
    && ecdsa_sig_normalize(ec->ctx, tmp, sig)
    && ecdsa_verify(ec->ctx, msg, msg_len, tmp, pub, pub_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_verify_der(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t tmp[ECDSA_MAX_SIG_SIZE];
  const uint8_t *msg, *sig, *pub;
  size_t msg_len, sig_len, pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);

  ok = ecdsa_sig_import_lax(ec->ctx, tmp, sig, sig_len)
    && ecdsa_sig_normalize(ec->ctx, tmp, tmp)
    && ecdsa_verify(ec->ctx, msg, msg_len, tmp, pub, pub_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_recover(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t tmp[ECDSA_MAX_SIG_SIZE];
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *msg, *sig;
  size_t msg_len, sig_len;
  uint32_t parm;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &parm) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[4], &compress) == napi_ok);

  JS_ASSERT((parm & 3) == parm, JS_ERR_RECOVERY_PARAM);

  ok = sig_len == ec->sig_size
    && ecdsa_sig_normalize(ec->ctx, tmp, sig)
    && ecdsa_recover(ec->ctx, out, &out_len, msg, msg_len, tmp, parm, compress);

  if (ok)
    CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);
  else
    CHECK(napi_get_null(env, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_recover_der(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t tmp[ECDSA_MAX_SIG_SIZE];
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *msg, *sig;
  size_t msg_len, sig_len;
  uint32_t parm;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &parm) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[4], &compress) == napi_ok);

  JS_ASSERT((parm & 3) == parm, JS_ERR_RECOVERY_PARAM);

  ok = ecdsa_sig_import_lax(ec->ctx, tmp, sig, sig_len)
    && ecdsa_sig_normalize(ec->ctx, tmp, tmp)
    && ecdsa_recover(ec->ctx, out, &out_len, msg, msg_len, tmp, parm, compress);

  if (ok)
    CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);
  else
    CHECK(napi_get_null(env, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_ecdsa_derive(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[ECDSA_MAX_PUB_SIZE];
  size_t out_len = ECDSA_MAX_PUB_SIZE;
  const uint8_t *pub, *priv;
  size_t pub_len, priv_len;
  bool compress;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[3], &compress) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(ecdsa_derive(ec->ctx, out, &out_len, pub, pub_len, priv, compress),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

/*
 * EdDSA
 */

static napi_value
bcrypto_eddsa_pubkey_size(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_create_uint32(env, ec->pub_size, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_privkey_generate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *entropy;
  size_t entropy_len;
  uint8_t out[EDDSA_MAX_PRIV_SIZE];
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  eddsa_privkey_generate(ec->ctx, out, entropy);

  CHECK(napi_create_buffer_copy(env,
                                ec->priv_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_eddsa_privkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  ok = priv_len == ec->priv_size && eddsa_privkey_verify(ec->ctx, priv);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_privkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDDSA_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->priv_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(eddsa_privkey_export(ec->ctx, out, priv), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->priv_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_privkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDDSA_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(eddsa_privkey_import(ec->ctx, out, priv, priv_len), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->priv_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_privkey_expand(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t scalar[EDWARDS_MAX_SCALAR_SIZE];
  uint8_t prefix[EDDSA_MAX_PREFIX_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_edwards_curve_t *ec;
  napi_value scalarval, prefixval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->priv_size, JS_ERR_PRIVKEY_SIZE);

  eddsa_privkey_expand(ec->ctx, scalar, prefix, priv);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                scalar,
                                NULL,
                                &scalarval) == napi_ok);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                prefix,
                                NULL,
                                &prefixval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, scalarval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, prefixval) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_privkey_convert(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDWARDS_MAX_SCALAR_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->priv_size, JS_ERR_PRIVKEY_SIZE);

  eddsa_privkey_convert(ec->ctx, out, priv);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_scalar_generate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDWARDS_MAX_SCALAR_SIZE];
  const uint8_t *entropy;
  size_t entropy_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  eddsa_scalar_generate(ec->ctx, out, entropy);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_eddsa_scalar_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *scalar;
  size_t scalar_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&scalar,
                             &scalar_len) == napi_ok);

  ok = scalar_len == ec->scalar_size && eddsa_scalar_verify(ec->ctx, scalar);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_scalar_clamp(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDWARDS_MAX_SCALAR_SIZE];
  const uint8_t *scalar;
  size_t scalar_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&scalar,
                             &scalar_len) == napi_ok);

  JS_ASSERT(scalar_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  eddsa_scalar_clamp(ec->ctx, out, scalar);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_scalar_is_zero(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *scalar;
  size_t scalar_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&scalar,
                             &scalar_len) == napi_ok);

  ok = scalar_len == ec->scalar_size && eddsa_scalar_is_zero(ec->ctx, scalar);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_scalar_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[EDWARDS_MAX_SCALAR_SIZE];
  const uint8_t *scalar, *tweak;
  size_t scalar_len, tweak_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&scalar,
                             &scalar_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(scalar_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  eddsa_scalar_tweak_add(ec->ctx, out, scalar, tweak);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_scalar_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[EDWARDS_MAX_SCALAR_SIZE];
  const uint8_t *scalar, *tweak;
  size_t scalar_len, tweak_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&scalar,
                             &scalar_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(scalar_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  eddsa_scalar_tweak_mul(ec->ctx, out, scalar, tweak);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_scalar_reduce(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDWARDS_MAX_SCALAR_SIZE];
  const uint8_t *scalar;
  size_t scalar_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&scalar,
                             &scalar_len) == napi_ok);

  eddsa_scalar_reduce(ec->ctx, out, scalar, scalar_len);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_scalar_negate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDWARDS_MAX_SCALAR_SIZE];
  const uint8_t *scalar;
  size_t scalar_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&scalar,
                             &scalar_len) == napi_ok);

  JS_ASSERT(scalar_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  eddsa_scalar_negate(ec->ctx, out, scalar);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_scalar_invert(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDWARDS_MAX_SCALAR_SIZE];
  const uint8_t *scalar;
  size_t scalar_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&scalar,
                             &scalar_len) == napi_ok);

  JS_ASSERT(scalar_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  eddsa_scalar_invert(ec->ctx, out, scalar);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_create(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->priv_size, JS_ERR_PRIVKEY_SIZE);

  eddsa_pubkey_create(ec->ctx, out, priv);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_from_scalar(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *scalar;
  size_t scalar_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&scalar,
                             &scalar_len) == napi_ok);

  JS_ASSERT(scalar_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  eddsa_pubkey_from_scalar(ec->ctx, out, scalar);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_convert(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[ECDH_MAX_PUB_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  JS_ASSERT(pub_len == ec->pub_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(eddsa_pubkey_convert(ec->ctx, out, pub), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_from_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *data;
  size_t data_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len == ec->field_size, JS_ERR_PREIMAGE_SIZE);

  eddsa_pubkey_from_uniform(ec->ctx, out, data);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_to_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[EDWARDS_MAX_FIELD_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  uint32_t hint;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &hint) == napi_ok);

  JS_ASSERT(pub_len == ec->pub_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(eddsa_pubkey_to_uniform(ec->ctx, out, pub, hint), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size,
                                out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_from_hash(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *data;
  size_t data_len;
  bool pake;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &pake) == napi_ok);

  JS_ASSERT(data_len == ec->field_size * 2, JS_ERR_PREIMAGE_SIZE);

  eddsa_pubkey_from_hash(ec->ctx, out, data, pake);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_to_hash(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[EDWARDS_MAX_FIELD_SIZE * 2];
  const uint8_t *pub, *entropy;
  size_t pub_len, entropy_len;
  uint32_t subgroup;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &subgroup) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(pub_len == ec->pub_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(eddsa_pubkey_to_hash(ec->ctx, out, pub, subgroup, entropy),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size * 2,
                                out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = pub_len == ec->pub_size && eddsa_pubkey_verify(ec->ctx, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t x[EDWARDS_MAX_FIELD_SIZE];
  uint8_t y[EDWARDS_MAX_FIELD_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_edwards_curve_t *ec;
  napi_value bx, by, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  JS_ASSERT(pub_len == ec->pub_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(eddsa_pubkey_export(ec->ctx, x, y, pub), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size, x, NULL, &bx) == napi_ok);
  CHECK(napi_create_buffer_copy(env, ec->field_size, y, NULL, &by) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, bx) == napi_ok);
  CHECK(napi_set_element(env, result, 1, by) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *x, *y;
  size_t x_len, y_len;
  int32_t sign;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&x, &x_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&y, &y_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[3], &sign) == napi_ok);

  JS_ASSERT(eddsa_pubkey_import(ec->ctx, out, x, x_len, y, y_len, sign),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_is_infinity(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = pub_len == ec->pub_size && eddsa_pubkey_is_infinity(ec->ctx, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_is_small(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = pub_len == ec->pub_size && eddsa_pubkey_is_small(ec->ctx, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_has_torsion(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = pub_len == ec->pub_size && eddsa_pubkey_has_torsion(ec->ctx, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(pub_len == ec->pub_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(eddsa_pubkey_tweak_add(ec->ctx, out, pub, tweak), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(pub_len == ec->pub_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(eddsa_pubkey_tweak_mul(ec->ctx, out, pub, tweak), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_combine(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  uint32_t i, length;
  const uint8_t **pubs;
  size_t pub_len;
  bcrypto_edwards_curve_t *ec;
  napi_value item, result;
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);

  pubs = (const uint8_t **)bcrypto_malloc(length * sizeof(uint8_t *));

  if (pubs == NULL && length != 0)
    goto fail;

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_buffer_info(env, item, (void **)&pubs[i],
                               &pub_len) == napi_ok);

    if (pub_len != ec->pub_size)
      goto fail;
  }

  ok = eddsa_pubkey_combine(ec->ctx, out, pubs, length);

fail:
  bcrypto_free(pubs);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_pubkey_negate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  JS_ASSERT(pub_len == ec->pub_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(eddsa_pubkey_negate(ec->ctx, out, pub), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_sign(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[EDDSA_MAX_SIG_SIZE];
  const uint8_t *msg, *priv, *ctx;
  size_t msg_len, priv_len, ctx_len;
  int32_t ph;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[3], &ph) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&ctx, &ctx_len) == napi_ok);

  JS_ASSERT(priv_len == ec->priv_size, JS_ERR_PRIVKEY_SIZE);

  eddsa_sign(ec->ctx, out, msg, msg_len, priv, ph, ctx, ctx_len);

  CHECK(napi_create_buffer_copy(env,
                                ec->sig_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_sign_with_scalar(napi_env env, napi_callback_info info) {
  napi_value argv[6];
  size_t argc = 6;
  uint8_t out[EDDSA_MAX_SIG_SIZE];
  const uint8_t *msg, *scalar, *prefix, *ctx;
  size_t msg_len, scalar_len, prefix_len, ctx_len;
  int32_t ph;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 6);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&scalar,
                             &scalar_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&prefix,
                             &prefix_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[4], &ph) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[5], (void **)&ctx, &ctx_len) == napi_ok);

  JS_ASSERT(scalar_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(prefix_len == ec->pub_size, JS_ERR_PREFIX_SIZE);

  eddsa_sign_with_scalar(ec->ctx, out, msg, msg_len,
                         scalar, prefix, ph, ctx, ctx_len);

  CHECK(napi_create_buffer_copy(env,
                                ec->sig_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_sign_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[6];
  size_t argc = 6;
  uint8_t out[EDDSA_MAX_SIG_SIZE];
  const uint8_t *msg, *priv, *tweak, *ctx;
  size_t msg_len, priv_len, tweak_len, ctx_len;
  int32_t ph;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 6);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&tweak,
                             &tweak_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[4], &ph) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[5], (void **)&ctx, &ctx_len) == napi_ok);

  JS_ASSERT(priv_len == ec->priv_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  eddsa_sign_tweak_add(ec->ctx, out, msg, msg_len,
                       priv, tweak, ph, ctx, ctx_len);

  CHECK(napi_create_buffer_copy(env,
                                ec->sig_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_sign_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[6];
  size_t argc = 6;
  uint8_t out[EDDSA_MAX_SIG_SIZE];
  const uint8_t *msg, *priv, *tweak, *ctx;
  size_t msg_len, priv_len, tweak_len, ctx_len;
  int32_t ph;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 6);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&tweak,
                             &tweak_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[4], &ph) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[5], (void **)&ctx, &ctx_len) == napi_ok);

  JS_ASSERT(priv_len == ec->priv_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);

  eddsa_sign_tweak_mul(ec->ctx, out, msg, msg_len,
                       priv, tweak, ph, ctx, ctx_len);

  CHECK(napi_create_buffer_copy(env,
                                ec->sig_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_verify(napi_env env, napi_callback_info info) {
  napi_value argv[6];
  size_t argc = 6;
  const uint8_t *msg, *sig, *pub, *ctx;
  size_t msg_len, sig_len, pub_len, ctx_len;
  int32_t ph;
  bcrypto_edwards_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 6);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[4], &ph) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[5], (void **)&ctx, &ctx_len) == napi_ok);

  ok = sig_len == ec->sig_size
    && pub_len == ec->pub_size
    && eddsa_verify(ec->ctx, msg, msg_len, sig, pub, ph, ctx, ctx_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_verify_single(napi_env env, napi_callback_info info) {
  napi_value argv[6];
  size_t argc = 6;
  const uint8_t *msg, *sig, *pub, *ctx;
  size_t msg_len, sig_len, pub_len, ctx_len;
  int32_t ph;
  bcrypto_edwards_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 6);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[4], &ph) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[5], (void **)&ctx, &ctx_len) == napi_ok);

  ok = sig_len == ec->sig_size
    && pub_len == ec->pub_size
    && eddsa_verify_single(ec->ctx, msg, msg_len, sig, pub, ph, ctx, ctx_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_verify_batch(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint32_t i, length, item_len;
  const uint8_t *ctx;
  const uint8_t **ptrs, **msgs, **pubs, **sigs;
  size_t *lens, *msg_lens;
  size_t sig_len, pub_len, ctx_len;
  int32_t ph;
  bcrypto_edwards_curve_t *ec;
  napi_value item, result;
  napi_value items[3];
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[2], &ph) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&ctx, &ctx_len) == napi_ok);

  if (length == 0) {
    CHECK(napi_get_boolean(env, true, &result) == napi_ok);
    return result;
  }

  ptrs = (const uint8_t **)bcrypto_malloc(3 * length * sizeof(uint8_t *));
  lens = (size_t *)bcrypto_malloc(1 * length * sizeof(size_t));

  if (ptrs == NULL || lens == NULL)
    goto fail;

  msgs = &ptrs[length * 0];
  pubs = &ptrs[length * 1];
  sigs = &ptrs[length * 2];
  msg_lens = &lens[length * 0];

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_array_length(env, item, &item_len) == napi_ok);
    CHECK(item_len == 3);

    CHECK(napi_get_element(env, item, 0, &items[0]) == napi_ok);
    CHECK(napi_get_element(env, item, 1, &items[1]) == napi_ok);
    CHECK(napi_get_element(env, item, 2, &items[2]) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[0], (void **)&msgs[i],
                               &msg_lens[i]) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[1], (void **)&sigs[i],
                               &sig_len) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[2], (void **)&pubs[i],
                               &pub_len) == napi_ok);

    if (sig_len != ec->sig_size || pub_len != ec->pub_size)
      goto fail;
  }

  if (ec->scratch == NULL)
    ec->scratch = edwards_scratch_create(ec->ctx, SCRATCH_SIZE);

  CHECK(ec->scratch != NULL);

  ok = eddsa_verify_batch(ec->ctx, msgs, msg_lens, sigs,
                          pubs, length, ph, ctx, ctx_len,
                          ec->scratch);

fail:
  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(ptrs);
  bcrypto_free(lens);

  return result;
}

static napi_value
bcrypto_eddsa_derive(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *pub, *priv;
  size_t pub_len, priv_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(pub_len == ec->pub_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(priv_len == ec->priv_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(eddsa_derive(ec->ctx, out, pub, priv), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_eddsa_derive_with_scalar(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[EDDSA_MAX_PUB_SIZE];
  const uint8_t *pub, *scalar;
  size_t pub_len, scalar_len;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&scalar,
                             &scalar_len) == napi_ok);

  JS_ASSERT(pub_len == ec->pub_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(scalar_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(eddsa_derive_with_scalar(ec->ctx, out, pub, scalar), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->pub_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

/*
 * Edwards Curve
 */

static void
bcrypto_edwards_curve_destroy(napi_env env, void *data, void *hint) {
  bcrypto_edwards_curve_t *ec = (bcrypto_edwards_curve_t *)data;

  if (ec->scratch != NULL)
    edwards_scratch_destroy(ec->ctx, ec->scratch);

  edwards_curve_destroy(ec->ctx);
  bcrypto_free(ec);
}

static napi_value
bcrypto_edwards_curve_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint32_t type;
  bcrypto_edwards_curve_t *ec;
  edwards_curve_t *ctx;
  napi_value handle;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);

  JS_ASSERT(ctx = edwards_curve_create(type), JS_ERR_CONTEXT);

  ec = (bcrypto_edwards_curve_t *)bcrypto_xmalloc(sizeof(bcrypto_edwards_curve_t));
  ec->ctx = ctx;
  ec->scratch = NULL;
  ec->scalar_size = edwards_curve_scalar_size(ec->ctx);
  ec->scalar_bits = edwards_curve_scalar_bits(ec->ctx);
  ec->field_size = edwards_curve_field_size(ec->ctx);
  ec->field_bits = edwards_curve_field_bits(ec->ctx);
  ec->priv_size = eddsa_privkey_size(ec->ctx);
  ec->pub_size = eddsa_pubkey_size(ec->ctx);
  ec->sig_size = eddsa_sig_size(ec->ctx);

  CHECK(napi_create_external(env,
                             ec,
                             bcrypto_edwards_curve_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_edwards_curve_field_size(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_create_uint32(env, ec->field_size, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_edwards_curve_field_bits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_edwards_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_create_uint32(env, ec->field_bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_edwards_curve_randomize(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *entropy;
  size_t entropy_len;
  bcrypto_edwards_curve_t *ec;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  edwards_curve_randomize(ec->ctx, entropy);

  cleanse((void *)entropy, entropy_len);

  return argv[0];
}

/*
 * Hash
 */

static void
bcrypto_hash_destroy(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_hash_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_hash_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint32_t type;
  bcrypto_hash_t *hash;
  napi_value handle;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);

  JS_ASSERT(hash_has_backend(type), JS_ERR_INIT);

  hash = (bcrypto_hash_t *)bcrypto_xmalloc(sizeof(bcrypto_hash_t));
  hash->type = type;
  hash->started = 0;

  CHECK(napi_create_external(env,
                             hash,
                             bcrypto_hash_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_hash_init(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_hash_t *hash;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&hash) == napi_ok);

  hash_init(&hash->ctx, hash->type);
  hash->started = 1;

  return argv[0];
}

static napi_value
bcrypto_hash_update(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *in;
  size_t in_len;
  bcrypto_hash_t *hash;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&hash) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(hash->started, JS_ERR_INIT);

  hash_update(&hash->ctx, in, in_len);

  return argv[0];
}

static napi_value
bcrypto_hash_final(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[HASH_MAX_OUTPUT_SIZE];
  size_t out_len;
  bcrypto_hash_t *hash;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&hash) == napi_ok);

  JS_ASSERT(hash->started, JS_ERR_INIT);

  out_len = hash_output_size(hash->type);

  hash_final(&hash->ctx, out, out_len);
  hash->started = 0;

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_hash_digest(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[HASH_MAX_OUTPUT_SIZE];
  size_t out_len;
  uint32_t type;
  const uint8_t *in;
  size_t in_len;
  hash_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(hash_has_backend(type), JS_ERR_ARG);

  out_len = hash_output_size(type);

  hash_init(&ctx, type);
  hash_update(&ctx, in, in_len);
  hash_final(&ctx, out, out_len);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_hash_root(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[HASH_MAX_OUTPUT_SIZE];
  size_t out_len;
  uint32_t type;
  const uint8_t *left, *right;
  size_t left_len, right_len;
  hash_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&left,
                             &left_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&right,
                             &right_len) == napi_ok);

  JS_ASSERT(hash_has_backend(type), JS_ERR_ARG);

  out_len = hash_output_size(type);

  JS_ASSERT(left_len == out_len && right_len == out_len, JS_ERR_NODE_SIZE);

  hash_init(&ctx, type);
  hash_update(&ctx, left, left_len);
  hash_update(&ctx, right, right_len);
  hash_final(&ctx, out, out_len);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_hash_multi(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[HASH_MAX_OUTPUT_SIZE];
  size_t out_len;
  uint32_t type;
  const uint8_t *x, *y, *z;
  size_t x_len, y_len, z_len;
  hash_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&x, &x_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&y, &y_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&z, &z_len) == napi_ok);

  JS_ASSERT(hash_has_backend(type), JS_ERR_ARG);

  out_len = hash_output_size(type);

  hash_init(&ctx, type);
  hash_update(&ctx, x, x_len);
  hash_update(&ctx, y, y_len);
  hash_update(&ctx, z, z_len);
  hash_final(&ctx, out, out_len);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

/*
 * Hash-DRBG
 */

static void
bcrypto_hash_drbg_destroy(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_hash_drbg_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_hash_drbg_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint32_t type;
  bcrypto_hash_drbg_t *drbg;
  napi_value handle;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);

  JS_ASSERT(hash_has_backend(type), JS_ERR_ARG);

  drbg = (bcrypto_hash_drbg_t *)bcrypto_xmalloc(sizeof(bcrypto_hash_drbg_t));
  drbg->type = type;
  drbg->started = 0;

  CHECK(napi_create_external(env,
                             drbg,
                             bcrypto_hash_drbg_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_hash_drbg_init(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *seed;
  size_t seed_len;
  bcrypto_hash_drbg_t *drbg;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&drbg) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&seed,
                             &seed_len) == napi_ok);

  hash_drbg_init(&drbg->ctx, drbg->type, seed, seed_len);
  drbg->started = 1;

  return argv[0];
}

static napi_value
bcrypto_hash_drbg_reseed(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *seed;
  size_t seed_len;
  bcrypto_hash_drbg_t *drbg;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&drbg) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&seed,
                             &seed_len) == napi_ok);

  JS_ASSERT(drbg->started, JS_ERR_INIT);

  hash_drbg_reseed(&drbg->ctx, seed, seed_len);

  return argv[0];
}

static napi_value
bcrypto_hash_drbg_generate(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t *out;
  uint32_t out_len;
  const uint8_t *add;
  size_t add_len;
  bcrypto_hash_drbg_t *drbg;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&drbg) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&add, &add_len) == napi_ok);

  JS_ASSERT(drbg->started, JS_ERR_INIT);
  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  hash_drbg_generate(&drbg->ctx, out, out_len, add, add_len);

  return result;
}

/*
 * HKDF
 */

static napi_value
bcrypto_hkdf_extract(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[HASH_MAX_OUTPUT_SIZE];
  uint32_t type, out_len;
  const uint8_t *ikm, *salt;
  size_t ikm_len, salt_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&ikm,
                             &ikm_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&salt,
                             &salt_len) == napi_ok);

  JS_ASSERT(hkdf_extract(out, type, ikm, ikm_len, salt, salt_len),
            JS_ERR_DERIVE);

  out_len = hash_output_size(type);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_hkdf_expand(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t *out;
  uint32_t type, out_len;
  const uint8_t *prk, *info_;
  size_t prk_len, info_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&prk,
                             &prk_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&info_,
                             &info_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &out_len) == napi_ok);

  JS_ASSERT(hash_has_backend(type), JS_ERR_DERIVE);
  JS_ASSERT(prk_len == hash_output_size(type), JS_ERR_DERIVE);
  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  JS_ASSERT(hkdf_expand(out, type, prk, info_, info_len, out_len),
            JS_ERR_DERIVE);

  return result;
}

/*
 * HMAC
 */

static void
bcrypto_hmac_destroy(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_hmac_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_hmac_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint32_t type;
  bcrypto_hmac_t *hmac;
  napi_value handle;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);

  JS_ASSERT(hash_has_backend(type), JS_ERR_ARG);

  hmac = (bcrypto_hmac_t *)bcrypto_xmalloc(sizeof(bcrypto_hmac_t));
  hmac->type = type;
  hmac->started = 0;

  CHECK(napi_create_external(env,
                             hmac,
                             bcrypto_hmac_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_hmac_init(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *key;
  size_t key_len;
  bcrypto_hmac_t *hmac;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&hmac) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);

  hmac_init(&hmac->ctx, hmac->type, key, key_len);
  hmac->started = 1;

  return argv[0];
}

static napi_value
bcrypto_hmac_update(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *in;
  size_t in_len;
  bcrypto_hmac_t *hmac;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&hmac) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(hmac->started, JS_ERR_INIT);

  hmac_update(&hmac->ctx, in, in_len);

  return argv[0];
}

static napi_value
bcrypto_hmac_final(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[HASH_MAX_OUTPUT_SIZE];
  size_t out_len;
  bcrypto_hmac_t *hmac;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&hmac) == napi_ok);

  JS_ASSERT(hmac->started, JS_ERR_INIT);

  out_len = hash_output_size(hmac->type);

  hmac_final(&hmac->ctx, out);
  hmac->started = 0;

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_hmac_digest(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[HASH_MAX_OUTPUT_SIZE];
  size_t out_len;
  uint32_t type;
  const uint8_t *in, *key;
  size_t in_len, key_len;
  hmac_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&in, &in_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(hash_has_backend(type), JS_ERR_ARG);

  out_len = hash_output_size(type);

  hmac_init(&ctx, type, key, key_len);
  hmac_update(&ctx, in, in_len);
  hmac_final(&ctx, out);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

/*
 * HMAC-DRBG
 */

static void
bcrypto_hmac_drbg_destroy(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_hmac_drbg_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_hmac_drbg_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint32_t type;
  bcrypto_hmac_drbg_t *drbg;
  napi_value handle;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);

  JS_ASSERT(hash_has_backend(type), JS_ERR_ARG);

  drbg = (bcrypto_hmac_drbg_t *)bcrypto_xmalloc(sizeof(bcrypto_hmac_drbg_t));
  drbg->type = type;
  drbg->started = 0;

  CHECK(napi_create_external(env,
                             drbg,
                             bcrypto_hmac_drbg_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_hmac_drbg_init(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *seed;
  size_t seed_len;
  bcrypto_hmac_drbg_t *drbg;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&drbg) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&seed,
                             &seed_len) == napi_ok);

  hmac_drbg_init(&drbg->ctx, drbg->type, seed, seed_len);
  drbg->started = 1;

  return argv[0];
}

static napi_value
bcrypto_hmac_drbg_reseed(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *seed;
  size_t seed_len;
  bcrypto_hmac_drbg_t *drbg;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&drbg) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&seed,
                             &seed_len) == napi_ok);

  JS_ASSERT(drbg->started, JS_ERR_INIT);

  hmac_drbg_reseed(&drbg->ctx, seed, seed_len);

  return argv[0];
}

static napi_value
bcrypto_hmac_drbg_generate(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t *out;
  uint32_t out_len;
  const uint8_t *add;
  size_t add_len;
  bcrypto_hmac_drbg_t *drbg;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&drbg) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &out_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&add, &add_len) == napi_ok);

  JS_ASSERT(drbg->started, JS_ERR_INIT);
  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  hmac_drbg_generate(&drbg->ctx, out, out_len, add, add_len);

  return result;
}

/*
 * Keccak
 */

static void
bcrypto_keccak_destroy(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_keccak_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_keccak_create(napi_env env, napi_callback_info info) {
  bcrypto_keccak_t *keccak =
    (bcrypto_keccak_t *)bcrypto_xmalloc(sizeof(bcrypto_keccak_t));
  napi_value handle;

  keccak->started = 0;

  CHECK(napi_create_external(env,
                             keccak,
                             bcrypto_keccak_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_keccak_init(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t bits, rate;
  bcrypto_keccak_t *keccak;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&keccak) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &bits) == napi_ok);

  rate = 1600 - bits * 2;

  JS_ASSERT(bits >= 128 && bits <= 512 && (rate & 63) == 0, JS_ERR_OUTPUT_SIZE);

  keccak_init(&keccak->ctx, bits);
  keccak->started = 1;

  return argv[0];
}

static napi_value
bcrypto_keccak_update(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *in;
  size_t in_len;
  bcrypto_keccak_t *keccak;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&keccak) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&in, &in_len) == napi_ok);

  JS_ASSERT(keccak->started, JS_ERR_INIT);

  keccak_update(&keccak->ctx, in, in_len);

  return argv[0];
}

static napi_value
bcrypto_keccak_final(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[200];
  uint32_t pad, out_len;
  bcrypto_keccak_t *keccak;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&keccak) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &pad) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &out_len) == napi_ok);

  if (out_len == 0)
    out_len = 100 - (keccak->ctx.bs >> 1);

  JS_ASSERT(keccak->started, JS_ERR_INIT);
  JS_ASSERT(out_len <= keccak->ctx.bs, JS_ERR_OUTPUT_SIZE);

  keccak_final(&keccak->ctx, out, pad, out_len);
  keccak->started = 0;

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_keccak_digest(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[200];
  const uint8_t *in;
  size_t in_len;
  uint32_t bits, pad, out_len, rate, bs;
  keccak_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&in, &in_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &bits) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &pad) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &out_len) == napi_ok);

  rate = 1600 - bits * 2;
  bs = rate >> 3;

  if (out_len == 0)
    out_len = 100 - (bs >> 1);

  JS_ASSERT(bits >= 128 && bits <= 512 && (rate & 63) == 0, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(out_len <= bs, JS_ERR_OUTPUT_SIZE);

  keccak_init(&ctx, bits);
  keccak_update(&ctx, in, in_len);
  keccak_final(&ctx, out, pad, out_len);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_keccak_root(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[200];
  const uint8_t *left, *right;
  size_t left_len, right_len;
  uint32_t bits, pad, out_len, rate, bs;
  keccak_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&left,
                             &left_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&right,
                             &right_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &bits) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &pad) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[4], &out_len) == napi_ok);

  rate = 1600 - bits * 2;
  bs = rate >> 3;

  if (out_len == 0)
    out_len = 100 - (bs >> 1);

  JS_ASSERT(bits >= 128 && bits <= 512 && (rate & 63) == 0, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(out_len <= bs, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(left_len == out_len && right_len == out_len, JS_ERR_NODE_SIZE);

  keccak_init(&ctx, bits);
  keccak_update(&ctx, left, left_len);
  keccak_update(&ctx, right, right_len);
  keccak_final(&ctx, out, pad, out_len);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_keccak_multi(napi_env env, napi_callback_info info) {
  napi_value argv[6];
  size_t argc = 6;
  uint8_t out[200];
  const uint8_t *x, *y, *z;
  size_t x_len, y_len, z_len;
  uint32_t bits, pad, out_len, rate, bs;
  keccak_t ctx;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 6);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&x, &x_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&y, &y_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&z, &z_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &bits) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[4], &pad) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[5], &out_len) == napi_ok);

  rate = 1600 - bits * 2;
  bs = rate >> 3;

  if (out_len == 0)
    out_len = 100 - (bs >> 1);

  JS_ASSERT(bits >= 128 && bits <= 512 && (rate & 63) == 0, JS_ERR_OUTPUT_SIZE);
  JS_ASSERT(out_len <= bs, JS_ERR_OUTPUT_SIZE);

  keccak_init(&ctx, bits);
  keccak_update(&ctx, x, x_len);
  keccak_update(&ctx, y, y_len);
  keccak_update(&ctx, z, z_len);
  keccak_final(&ctx, out, pad, out_len);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

/*
 * Montgomery Curve
 */

static void
bcrypto_mont_curve_destroy(napi_env env, void *data, void *hint) {
  bcrypto_mont_curve_t *ec = (bcrypto_mont_curve_t *)data;

  mont_curve_destroy(ec->ctx);
  bcrypto_free(ec);
}

static napi_value
bcrypto_mont_curve_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint32_t type;
  bcrypto_mont_curve_t *ec;
  mont_curve_t *ctx;
  napi_value handle;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);

  JS_ASSERT(ctx = mont_curve_create(type), JS_ERR_CONTEXT);

  ec = (bcrypto_mont_curve_t *)bcrypto_xmalloc(sizeof(bcrypto_mont_curve_t));
  ec->ctx = ctx;
  ec->scalar_size = mont_curve_scalar_size(ec->ctx);
  ec->scalar_bits = mont_curve_scalar_bits(ec->ctx);
  ec->field_size = mont_curve_field_size(ec->ctx);
  ec->field_bits = mont_curve_field_bits(ec->ctx);

  CHECK(napi_create_external(env,
                             ec,
                             bcrypto_mont_curve_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_mont_curve_field_size(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_create_uint32(env, ec->field_size, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_mont_curve_field_bits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_mont_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_create_uint32(env, ec->field_bits, &result) == napi_ok);

  return result;
}

/*
 * Murmur3
 */

static napi_value
bcrypto_murmur3_sum(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t out;
  const uint8_t *msg;
  size_t msg_len;
  uint32_t seed;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &seed) == napi_ok);

  out = murmur3_sum(msg, msg_len, seed);

  CHECK(napi_create_uint32(env, out, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_murmur3_tweak(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint32_t out;
  const uint8_t *msg;
  size_t msg_len;
  uint32_t n, tweak;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &n) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &tweak) == napi_ok);

  out = murmur3_tweak(msg, msg_len, n, tweak);

  CHECK(napi_create_uint32(env, out, &result) == napi_ok);

  return result;
}

/*
 * PBKDF2
 */

static napi_value
bcrypto_pbkdf2_derive(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t *out;
  uint32_t type, iter, out_len;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &iter) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[4], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  ok = pbkdf2_derive(out, type, pass, pass_len,
                     salt, salt_len, iter, out_len);

  JS_ASSERT(ok, JS_ERR_DERIVE);

  return result;
}

typedef struct bcrypto_pbkdf2_worker_s {
  uint32_t type;
  uint8_t *pass;
  size_t pass_len;
  uint8_t *salt;
  size_t salt_len;
  uint32_t iter;
  uint8_t *out;
  uint32_t out_len;
  const char *error;
  napi_async_work work;
  napi_deferred deferred;
} bcrypto_pbkdf2_worker_t;

static void
bcrypto_pbkdf2_execute_(napi_env env, void *data) {
  bcrypto_pbkdf2_worker_t *w = (bcrypto_pbkdf2_worker_t *)data;

  if (!pbkdf2_derive(w->out, w->type, w->pass, w->pass_len,
                     w->salt, w->salt_len, w->iter, w->out_len)) {
    w->error = JS_ERR_DERIVE;
  }

  cleanse(w->pass, w->pass_len);
  cleanse(w->salt, w->salt_len);
}

static void
bcrypto_pbkdf2_complete_(napi_env env, napi_status status, void *data) {
  bcrypto_pbkdf2_worker_t *w = (bcrypto_pbkdf2_worker_t *)data;
  napi_value result, strval, errval;

  if (w->error == NULL && status == napi_ok)
    status = napi_create_buffer_copy(env, w->out_len, w->out, NULL, &result);

  if (status != napi_ok)
    w->error = JS_ERR_DERIVE;

  if (w->error == NULL) {
    CHECK(napi_resolve_deferred(env, w->deferred, result) == napi_ok);
  } else {
    CHECK(napi_create_string_latin1(env, w->error, NAPI_AUTO_LENGTH,
                                    &strval) == napi_ok);
    CHECK(napi_create_error(env, NULL, strval, &errval) == napi_ok);
    CHECK(napi_reject_deferred(env, w->deferred, errval) == napi_ok);
  }

  CHECK(napi_delete_async_work(env, w->work) == napi_ok);

  bcrypto_free(w->pass);
  bcrypto_free(w->salt);
  bcrypto_free(w->out);
  bcrypto_free(w);
}

static napi_value
bcrypto_pbkdf2_derive_async(napi_env env, napi_callback_info info) {
  bcrypto_pbkdf2_worker_t *worker;
  napi_value argv[5];
  size_t argc = 5;
  uint8_t *out;
  uint32_t type, iter, out_len;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value workname, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &iter) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[4], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  out = (uint8_t *)bcrypto_malloc(out_len);

  JS_ASSERT(out != NULL || out_len == 0, JS_ERR_ALLOC);

  worker = (bcrypto_pbkdf2_worker_t *)bcrypto_xmalloc(sizeof(bcrypto_pbkdf2_worker_t));
  worker->type = type;
  worker->pass = (uint8_t *)bcrypto_malloc(pass_len);
  worker->pass_len = pass_len;
  worker->salt = (uint8_t *)bcrypto_malloc(salt_len);
  worker->salt_len = salt_len;
  worker->iter = iter;
  worker->out = out;
  worker->out_len = out_len;
  worker->error = NULL;

  if ((worker->pass == NULL && pass_len != 0)
      || (worker->salt == NULL && salt_len != 0)) {
    bcrypto_free(worker->pass);
    bcrypto_free(worker->salt);
    bcrypto_free(worker->out);
    bcrypto_free(worker);
    JS_THROW(JS_ERR_DERIVE);
  }

  memcpy(worker->pass, pass, pass_len);
  memcpy(worker->salt, salt, salt_len);

  CHECK(napi_create_string_latin1(env, "bcrypto:pbkdf2_derive",
                                  NAPI_AUTO_LENGTH, &workname) == napi_ok);

  CHECK(napi_create_promise(env, &worker->deferred, &result) == napi_ok);

  CHECK(napi_create_async_work(env,
                               NULL,
                               workname,
                               bcrypto_pbkdf2_execute_,
                               bcrypto_pbkdf2_complete_,
                               worker,
                               &worker->work) == napi_ok);

  CHECK(napi_queue_async_work(env, worker->work) == napi_ok);

  return result;
}

/*
 * PGPDF
 */

static napi_value
bcrypto_pgpdf_derive_simple(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t *out;
  uint32_t type, out_len;
  const uint8_t *pass;
  size_t pass_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  JS_ASSERT(pgpdf_derive_simple(out, type, pass, pass_len, out_len),
            JS_ERR_DERIVE);

  return result;
}

static napi_value
bcrypto_pgpdf_derive_salted(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t *out;
  uint32_t type, out_len;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  ok = pgpdf_derive_salted(out, type, pass, pass_len,
                           salt, salt_len, out_len);

  JS_ASSERT(ok, JS_ERR_DERIVE);

  return result;
}

static napi_value
bcrypto_pgpdf_derive_iterated(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t *out;
  uint32_t type, count, out_len;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &count) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[4], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  ok = pgpdf_derive_iterated(out, type, pass, pass_len,
                             salt, salt_len, count, out_len);

  JS_ASSERT(ok, JS_ERR_DERIVE);

  return result;
}

/*
 * Poly1305
 */

static void
bcrypto_poly1305_destroy_(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_poly1305_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_poly1305_create(napi_env env, napi_callback_info info) {
  bcrypto_poly1305_t *poly =
    (bcrypto_poly1305_t *)bcrypto_xmalloc(sizeof(bcrypto_poly1305_t));
  napi_value handle;

  poly->started = 0;

  CHECK(napi_create_external(env,
                             poly,
                             bcrypto_poly1305_destroy_,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_poly1305_init(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *key;
  size_t key_len;
  bcrypto_poly1305_t *poly;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&poly) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(key_len == 32, JS_ERR_KEY_SIZE);

  poly1305_init(&poly->ctx, key);
  poly->started = 1;

  return argv[0];
}

static napi_value
bcrypto_poly1305_update(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *msg;
  size_t msg_len;
  bcrypto_poly1305_t *poly;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&poly) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);

  JS_ASSERT(poly->started, JS_ERR_INIT);

  poly1305_update(&poly->ctx, msg, msg_len);

  return argv[0];
}

static napi_value
bcrypto_poly1305_final(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[16];
  bcrypto_poly1305_t *poly;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&poly) == napi_ok);

  JS_ASSERT(poly->started, JS_ERR_INIT);

  poly1305_final(&poly->ctx, out);
  poly->started = 0;

  CHECK(napi_create_buffer_copy(env, 16, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_poly1305_destroy(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_poly1305_t *poly;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&poly) == napi_ok);

  poly->started = 0;

  return argv[0];
}

static napi_value
bcrypto_poly1305_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t mac[16];
  const uint8_t *tag;
  size_t tag_len;
  bcrypto_poly1305_t *poly;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(napi_get_value_external(env, argv[0], (void **)&poly) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&tag, &tag_len) == napi_ok);

  JS_ASSERT(tag_len == 16, JS_ERR_TAG_SIZE);
  JS_ASSERT(poly->started, JS_ERR_INIT);

  poly1305_final(&poly->ctx, mac);
  poly->started = 0;

  ok = poly1305_verify(mac, tag);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

/*
 * RC4
 */

static void
bcrypto_rc4_destroy_(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_rc4_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_rc4_create(napi_env env, napi_callback_info info) {
  bcrypto_rc4_t *rc4 =
    (bcrypto_rc4_t *)bcrypto_xmalloc(sizeof(bcrypto_rc4_t));
  napi_value handle;

  rc4->started = 0;

  CHECK(napi_create_external(env,
                             rc4,
                             bcrypto_rc4_destroy_,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_rc4_init(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *key;
  size_t key_len;
  bcrypto_rc4_t *rc4;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&rc4) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(key_len >= 1 && key_len <= 256, JS_ERR_KEY_SIZE);

  rc4_init(&rc4->ctx, key, key_len);
  rc4->started = 1;

  return argv[0];
}

static napi_value
bcrypto_rc4_encrypt(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *msg;
  size_t msg_len;
  bcrypto_rc4_t *rc4;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&rc4) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);

  JS_ASSERT(rc4->started, JS_ERR_INIT);

  rc4_encrypt(&rc4->ctx, msg, msg, msg_len);

  return argv[1];
}

static napi_value
bcrypto_rc4_destroy(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_rc4_t *rc4;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&rc4) == napi_ok);

  rc4->started = 0;

  return argv[0];
}

/*
 * RNG
 */

static void
bcrypto_rng_destroy(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_rng_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_rng_create(napi_env env, napi_callback_info info) {
  bcrypto_rng_t *rng;
  napi_value handle;

  rng = (bcrypto_rng_t *)bcrypto_xmalloc(sizeof(bcrypto_rng_t));
  rng->started = 0;

  CHECK(napi_create_external(env,
                             rng,
                             bcrypto_rng_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_rng_init(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_rng_t *rng;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&rng) == napi_ok);

  JS_ASSERT(rng_init(&rng->ctx), JS_ERR_RNG);

  rng->started = 1;

  return argv[0];
}

static napi_value
bcrypto_rng_generate(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t *out;
  size_t out_len;
  uint32_t off, size;
  bcrypto_rng_t *rng;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&rng) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&out, &out_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &off) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &size) == napi_ok);

  JS_ASSERT(rng->started, JS_ERR_INIT);
  JS_ASSERT(off + size >= size, JS_ERR_RNG);
  JS_ASSERT(off + size <= out_len, JS_ERR_RNG);

  if (size > 0)
    rng_generate(&rng->ctx, out + off, size);

  return argv[1];
}

static napi_value
bcrypto_rng_random(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint32_t out;
  bcrypto_rng_t *rng;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&rng) == napi_ok);

  JS_ASSERT(rng->started, JS_ERR_INIT);

  out = rng_random(&rng->ctx);

  CHECK(napi_create_uint32(env, out, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_rng_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t out, max;
  bcrypto_rng_t *rng;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&rng) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &max) == napi_ok);

  JS_ASSERT(rng->started, JS_ERR_INIT);

  out = rng_uniform(&rng->ctx, max);

  CHECK(napi_create_uint32(env, out, &result) == napi_ok);

  return result;
}

/* For testing. */
static napi_value
bcrypto_getentropy(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t *out;
  uint32_t out_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_uint32(env, argv[0], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  memset(out, 0, out_len);

  JS_ASSERT(torsion_getentropy(out, out_len), JS_ERR_RNG);

  return result;
}

/*
 * RSA
 */

static napi_value
bcrypto_rsa_privkey_generate(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[RSA_MAX_PRIV_SIZE];
  size_t out_len = RSA_MAX_PRIV_SIZE;
  uint32_t bits;
  int64_t exp;
  const uint8_t *entropy;
  size_t entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_uint32(env, argv[0], &bits) == napi_ok);
  CHECK(napi_get_value_int64(env, argv[1], &exp) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(rsa_privkey_generate(out, &out_len, bits, exp, entropy),
            JS_ERR_GENERATE);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);
  cleanse(out, out_len);

  return result;
}

typedef struct bcrypto_rsa_worker_s {
  uint32_t bits;
  int64_t exp;
  uint8_t entropy[ENTROPY_SIZE];
  uint8_t out[RSA_MAX_PRIV_SIZE];
  size_t out_len;
  const char *error;
  napi_async_work work;
  napi_deferred deferred;
} bcrypto_rsa_worker_t;

static void
bcrypto_rsa_execute_(napi_env env, void *data) {
  bcrypto_rsa_worker_t *w = (bcrypto_rsa_worker_t *)data;

  if (!rsa_privkey_generate(w->out, &w->out_len, w->bits, w->exp, w->entropy))
    w->error = JS_ERR_GENERATE;

  cleanse(w->entropy, ENTROPY_SIZE);
}

static void
bcrypto_rsa_complete_(napi_env env, napi_status status, void *data) {
  bcrypto_rsa_worker_t *w = (bcrypto_rsa_worker_t *)data;
  napi_value result, strval, errval;

  if (w->error == NULL && status == napi_ok)
    status = napi_create_buffer_copy(env, w->out_len, w->out, NULL, &result);

  if (status != napi_ok)
    w->error = JS_ERR_GENERATE;

  if (w->error == NULL) {
    CHECK(napi_resolve_deferred(env, w->deferred, result) == napi_ok);
  } else {
    CHECK(napi_create_string_latin1(env, w->error, NAPI_AUTO_LENGTH,
                                    &strval) == napi_ok);
    CHECK(napi_create_error(env, NULL, strval, &errval) == napi_ok);
    CHECK(napi_reject_deferred(env, w->deferred, errval) == napi_ok);
  }

  CHECK(napi_delete_async_work(env, w->work) == napi_ok);

  cleanse(w->out, w->out_len);

  bcrypto_free(w);
}

static napi_value
bcrypto_rsa_privkey_generate_async(napi_env env, napi_callback_info info) {
  bcrypto_rsa_worker_t *worker;
  napi_value argv[3];
  size_t argc = 3;
  uint32_t bits;
  int64_t exp;
  const uint8_t *entropy;
  size_t entropy_len;
  napi_value workname, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_uint32(env, argv[0], &bits) == napi_ok);
  CHECK(napi_get_value_int64(env, argv[1], &exp) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  worker = (bcrypto_rsa_worker_t *)bcrypto_xmalloc(sizeof(bcrypto_rsa_worker_t));
  worker->bits = bits;
  worker->exp = exp;
  worker->out_len = RSA_MAX_PRIV_SIZE;
  worker->error = NULL;

  memcpy(worker->entropy, entropy, ENTROPY_SIZE);

  CHECK(napi_create_string_latin1(env, "bcrypto:rsa_privkey_generate",
                                  NAPI_AUTO_LENGTH, &workname) == napi_ok);

  CHECK(napi_create_promise(env, &worker->deferred, &result) == napi_ok);

  CHECK(napi_create_async_work(env,
                               NULL,
                               workname,
                               bcrypto_rsa_execute_,
                               bcrypto_rsa_complete_,
                               worker,
                               &worker->work) == napi_ok);

  CHECK(napi_queue_async_work(env, worker->work) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_rsa_privkey_bits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  size_t bits;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  bits = rsa_privkey_bits(key, key_len);

  JS_ASSERT(bits != 0, JS_ERR_PRIVKEY);

  CHECK(napi_create_uint32(env, bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_rsa_privkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  const uint8_t *key;
  size_t key_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  ok = rsa_privkey_verify(key, key_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_rsa_privkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[RSA_MAX_PRIV_SIZE];
  size_t out_len = RSA_MAX_PRIV_SIZE;
  const uint8_t *key, *entropy;
  size_t key_len, entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(rsa_privkey_import(out, &out_len, key, key_len, entropy),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);
  cleanse((void *)key, key_len);
  cleanse(out, out_len);

  return result;
}

static napi_value
bcrypto_rsa_privkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[RSA_MAX_PRIV_SIZE];
  size_t out_len = RSA_MAX_PRIV_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(rsa_privkey_export(out, &out_len, key, key_len), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse(out, out_len);

  return result;
}

static napi_value
bcrypto_rsa_pubkey_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[RSA_MAX_PUB_SIZE];
  size_t out_len = RSA_MAX_PUB_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(rsa_pubkey_create(out, &out_len, key, key_len), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_rsa_pubkey_bits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  size_t bits;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  bits = rsa_pubkey_bits(key, key_len);

  JS_ASSERT(bits != 0, JS_ERR_PRIVKEY);

  CHECK(napi_create_uint32(env, bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_rsa_pubkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  const uint8_t *key;
  size_t key_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  ok = rsa_pubkey_verify(key, key_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_rsa_pubkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[RSA_MAX_PUB_SIZE];
  size_t out_len = RSA_MAX_PUB_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(rsa_pubkey_import(out, &out_len, key, key_len), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)key, key_len);

  return result;
}

static napi_value
bcrypto_rsa_pubkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[RSA_MAX_PUB_SIZE];
  size_t out_len = RSA_MAX_PUB_SIZE;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(rsa_pubkey_export(out, &out_len, key, key_len), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_rsa_sign(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[RSA_MAX_MOD_SIZE];
  size_t out_len = RSA_MAX_MOD_SIZE;
  uint32_t type;
  const uint8_t *msg, *key, *entropy;
  size_t msg_len, key_len, entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(rsa_sign(out, &out_len, type, msg, msg_len, key, key_len, entropy),
            JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_rsa_verify(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint32_t type;
  const uint8_t *msg, *sig, *key;
  size_t msg_len, sig_len, key_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&key, &key_len) == napi_ok);

  ok = rsa_verify(type, msg, msg_len, sig, sig_len, key, key_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_rsa_encrypt(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[RSA_MAX_MOD_SIZE];
  size_t out_len = RSA_MAX_MOD_SIZE;
  const uint8_t *msg, *key, *entropy;
  size_t msg_len, key_len, entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(rsa_encrypt(out, &out_len, msg, msg_len, key, key_len, entropy),
            JS_ERR_ENCRYPT);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_rsa_decrypt(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[RSA_MAX_MOD_SIZE];
  size_t out_len = RSA_MAX_MOD_SIZE;
  const uint8_t *msg, *key, *entropy;
  size_t msg_len, key_len, entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(rsa_decrypt(out, &out_len, msg, msg_len, key, key_len, entropy),
            JS_ERR_DECRYPT);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);
  cleanse(out, out_len);

  return result;
}

static napi_value
bcrypto_rsa_sign_pss(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[RSA_MAX_MOD_SIZE];
  size_t out_len = RSA_MAX_MOD_SIZE;
  uint32_t type;
  const uint8_t *msg, *key, *entropy;
  size_t msg_len, key_len, entropy_len;
  int32_t salt_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[3], &salt_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  ok = rsa_sign_pss(out, &out_len, type, msg, msg_len,
                    key, key_len, salt_len, entropy);

  JS_ASSERT(ok, JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_rsa_verify_pss(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint32_t type;
  const uint8_t *msg, *sig, *key;
  size_t msg_len, sig_len, key_len;
  int32_t salt_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[4], &salt_len) == napi_ok);

  ok = rsa_verify_pss(type, msg, msg_len, sig, sig_len, key, key_len, salt_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_rsa_encrypt_oaep(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[RSA_MAX_MOD_SIZE];
  size_t out_len = RSA_MAX_MOD_SIZE;
  uint32_t type;
  const uint8_t *msg, *key, *label, *entropy;
  size_t msg_len, key_len, label_len, entropy_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&label,
                             &label_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  ok = rsa_encrypt_oaep(out, &out_len, type, msg, msg_len,
                        key, key_len, label, label_len, entropy);

  JS_ASSERT(ok, JS_ERR_ENCRYPT);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_rsa_decrypt_oaep(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[RSA_MAX_MOD_SIZE];
  size_t out_len = RSA_MAX_MOD_SIZE;
  uint32_t type;
  const uint8_t *msg, *key, *label, *entropy;
  size_t msg_len, key_len, label_len, entropy_len;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&label,
                             &label_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[4], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  ok = rsa_decrypt_oaep(out, &out_len, type, msg, msg_len,
                        key, key_len, label, label_len, entropy);

  JS_ASSERT(ok, JS_ERR_DECRYPT);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_rsa_veil(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[RSA_MAX_MOD_SIZE + 1];
  size_t out_len = RSA_MAX_MOD_SIZE + 1;
  uint32_t bits;
  const uint8_t *msg, *key, *entropy;
  size_t msg_len, key_len, entropy_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &bits) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(bits <= RSA_MAX_MOD_BITS + 8, JS_ERR_VEIL);
  JS_ASSERT((bits + 7) / 8 <= out_len, JS_ERR_VEIL);
  JS_ASSERT(rsa_veil(out, &out_len, msg, msg_len, bits, key, key_len, entropy),
            JS_ERR_VEIL);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_rsa_unveil(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[RSA_MAX_MOD_SIZE];
  size_t out_len = RSA_MAX_MOD_SIZE;
  uint32_t bits;
  const uint8_t *msg, *key;
  size_t msg_len, key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &bits) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(rsa_unveil(out, &out_len, msg, msg_len, bits, key, key_len),
            JS_ERR_UNVEIL);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  cleanse(out, out_len);

  return result;
}

/*
 * Salsa20
 */

static void
bcrypto_salsa20_destroy_(napi_env env, void *data, void *hint) {
  cleanse(data, sizeof(bcrypto_salsa20_t));
  bcrypto_free(data);
}

static napi_value
bcrypto_salsa20_create(napi_env env, napi_callback_info info) {
  bcrypto_salsa20_t *salsa =
    (bcrypto_salsa20_t *)bcrypto_xmalloc(sizeof(bcrypto_salsa20_t));
  napi_value handle;

  salsa->started = 0;

  CHECK(napi_create_external(env,
                             salsa,
                             bcrypto_salsa20_destroy_,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_salsa20_init(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  const uint8_t *key, *nonce;
  size_t key_len, nonce_len;
  int64_t ctr;
  bcrypto_salsa20_t *salsa;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&salsa) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&nonce,
                             &nonce_len) == napi_ok);
  CHECK(napi_get_value_int64(env, argv[3], &ctr) == napi_ok);

  JS_ASSERT(key_len == 16 || key_len == 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(nonce_len == 8 || nonce_len == 12
         || nonce_len == 16 || nonce_len == 24
         || nonce_len == 28 || nonce_len == 32, JS_ERR_NONCE_SIZE);

  salsa20_init(&salsa->ctx, key, key_len, nonce, nonce_len, ctr);
  salsa->started = 1;

  return argv[0];
}

static napi_value
bcrypto_salsa20_encrypt(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t *msg;
  size_t msg_len;
  bcrypto_salsa20_t *salsa;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&salsa) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);

  JS_ASSERT(salsa->started, JS_ERR_INIT);

  salsa20_encrypt(&salsa->ctx, msg, msg, msg_len);

  return argv[1];
}

static napi_value
bcrypto_salsa20_destroy(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_salsa20_t *salsa;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&salsa) == napi_ok);

  salsa->started = 0;

  return argv[0];
}

static napi_value
bcrypto_salsa20_derive(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  const uint8_t *key, *nonce;
  size_t key_len, nonce_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&nonce,
                             &nonce_len) == napi_ok);

  JS_ASSERT(key_len == 16 || key_len == 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(nonce_len == 16, JS_ERR_NONCE_SIZE);

  salsa20_derive(out, key, key_len, nonce);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

/*
 * Schnorr
 */

static napi_value
bcrypto_schnorr_privkey_generate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *entropy;
  size_t entropy_len;
  uint8_t out[SCHNORR_MAX_PRIV_SIZE];
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  schnorr_privkey_generate(ec->ctx, out, entropy);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_schnorr_privkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  ok = priv_len == ec->scalar_size && schnorr_privkey_verify(ec->ctx, priv);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_privkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t d[SCHNORR_MAX_PRIV_SIZE];
  uint8_t x[WEI_MAX_FIELD_SIZE];
  uint8_t y[WEI_MAX_FIELD_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value bd, bx, by, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(schnorr_privkey_export(ec->ctx, d, x, y, priv), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, ec->scalar_size, d, NULL, &bd) == napi_ok);
  CHECK(napi_create_buffer_copy(env, ec->field_size, x, NULL, &bx) == napi_ok);
  CHECK(napi_create_buffer_copy(env, ec->field_size, y, NULL, &by) == napi_ok);

  CHECK(napi_create_array_with_length(env, 3, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, bd) == napi_ok);
  CHECK(napi_set_element(env, result, 1, bx) == napi_ok);
  CHECK(napi_set_element(env, result, 2, by) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_privkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[SCHNORR_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(schnorr_privkey_import(ec->ctx, out, priv, priv_len),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_privkey_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[SCHNORR_MAX_PRIV_SIZE];
  const uint8_t *priv, *tweak;
  size_t priv_len, tweak_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(schnorr_privkey_tweak_add(ec->ctx, out, priv, tweak),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_privkey_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[SCHNORR_MAX_PRIV_SIZE];
  const uint8_t *priv, *tweak;
  size_t priv_len, tweak_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(schnorr_privkey_tweak_mul(ec->ctx, out, priv, tweak),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_privkey_reduce(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[SCHNORR_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(schnorr_privkey_reduce(ec->ctx, out, priv, priv_len),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_privkey_invert(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[SCHNORR_MAX_PRIV_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(schnorr_privkey_invert(ec->ctx, out, priv), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->scalar_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_create(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[SCHNORR_MAX_PUB_SIZE];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(schnorr_pubkey_create(ec->ctx, out, priv), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_from_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[SCHNORR_MAX_PUB_SIZE];
  const uint8_t *data;
  size_t data_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len == ec->field_size, JS_ERR_PREIMAGE_SIZE);

  schnorr_pubkey_from_uniform(ec->ctx, out, data);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_to_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[WEI_MAX_FIELD_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  uint32_t hint;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &hint) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(schnorr_pubkey_to_uniform(ec->ctx, out, pub, hint), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size,
                                out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_from_hash(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[SCHNORR_MAX_PUB_SIZE];
  const uint8_t *data;
  size_t data_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len == ec->field_size * 2, JS_ERR_PREIMAGE_SIZE);
  JS_ASSERT(schnorr_pubkey_from_hash(ec->ctx, out, data), JS_ERR_PREIMAGE);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_to_hash(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[WEI_MAX_FIELD_SIZE * 2];
  const uint8_t *pub, *entropy;
  size_t pub_len, entropy_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(schnorr_pubkey_to_hash(ec->ctx, out, pub, 0, entropy),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size * 2,
                                out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = pub_len == ec->field_size && schnorr_pubkey_verify(ec->ctx, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t x[WEI_MAX_FIELD_SIZE];
  uint8_t y[WEI_MAX_FIELD_SIZE];
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value bx, by, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(schnorr_pubkey_export(ec->ctx, x, y, pub), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, ec->field_size, x, NULL, &bx) == napi_ok);
  CHECK(napi_create_buffer_copy(env, ec->field_size, y, NULL, &by) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, bx) == napi_ok);
  CHECK(napi_set_element(env, result, 1, by) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[SCHNORR_MAX_PUB_SIZE];
  const uint8_t *x;
  size_t x_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&x, &x_len) == napi_ok);

  JS_ASSERT(schnorr_pubkey_import(ec->ctx, out, x, x_len), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[SCHNORR_MAX_PUB_SIZE];
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(schnorr_pubkey_tweak_add(ec->ctx, out, NULL, pub, tweak),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[SCHNORR_MAX_PUB_SIZE];
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(schnorr_pubkey_tweak_mul(ec->ctx, out, NULL, pub, tweak),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_tweak_sum(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[SCHNORR_MAX_PUB_SIZE];
  int negated;
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bcrypto_wei_curve_t *ec;
  napi_value outval, negval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(tweak_len == ec->scalar_size, JS_ERR_SCALAR_SIZE);
  JS_ASSERT(schnorr_pubkey_tweak_add(ec->ctx, out, &negated, pub, tweak),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &outval) == napi_ok);

  CHECK(napi_get_boolean(env, negated, &negval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, outval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, negval) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_tweak_test(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  const uint8_t *pub, *tweak, *expect;
  size_t pub_len, tweak_len, expect_len;
  bool negated;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&expect,
                             &expect_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[4], &negated) == napi_ok);

  if (pub_len != ec->field_size
      || tweak_len != ec->scalar_size
      || expect_len != ec->field_size) {
    goto fail;
  }

  schnorr_pubkey_tweak_test(ec->ctx, &ok, pub, tweak, expect, negated);

fail:
  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_pubkey_combine(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[SCHNORR_MAX_PUB_SIZE];
  uint32_t i, length;
  const uint8_t **pubs;
  size_t pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value item, result;
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);

  JS_ASSERT(length != 0, JS_ERR_PUBKEY);

  pubs = (const uint8_t **)bcrypto_malloc(length * sizeof(uint8_t *));

  if (pubs == NULL)
    goto fail;

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_buffer_info(env, item, (void **)&pubs[i],
                               &pub_len) == napi_ok);

    if (pub_len != ec->field_size)
      goto fail;
  }

  ok = schnorr_pubkey_combine(ec->ctx, out, pubs, length);

fail:
  bcrypto_free(pubs);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_sign(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[SCHNORR_MAX_SIG_SIZE];
  const uint8_t *msg, *priv, *aux;
  size_t msg_len, priv_len, aux_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&aux, &aux_len) == napi_ok);

  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(aux_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(schnorr_sign(ec->ctx, out, msg, msg_len, priv, aux), JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env,
                                ec->schnorr_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_verify(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  const uint8_t *msg, *sig, *pub;
  size_t msg_len, sig_len, pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);

  ok = sig_len == ec->schnorr_size
    && pub_len == ec->field_size
    && schnorr_verify(ec->ctx, msg, msg_len, sig, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_verify_batch(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t i, length, item_len;
  const uint8_t **ptrs, **msgs, **pubs, **sigs;
  size_t *lens, *msg_lens;
  size_t sig_len, pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value item, result;
  napi_value items[3];
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);

  if (length == 0) {
    CHECK(napi_get_boolean(env, true, &result) == napi_ok);
    return result;
  }

  ptrs = (const uint8_t **)bcrypto_malloc(3 * length * sizeof(uint8_t *));
  lens = (size_t *)bcrypto_malloc(1 * length * sizeof(size_t));

  if (ptrs == NULL || lens == NULL)
    goto fail;

  msgs = &ptrs[length * 0];
  pubs = &ptrs[length * 1];
  sigs = &ptrs[length * 2];
  msg_lens = &lens[length * 0];

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_array_length(env, item, &item_len) == napi_ok);
    CHECK(item_len == 3);

    CHECK(napi_get_element(env, item, 0, &items[0]) == napi_ok);
    CHECK(napi_get_element(env, item, 1, &items[1]) == napi_ok);
    CHECK(napi_get_element(env, item, 2, &items[2]) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[0], (void **)&msgs[i],
                               &msg_lens[i]) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[1], (void **)&sigs[i],
                               &sig_len) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[2], (void **)&pubs[i],
                               &pub_len) == napi_ok);

    if (sig_len != ec->schnorr_size || pub_len != ec->field_size)
      goto fail;
  }

  if (ec->scratch == NULL)
    ec->scratch = wei_scratch_create(ec->ctx, SCRATCH_SIZE);

  CHECK(ec->scratch != NULL);

  ok = schnorr_verify_batch(ec->ctx, msgs, msg_lens, sigs,
                            pubs, length, ec->scratch);

fail:
  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(ptrs);
  bcrypto_free(lens);

  return result;
}

static napi_value
bcrypto_schnorr_derive(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[SCHNORR_MAX_PUB_SIZE];
  const uint8_t *pub, *priv;
  size_t pub_len, priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(pub_len == ec->field_size, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(schnorr_derive(ec->ctx, out, pub, priv), JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env,
                                ec->field_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

/*
 * Schnorr Legacy
 */

static napi_value
bcrypto_schnorr_legacy_sign(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[SCHNORR_LEGACY_MAX_SIG_SIZE];
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(schnorr_legacy_support(ec->ctx), JS_ERR_NO_SCHNORR);
  JS_ASSERT(priv_len == ec->scalar_size, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(schnorr_legacy_sign(ec->ctx, out, msg, msg_len, priv), JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env,
                                ec->legacy_size,
                                out,
                                NULL,
                                &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_legacy_verify(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  const uint8_t *msg, *sig, *pub;
  size_t msg_len, sig_len, pub_len;
  bcrypto_wei_curve_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);

  JS_ASSERT(schnorr_legacy_support(ec->ctx), JS_ERR_NO_SCHNORR);

  ok = sig_len == ec->legacy_size
    && schnorr_legacy_verify(ec->ctx, msg, msg_len, sig, pub, pub_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_schnorr_legacy_verify_batch(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t i, length, item_len;
  const uint8_t **ptrs, **msgs, **pubs, **sigs;
  size_t *lens, *msg_lens, *pub_lens;
  size_t sig_len;
  bcrypto_wei_curve_t *ec;
  napi_value item, result;
  napi_value items[3];
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);

  JS_ASSERT(schnorr_legacy_support(ec->ctx), JS_ERR_NO_SCHNORR);

  if (length == 0) {
    CHECK(napi_get_boolean(env, true, &result) == napi_ok);
    return result;
  }

  ptrs = (const uint8_t **)bcrypto_malloc(3 * length * sizeof(uint8_t *));
  lens = (size_t *)bcrypto_malloc(2 * length * sizeof(size_t));

  if (ptrs == NULL || lens == NULL)
    goto fail;

  msgs = &ptrs[length * 0];
  pubs = &ptrs[length * 1];
  sigs = &ptrs[length * 2];
  msg_lens = &lens[length * 0];
  pub_lens = &lens[length * 1];

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_array_length(env, item, &item_len) == napi_ok);
    CHECK(item_len == 3);

    CHECK(napi_get_element(env, item, 0, &items[0]) == napi_ok);
    CHECK(napi_get_element(env, item, 1, &items[1]) == napi_ok);
    CHECK(napi_get_element(env, item, 2, &items[2]) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[0], (void **)&msgs[i],
                               &msg_lens[i]) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[1], (void **)&sigs[i],
                               &sig_len) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[2], (void **)&pubs[i],
                               &pub_lens[i]) == napi_ok);

    if (sig_len != ec->legacy_size)
      goto fail;
  }

  if (ec->scratch == NULL)
    ec->scratch = wei_scratch_create(ec->ctx, SCRATCH_SIZE);

  CHECK(ec->scratch != NULL);

  ok = schnorr_legacy_verify_batch(ec->ctx, msgs, msg_lens, sigs,
                                   pubs, pub_lens, length, ec->scratch);

fail:
  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(ptrs);
  bcrypto_free(lens);

  return result;
}

/*
 * Scrypt
 */

static napi_value
bcrypto_scrypt_derive(napi_env env, napi_callback_info info) {
  napi_value argv[6];
  size_t argc = 6;
  uint8_t *out;
  uint32_t out_len;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  int64_t N;
  uint32_t r, p;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 6);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_int64(env, argv[2], &N) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &r) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[4], &p) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[5], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  ok = scrypt_derive(out, pass, pass_len, salt, salt_len, N, r, p, out_len);

  JS_ASSERT(ok, JS_ERR_DERIVE);

  return result;
}

typedef struct bcrypto_scrypt_worker_s {
  uint8_t *pass;
  size_t pass_len;
  uint8_t *salt;
  size_t salt_len;
  int64_t N;
  uint32_t r;
  uint32_t p;
  uint8_t *out;
  uint32_t out_len;
  const char *error;
  napi_async_work work;
  napi_deferred deferred;
} bcrypto_scrypt_worker_t;

static void
bcrypto_scrypt_execute_(napi_env env, void *data) {
  bcrypto_scrypt_worker_t *w = (bcrypto_scrypt_worker_t *)data;

  if (!scrypt_derive(w->out, w->pass, w->pass_len,
                     w->salt, w->salt_len, w->N, w->r, w->p, w->out_len)) {
    w->error = JS_ERR_DERIVE;
  }

  cleanse(w->pass, w->pass_len);
  cleanse(w->salt, w->salt_len);
}

static void
bcrypto_scrypt_complete_(napi_env env, napi_status status, void *data) {
  bcrypto_scrypt_worker_t *w = (bcrypto_scrypt_worker_t *)data;
  napi_value result, strval, errval;

  if (w->error == NULL && status == napi_ok)
    status = napi_create_buffer_copy(env, w->out_len, w->out, NULL, &result);

  if (status != napi_ok)
    w->error = JS_ERR_DERIVE;

  if (w->error == NULL) {
    CHECK(napi_resolve_deferred(env, w->deferred, result) == napi_ok);
  } else {
    CHECK(napi_create_string_latin1(env, w->error, NAPI_AUTO_LENGTH,
                                    &strval) == napi_ok);
    CHECK(napi_create_error(env, NULL, strval, &errval) == napi_ok);
    CHECK(napi_reject_deferred(env, w->deferred, errval) == napi_ok);
  }

  CHECK(napi_delete_async_work(env, w->work) == napi_ok);

  bcrypto_free(w->pass);
  bcrypto_free(w->salt);
  bcrypto_free(w->out);
  bcrypto_free(w);
}

static napi_value
bcrypto_scrypt_derive_async(napi_env env, napi_callback_info info) {
  bcrypto_scrypt_worker_t *worker;
  napi_value argv[6];
  size_t argc = 6;
  uint8_t *out;
  uint32_t out_len;
  const uint8_t *pass, *salt;
  size_t pass_len, salt_len;
  int64_t N;
  uint32_t r, p;
  napi_value workname, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 6);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&pass,
                             &pass_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&salt,
                             &salt_len) == napi_ok);
  CHECK(napi_get_value_int64(env, argv[2], &N) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &r) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[4], &p) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[5], &out_len) == napi_ok);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  out = (uint8_t *)bcrypto_malloc(out_len);

  JS_ASSERT(out != NULL || out_len == 0, JS_ERR_ALLOC);

  worker = (bcrypto_scrypt_worker_t *)bcrypto_xmalloc(sizeof(bcrypto_scrypt_worker_t));
  worker->pass = (uint8_t *)bcrypto_malloc(pass_len);
  worker->pass_len = pass_len;
  worker->salt = (uint8_t *)bcrypto_malloc(salt_len);
  worker->salt_len = salt_len;
  worker->N = N;
  worker->r = r;
  worker->p = p;
  worker->out = out;
  worker->out_len = out_len;
  worker->error = NULL;

  if ((worker->pass == NULL && pass_len != 0)
      || (worker->salt == NULL && salt_len != 0)) {
    bcrypto_free(worker->pass);
    bcrypto_free(worker->salt);
    bcrypto_free(worker->out);
    bcrypto_free(worker);
    JS_THROW(JS_ERR_DERIVE);
  }

  memcpy(worker->pass, pass, pass_len);
  memcpy(worker->salt, salt, salt_len);

  CHECK(napi_create_string_latin1(env, "bcrypto:scrypt_derive",
                                  NAPI_AUTO_LENGTH, &workname) == napi_ok);

  CHECK(napi_create_promise(env, &worker->deferred, &result) == napi_ok);

  CHECK(napi_create_async_work(env,
                               NULL,
                               workname,
                               bcrypto_scrypt_execute_,
                               bcrypto_scrypt_complete_,
                               worker,
                               &worker->work) == napi_ok);

  CHECK(napi_queue_async_work(env, worker->work) == napi_ok);

  return result;
}

/*
 * Secp256k1
 */

#ifdef BCRYPTO_USE_SECP256K1
static void
bcrypto_secp256k1_destroy(napi_env env, void *data, void *hint) {
  bcrypto_secp256k1_t *ec = (bcrypto_secp256k1_t *)data;

  if (ec->scratch != NULL) {
#ifdef BCRYPTO_USE_SECP256K1_LATEST
    secp256k1_scratch_space_destroy(ec->ctx, ec->scratch);
#else
    secp256k1_scratch_space_destroy(ec->scratch);
#endif
  }

  secp256k1_context_destroy(ec->ctx);
  bcrypto_free(ec);
}

static napi_value
bcrypto_secp256k1_context_create(napi_env env, napi_callback_info info) {
  static const int flags = SECP256K1_CONTEXT_SIGN | SECP256K1_CONTEXT_VERIFY;
  bcrypto_secp256k1_t *ec;
  secp256k1_context *ctx;
  napi_value handle;

  JS_ASSERT(ctx = secp256k1_context_create(flags), JS_ERR_CONTEXT);

  ec = (bcrypto_secp256k1_t *)bcrypto_xmalloc(sizeof(bcrypto_secp256k1_t));
  ec->ctx = ctx;
  ec->scratch = NULL;

  CHECK(napi_create_external(env,
                             ec,
                             bcrypto_secp256k1_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_secp256k1_context_randomize(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *entropy;
  size_t entropy_len;
  bcrypto_secp256k1_t *ec;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == 32, JS_ERR_ENTROPY_SIZE);
  JS_ASSERT(secp256k1_context_randomize(ec->ctx, entropy), JS_ERR_RANDOM);

  cleanse((void *)entropy, entropy_len);

  return argv[0];
}

static napi_value
bcrypto_secp256k1_privkey_generate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *entropy;
  size_t entropy_len;
  uint8_t out[32];
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  CHECK(secp256k1_ec_privkey_generate(ec->ctx, out, entropy));

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_secp256k1_privkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  ok = priv_len == 32 && secp256k1_ec_seckey_verify(ec->ctx, priv);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_privkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(secp256k1_ec_privkey_export(ec->ctx, out, priv), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_privkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(secp256k1_ec_privkey_import(ec->ctx, out, priv, priv_len),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_privkey_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  const uint8_t *priv, *tweak;
  size_t priv_len, tweak_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(tweak_len == 32, JS_ERR_SCALAR_SIZE);

  memcpy(out, priv, 32);

  JS_ASSERT(secp256k1_ec_privkey_tweak_add(ec->ctx, out, tweak),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_privkey_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  const uint8_t *priv, *tweak;
  size_t priv_len, tweak_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(tweak_len == 32, JS_ERR_SCALAR_SIZE);

  memcpy(out, priv, 32);

  JS_ASSERT(secp256k1_ec_privkey_tweak_mul(ec->ctx, out, tweak),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_privkey_reduce(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(secp256k1_ec_privkey_reduce(ec->ctx, out, priv, priv_len),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_privkey_negate(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);

  memcpy(out, priv, 32);

  JS_ASSERT(secp256k1_ec_privkey_negate_safe(ec->ctx, out), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_privkey_invert(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);

  memcpy(out, priv, 32);

  JS_ASSERT(secp256k1_ec_privkey_invert(ec->ctx, out), JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_create(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_pubkey pubkey;
  const uint8_t *priv;
  size_t priv_len;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(secp256k1_ec_pubkey_create(ec->ctx, &pubkey, priv), JS_ERR_PRIVKEY);

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_convert(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_pubkey pubkey;
  const uint8_t *pub;
  size_t pub_len;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len),
            JS_ERR_PUBKEY);

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_from_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_pubkey pubkey;
  const uint8_t *data;
  size_t data_len;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(data_len == 32, JS_ERR_PREIMAGE_SIZE);

  CHECK(secp256k1_ec_pubkey_from_uniform(ec->ctx, &pubkey, data));

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_to_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  const uint8_t *pub;
  size_t pub_len;
  secp256k1_pubkey pubkey;
  uint32_t hint;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &hint) == napi_ok);

  JS_ASSERT(secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len),
            JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_ec_pubkey_to_uniform(ec->ctx, out, &pubkey, hint),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_from_hash(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_pubkey pubkey;
  const uint8_t *data;
  size_t data_len;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(data_len == 64, JS_ERR_PREIMAGE_SIZE);
  JS_ASSERT(secp256k1_ec_pubkey_from_hash(ec->ctx, &pubkey, data),
            JS_ERR_PREIMAGE);

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_to_hash(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[64];
  const uint8_t *pub, *entropy;
  size_t pub_len, entropy_len;
  secp256k1_pubkey pubkey;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  JS_ASSERT(secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len),
            JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_ec_pubkey_to_hash(ec->ctx, out, &pubkey, entropy),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, 64, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  secp256k1_pubkey pubkey;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t x[32];
  uint8_t y[32];
  const uint8_t *pub;
  size_t pub_len;
  secp256k1_pubkey pubkey;
  bcrypto_secp256k1_t *ec;
  napi_value bx, by, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  JS_ASSERT(secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len),
            JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_ec_pubkey_export(ec->ctx, x, y, &pubkey),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, 32, x, NULL, &bx) == napi_ok);
  CHECK(napi_create_buffer_copy(env, 32, y, NULL, &by) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, bx) == napi_ok);
  CHECK(napi_set_element(env, result, 1, by) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_import(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_pubkey pubkey;
  const uint8_t *x, *y;
  size_t x_len, y_len;
  int32_t sign;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&x, &x_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&y, &y_len) == napi_ok);
  CHECK(napi_get_value_int32(env, argv[3], &sign) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[4], &compress) == napi_ok);

  ok = secp256k1_ec_pubkey_import(ec->ctx, &pubkey, x, x_len, y, y_len, sign);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_pubkey pubkey;
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[3], &compress) == napi_ok);

  JS_ASSERT(tweak_len == 32, JS_ERR_SCALAR_SIZE);

  JS_ASSERT(secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len),
            JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_ec_pubkey_tweak_add(ec->ctx, &pubkey, tweak),
            JS_ERR_PUBKEY);

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_pubkey pubkey;
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[3], &compress) == napi_ok);

  JS_ASSERT(tweak_len == 32, JS_ERR_SCALAR_SIZE);

  JS_ASSERT(secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len),
            JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_ec_pubkey_tweak_mul(ec->ctx, &pubkey, tweak),
            JS_ERR_PUBKEY);

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_combine(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_pubkey pubkey;
  uint32_t i, length;
  secp256k1_pubkey **pubkeys;
  secp256k1_pubkey *pubkey_data;
  const uint8_t *pub;
  size_t pub_len;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value item, result;
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(length != 0, JS_ERR_PUBKEY);

  pubkeys = (secp256k1_pubkey **)bcrypto_malloc(length * sizeof(secp256k1_pubkey *));
  pubkey_data = (secp256k1_pubkey *)bcrypto_malloc(length * sizeof(secp256k1_pubkey));

  if (pubkeys == NULL || pubkey_data == NULL)
    goto fail;

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_buffer_info(env, item, (void **)&pub,
                               &pub_len) == napi_ok);

    if (!secp256k1_ec_pubkey_parse(ec->ctx, &pubkey_data[i], pub, pub_len))
      goto fail;

    pubkeys[i] = &pubkey_data[i];
  }

  ok = secp256k1_ec_pubkey_combine(ec->ctx, &pubkey,
                                   (const secp256k1_pubkey *const *)pubkeys,
                                   length);

fail:
  bcrypto_free(pubkeys);
  bcrypto_free(pubkey_data);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_pubkey_negate(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_pubkey pubkey;
  const uint8_t *pub;
  size_t pub_len;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[2], &compress) == napi_ok);

  JS_ASSERT(secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len),
            JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_ec_pubkey_negate(ec->ctx, &pubkey), JS_ERR_PUBKEY);

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_signature_normalize(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[64];
  const uint8_t *sig;
  size_t sig_len;
  secp256k1_ecdsa_signature sigin;
  secp256k1_ecdsa_signature sigout;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  JS_ASSERT(sig_len == 64, JS_ERR_SIGNATURE_SIZE);

  JS_ASSERT(secp256k1_ecdsa_signature_parse_compact(ec->ctx, &sigin, sig),
            JS_ERR_SIGNATURE);

  secp256k1_ecdsa_signature_normalize(ec->ctx, &sigout, &sigin);
  secp256k1_ecdsa_signature_serialize_compact(ec->ctx, out, &sigout);

  CHECK(napi_create_buffer_copy(env, 64, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_signature_normalize_der(napi_env env,
                                          napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[72];
  size_t out_len = 72;
  const uint8_t *sig;
  size_t sig_len;
  secp256k1_ecdsa_signature sigin;
  secp256k1_ecdsa_signature sigout;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  ok = ecdsa_signature_parse_der_lax(ec->ctx, &sigin, sig, sig_len);
  JS_ASSERT(ok, JS_ERR_SIGNATURE);

  secp256k1_ecdsa_signature_normalize(ec->ctx, &sigout, &sigin);

  ok = secp256k1_ecdsa_signature_serialize_der(ec->ctx, out, &out_len, &sigout);
  JS_ASSERT(ok, JS_ERR_SIGNATURE);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_signature_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[72];
  size_t out_len = 72;
  secp256k1_ecdsa_signature sigin;
  const uint8_t *sig;
  size_t sig_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  JS_ASSERT(sig_len == 64, JS_ERR_SIGNATURE_SIZE);

  ok = secp256k1_ecdsa_signature_parse_compact(ec->ctx, &sigin, sig)
    && secp256k1_ecdsa_signature_serialize_der(ec->ctx, out, &out_len, &sigin);

  JS_ASSERT(ok, JS_ERR_SIGNATURE);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_signature_import(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[64];
  const uint8_t *sig;
  size_t sig_len;
  secp256k1_ecdsa_signature sigin;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  JS_ASSERT(ecdsa_signature_parse_der_lax(ec->ctx, &sigin, sig, sig_len),
            JS_ERR_SIGNATURE);

  secp256k1_ecdsa_signature_serialize_compact(ec->ctx, out, &sigin);

  CHECK(napi_create_buffer_copy(env, 64, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_is_low_s(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *sig;
  size_t sig_len;
  secp256k1_ecdsa_signature sigin;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  ok = sig_len == 64
    && secp256k1_ecdsa_signature_parse_compact(ec->ctx, &sigin, sig)
    && !secp256k1_ecdsa_signature_normalize(ec->ctx, NULL, &sigin);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_is_low_der(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *sig;
  size_t sig_len;
  secp256k1_ecdsa_signature sigin;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&sig,
                             &sig_len) == napi_ok);

  ok = ecdsa_signature_parse_der_lax(ec->ctx, &sigin, sig, sig_len)
    && !secp256k1_ecdsa_signature_normalize(ec->ctx, NULL, &sigin);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_sign(napi_env env, napi_callback_info info) {
  secp256k1_nonce_function noncefn = secp256k1_nonce_function_rfc6979;
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[64];
  secp256k1_ecdsa_signature sigout;
  unsigned char msg32[32];
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);

  secp256k1_ecdsa_reduce(ec->ctx, msg32, msg, msg_len);

  JS_ASSERT(secp256k1_ecdsa_sign(ec->ctx, &sigout, msg32, priv, noncefn, NULL),
            JS_ERR_SIGN);

  secp256k1_ecdsa_signature_serialize_compact(ec->ctx, out, &sigout);

  CHECK(napi_create_buffer_copy(env, 64, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_sign_recoverable(napi_env env, napi_callback_info info) {
  secp256k1_nonce_function noncefn = secp256k1_nonce_function_rfc6979;
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[64];
  secp256k1_ecdsa_recoverable_signature sigout;
  unsigned char msg32[32];
  int param;
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value sigval, paramval, result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);

  secp256k1_ecdsa_reduce(ec->ctx, msg32, msg, msg_len);

  ok = secp256k1_ecdsa_sign_recoverable(ec->ctx, &sigout, msg32,
                                        priv, noncefn, NULL);
  JS_ASSERT(ok, JS_ERR_SIGN);

  secp256k1_ecdsa_recoverable_signature_serialize_compact(ec->ctx, out,
                                                          &param, &sigout);

  CHECK(napi_create_buffer_copy(env, 64, out, NULL, &sigval) == napi_ok);
  CHECK(napi_create_uint32(env, param, &paramval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, sigval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, paramval) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_sign_der(napi_env env, napi_callback_info info) {
  secp256k1_nonce_function noncefn = secp256k1_nonce_function_rfc6979;
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[72];
  size_t out_len = 72;
  secp256k1_ecdsa_signature sigout;
  unsigned char msg32[32];
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);

  secp256k1_ecdsa_reduce(ec->ctx, msg32, msg, msg_len);

  ok = secp256k1_ecdsa_sign(ec->ctx, &sigout, msg32, priv, noncefn, NULL)
    && secp256k1_ecdsa_signature_serialize_der(ec->ctx, out, &out_len, &sigout);

  JS_ASSERT(ok, JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_sign_recoverable_der(napi_env env, napi_callback_info info) {
  secp256k1_nonce_function noncefn = secp256k1_nonce_function_rfc6979;
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[72];
  size_t out_len = 72;
  secp256k1_ecdsa_recoverable_signature sigout;
  secp256k1_ecdsa_signature cmpct;
  unsigned char msg32[32];
  int param;
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value sigval, paramval, result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);

  secp256k1_ecdsa_reduce(ec->ctx, msg32, msg, msg_len);

  ok = secp256k1_ecdsa_sign_recoverable(ec->ctx, &sigout, msg32,
                                        priv, noncefn, NULL);
  JS_ASSERT(ok, JS_ERR_SIGN);

  secp256k1_ecdsa_recoverable_signature_serialize_compact(ec->ctx, out,
                                                          &param, &sigout);

  ok = secp256k1_ecdsa_signature_parse_compact(ec->ctx, &cmpct, out)
    && secp256k1_ecdsa_signature_serialize_der(ec->ctx, out, &out_len, &cmpct);

  JS_ASSERT(ok, JS_ERR_SIGN);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &sigval) == napi_ok);
  CHECK(napi_create_uint32(env, param, &paramval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, sigval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, paramval) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_verify(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  secp256k1_ecdsa_signature sigin;
  secp256k1_pubkey pubkey;
  unsigned char msg32[32];
  const uint8_t *msg, *sig, *pub;
  size_t msg_len, sig_len, pub_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);

  ok = sig_len == 64
    && secp256k1_ecdsa_signature_parse_compact(ec->ctx, &sigin, sig)
    && secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len);

  if (ok) {
    secp256k1_ecdsa_signature_normalize(ec->ctx, &sigin, &sigin);
    secp256k1_ecdsa_reduce(ec->ctx, msg32, msg, msg_len);

    ok = secp256k1_ecdsa_verify(ec->ctx, &sigin, msg32, &pubkey);
  }

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_verify_der(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  secp256k1_ecdsa_signature sigin;
  secp256k1_pubkey pubkey;
  unsigned char msg32[32];
  const uint8_t *msg, *sig, *pub;
  size_t msg_len, sig_len, pub_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);

  ok = ecdsa_signature_parse_der_lax(ec->ctx, &sigin, sig, sig_len)
    && secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len);

  if (ok) {
    secp256k1_ecdsa_signature_normalize(ec->ctx, &sigin, &sigin);
    secp256k1_ecdsa_reduce(ec->ctx, msg32, msg, msg_len);

    ok = secp256k1_ecdsa_verify(ec->ctx, &sigin, msg32, &pubkey);
  }

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_recover(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  uint8_t out[65];
  size_t out_len = 65;
  secp256k1_ecdsa_recoverable_signature sigin;
  secp256k1_pubkey pubkey;
  unsigned char msg32[32];
  const uint8_t *msg, *sig;
  size_t msg_len, sig_len;
  uint32_t parm;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &parm) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[4], &compress) == napi_ok);

  JS_ASSERT((parm & 3) == parm, JS_ERR_RECOVERY_PARAM);

  if (sig_len != 64)
    goto fail;

  if (!secp256k1_ecdsa_recoverable_signature_parse_compact(ec->ctx,
                                                           &sigin,
                                                           sig,
                                                           parm)) {
    goto fail;
  }

  secp256k1_ecdsa_reduce(ec->ctx, msg32, msg, msg_len);

  if (!secp256k1_ecdsa_recover(ec->ctx, &pubkey, &sigin, msg32))
    goto fail;

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
fail:
  CHECK(napi_get_null(env, &result) == napi_ok);
  return result;
}

static napi_value
bcrypto_secp256k1_recover_der(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  secp256k1_ecdsa_recoverable_signature sigin;
  secp256k1_pubkey pubkey;
  secp256k1_ecdsa_signature orig;
  unsigned char tmp[64];
  uint8_t out[65];
  size_t out_len = 65;
  unsigned char msg32[32];
  const uint8_t *msg, *sig;
  size_t msg_len, sig_len;
  uint32_t parm;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &parm) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[4], &compress) == napi_ok);

  JS_ASSERT((parm & 3) == parm, JS_ERR_RECOVERY_PARAM);

  if (!ecdsa_signature_parse_der_lax(ec->ctx, &orig, sig, sig_len))
    goto fail;

  secp256k1_ecdsa_signature_serialize_compact(ec->ctx, tmp, &orig);

  if (!secp256k1_ecdsa_recoverable_signature_parse_compact(ec->ctx,
                                                           &sigin,
                                                           tmp,
                                                           parm)) {
    goto fail;
  }

  secp256k1_ecdsa_reduce(ec->ctx, msg32, msg, msg_len);

  if (!secp256k1_ecdsa_recover(ec->ctx, &pubkey, &sigin, msg32))
    goto fail;

  secp256k1_ec_pubkey_serialize(ec->ctx, out, &out_len, &pubkey,
    compress ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED);

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
fail:
  CHECK(napi_get_null(env, &result) == napi_ok);
  return result;
}

static int
ecdh_hash_function_raw(unsigned char *out,
                       const unsigned char *x,
                       const unsigned char *y,
                       void *data) {
  bool compress = *((bool *)data);

  if (compress) {
    out[0] = 0x02 | (y[31] & 1);
    memcpy(out + 1, x, 32);
  } else {
    out[0] = 0x04;
    memcpy(out + 1, x, 32);
    memcpy(out + 33, y, 32);
  }

  return 1;
}

static napi_value
bcrypto_secp256k1_derive(napi_env env, napi_callback_info info) {
  secp256k1_ecdh_hash_function hashfp = ecdh_hash_function_raw;
  napi_value argv[4];
  size_t argc = 4;
  secp256k1_pubkey pubkey;
  uint8_t out[65];
  size_t out_len = 65;
  const uint8_t *pub, *priv;
  size_t pub_len, priv_len;
  bool compress;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[3], &compress) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);

  JS_ASSERT(secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len),
            JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_ecdh(ec->ctx, out, &pubkey, priv, hashfp, &compress),
            JS_ERR_PUBKEY);

  if (compress)
    out_len = 33;

  CHECK(napi_create_buffer_copy(env, out_len, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_schnorr_legacy_sign(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  secp256k1_schnorrleg sigout;
  uint8_t out[64];
  const uint8_t *msg, *priv;
  size_t msg_len, priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(secp256k1_schnorrleg_sign(ec->ctx, &sigout, msg, msg_len, priv),
            JS_ERR_SIGN);

  secp256k1_schnorrleg_serialize(ec->ctx, out, &sigout);

  CHECK(napi_create_buffer_copy(env, 64, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_schnorr_legacy_verify(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  const uint8_t *msg, *sig, *pub;
  size_t msg_len, sig_len, pub_len;
  secp256k1_schnorrleg sigin;
  secp256k1_pubkey pubkey;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);

  ok = sig_len == 64
    && secp256k1_schnorrleg_parse(ec->ctx, &sigin, sig)
    && secp256k1_ec_pubkey_parse(ec->ctx, &pubkey, pub, pub_len)
    && secp256k1_schnorrleg_verify(ec->ctx, &sigin, msg, msg_len, &pubkey);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_schnorr_legacy_verify_batch(napi_env env,
                                              napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t i, length, item_len;
  const uint8_t *sig, *pub;
  size_t sig_len, pub_len;
  const uint8_t **msgs;
  size_t *msg_lens;
  secp256k1_schnorrleg **sigs;
  secp256k1_schnorrleg *sig_data;
  secp256k1_pubkey **pubkeys;
  secp256k1_pubkey *pubkey_data;
  bcrypto_secp256k1_t *ec;
  napi_value item, result;
  napi_value items[3];
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);

  if (length == 0) {
    CHECK(napi_get_boolean(env, true, &result) == napi_ok);
    return result;
  }

  msgs = (const unsigned char **)bcrypto_malloc(length * sizeof(unsigned char *));
  msg_lens = (size_t *)bcrypto_malloc(length * sizeof(size_t));
  sigs = (secp256k1_schnorrleg **)bcrypto_malloc(length * sizeof(secp256k1_schnorrleg *));
  sig_data = (secp256k1_schnorrleg *)bcrypto_malloc(length * sizeof(secp256k1_schnorrleg));
  pubkeys = (secp256k1_pubkey **)bcrypto_malloc(length * sizeof(secp256k1_pubkey *));
  pubkey_data = (secp256k1_pubkey *)bcrypto_malloc(length * sizeof(secp256k1_pubkey));

  if (msgs == NULL || msg_lens == NULL
      || sigs == NULL || sig_data == NULL
      || pubkeys == NULL || pubkey_data == NULL) {
    goto fail;
  }

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_array_length(env, item, &item_len) == napi_ok);
    CHECK(item_len == 3);

    CHECK(napi_get_element(env, item, 0, &items[0]) == napi_ok);
    CHECK(napi_get_element(env, item, 1, &items[1]) == napi_ok);
    CHECK(napi_get_element(env, item, 2, &items[2]) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[0], (void **)&msgs[i],
                               &msg_lens[i]) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[1], (void **)&sig,
                               &sig_len) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[2], (void **)&pub,
                               &pub_len) == napi_ok);

    if (sig_len != 64)
      goto fail;

    if (!secp256k1_schnorrleg_parse(ec->ctx, &sig_data[i], sig))
      goto fail;

    if (!secp256k1_ec_pubkey_parse(ec->ctx, &pubkey_data[i], pub, pub_len))
      goto fail;

    sigs[i] = &sig_data[i];
    pubkeys[i] = &pubkey_data[i];
  }

  /* See:
   *   https://github.com/ElementsProject/secp256k1-zkp/issues/69
   *   https://github.com/bitcoin-core/secp256k1/pull/638
   */
  if (ec->scratch == NULL)
    ec->scratch = secp256k1_scratch_space_create(ec->ctx, 1024 * 1024);

  CHECK(ec->scratch != NULL);

  ok = secp256k1_schnorrleg_verify_batch(
    ec->ctx,
    ec->scratch,
    (const secp256k1_schnorrleg *const *)sigs,
    msgs,
    msg_lens,
    (const secp256k1_pubkey *const *)pubkeys,
    length
  );

fail:
  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(msgs);
  bcrypto_free(msg_lens);
  bcrypto_free(sigs);
  bcrypto_free(sig_data);
  bcrypto_free(pubkeys);
  bcrypto_free(pubkey_data);

  return result;
}

#ifdef BCRYPTO_USE_SECP256K1_LATEST
static napi_value
bcrypto_secp256k1_xonly_privkey_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t d[32], x[32], y[32];
  const uint8_t *priv;
  size_t priv_len;
  secp256k1_pubkey pubkey;
  secp256k1_xonly_pubkey xonly;
  int negated;
  bcrypto_secp256k1_t *ec;
  napi_value bd, bx, by, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(secp256k1_ec_privkey_export(ec->ctx, d, priv), JS_ERR_PRIVKEY);
  JS_ASSERT(secp256k1_ec_pubkey_create(ec->ctx, &pubkey, priv), JS_ERR_PRIVKEY);

  CHECK(secp256k1_xonly_pubkey_from_pubkey(ec->ctx, &xonly, &negated, &pubkey));

  if (negated)
    CHECK(secp256k1_ec_privkey_negate(ec->ctx, d));

  CHECK(secp256k1_xonly_pubkey_export(ec->ctx, x, y, &xonly));

  CHECK(napi_create_buffer_copy(env, 32, d, NULL, &bd) == napi_ok);
  CHECK(napi_create_buffer_copy(env, 32, x, NULL, &bx) == napi_ok);
  CHECK(napi_create_buffer_copy(env, 32, y, NULL, &by) == napi_ok);

  CHECK(napi_create_array_with_length(env, 3, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, bd) == napi_ok);
  CHECK(napi_set_element(env, result, 1, bx) == napi_ok);
  CHECK(napi_set_element(env, result, 2, by) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_privkey_tweak_add(napi_env env,
                                          napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  const uint8_t *priv, *tweak;
  size_t priv_len, tweak_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(tweak_len == 32, JS_ERR_SCALAR_SIZE);

  memcpy(out, priv, 32);

  JS_ASSERT(secp256k1_xonly_seckey_tweak_add(ec->ctx, out, tweak),
            JS_ERR_PRIVKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_create(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  secp256k1_xonly_pubkey pubkey;
  const uint8_t *priv;
  size_t priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(secp256k1_xonly_pubkey_create(ec->ctx, &pubkey, priv),
            JS_ERR_PRIVKEY);

  secp256k1_xonly_pubkey_serialize(ec->ctx, out, &pubkey);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_from_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  secp256k1_xonly_pubkey pubkey;
  const uint8_t *data;
  size_t data_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len == 32, JS_ERR_PREIMAGE_SIZE);

  CHECK(secp256k1_xonly_pubkey_from_uniform(ec->ctx, &pubkey, data));

  secp256k1_xonly_pubkey_serialize(ec->ctx, out, &pubkey);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_to_uniform(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  const uint8_t *pub;
  size_t pub_len;
  secp256k1_xonly_pubkey pubkey;
  uint32_t hint;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &hint) == napi_ok);

  JS_ASSERT(pub_len == 32, JS_ERR_PUBKEY_SIZE);

  JS_ASSERT(secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub), JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_xonly_pubkey_to_uniform(ec->ctx, out, &pubkey, hint),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_from_hash(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  secp256k1_xonly_pubkey pubkey;
  const uint8_t *data;
  size_t data_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&data,
                             &data_len) == napi_ok);

  JS_ASSERT(data_len == 64, JS_ERR_PREIMAGE_SIZE);
  JS_ASSERT(secp256k1_xonly_pubkey_from_hash(ec->ctx, &pubkey, data),
            JS_ERR_PREIMAGE);

  secp256k1_xonly_pubkey_serialize(ec->ctx, out, &pubkey);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_to_hash(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[64];
  const uint8_t *pub, *entropy;
  size_t pub_len, entropy_len;
  secp256k1_xonly_pubkey pubkey;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(pub_len == 32, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  JS_ASSERT(secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub), JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_xonly_pubkey_to_hash(ec->ctx, out, &pubkey, entropy),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, 64, out, NULL, &result) == napi_ok);

  cleanse((void *)entropy, entropy_len);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_verify(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *pub;
  size_t pub_len;
  secp256k1_xonly_pubkey pubkey;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  ok = pub_len == 32 && secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_export(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t x[32];
  uint8_t y[32];
  const uint8_t *pub;
  size_t pub_len;
  secp256k1_xonly_pubkey pubkey;
  bcrypto_secp256k1_t *ec;
  napi_value bx, by, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);

  JS_ASSERT(pub_len == 32, JS_ERR_PUBKEY_SIZE);

  JS_ASSERT(secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub), JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_xonly_pubkey_export(ec->ctx, x, y, &pubkey),
            JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, 32, x, NULL, &bx) == napi_ok);
  CHECK(napi_create_buffer_copy(env, 32, y, NULL, &by) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, bx) == napi_ok);
  CHECK(napi_set_element(env, result, 1, by) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_import(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  secp256k1_xonly_pubkey pubkey;
  const uint8_t *x, *y;
  size_t x_len, y_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&x, &x_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&y, &y_len) == napi_ok);

  ok = secp256k1_xonly_pubkey_import(ec->ctx, &pubkey,
                                     x, x_len, y, y_len);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  secp256k1_xonly_pubkey_serialize(ec->ctx, out, &pubkey);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_tweak_add(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  int negated;
  secp256k1_xonly_pubkey pubkey;
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(pub_len == 32, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(tweak_len == 32, JS_ERR_SCALAR_SIZE);

  JS_ASSERT(secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub), JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_xonly_pubkey_tweak_add(ec->ctx, &pubkey, &negated, tweak),
            JS_ERR_PUBKEY);

  secp256k1_xonly_pubkey_serialize(ec->ctx, out, &pubkey);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_tweak_mul(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  secp256k1_xonly_pubkey pubkey;
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(pub_len == 32, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(tweak_len == 32, JS_ERR_SCALAR_SIZE);

  JS_ASSERT(secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub), JS_ERR_PUBKEY);

  ok = secp256k1_ec_pubkey_tweak_mul(ec->ctx,
                                     (secp256k1_pubkey *)&pubkey,
                                     tweak);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  secp256k1_xonly_pubkey_serialize(ec->ctx, out, &pubkey);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_tweak_sum(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t out[32];
  int negated;
  secp256k1_xonly_pubkey pubkey;
  const uint8_t *pub, *tweak;
  size_t pub_len, tweak_len;
  bcrypto_secp256k1_t *ec;
  napi_value outval, negval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);

  JS_ASSERT(pub_len == 32, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(tweak_len == 32, JS_ERR_SCALAR_SIZE);

  JS_ASSERT(secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub), JS_ERR_PUBKEY);

  JS_ASSERT(secp256k1_xonly_pubkey_tweak_add(ec->ctx, &pubkey, &negated, tweak),
            JS_ERR_PUBKEY);

  secp256k1_xonly_pubkey_serialize(ec->ctx, out, &pubkey);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &outval) == napi_ok);
  CHECK(napi_get_boolean(env, negated, &negval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, outval) == napi_ok);
  CHECK(napi_set_element(env, result, 1, negval) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_tweak_test(napi_env env, napi_callback_info info) {
  napi_value argv[5];
  size_t argc = 5;
  secp256k1_xonly_pubkey pubkey;
  const uint8_t *pub, *tweak, *expect;
  size_t pub_len, tweak_len, expect_len;
  bool negated;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 5);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub,
                             &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&tweak,
                             &tweak_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&expect,
                             &expect_len) == napi_ok);
  CHECK(napi_get_value_bool(env, argv[4], &negated) == napi_ok);

  if (pub_len != 32 || tweak_len != 32 || expect_len != 32)
    goto fail;

  if (!secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub))
    goto fail;

  ok = secp256k1_xonly_pubkey_tweak_test(ec->ctx,
                                         expect,
                                         negated,
                                         &pubkey,
                                         tweak);

fail:
  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_xonly_combine(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint8_t out[32];
  secp256k1_xonly_pubkey pubkey;
  uint32_t i, length;
  secp256k1_xonly_pubkey **pubkeys;
  secp256k1_xonly_pubkey *pubkey_data;
  const uint8_t *pub;
  size_t pub_len;
  bcrypto_secp256k1_t *ec;
  napi_value item, result;
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);

  JS_ASSERT(length != 0, JS_ERR_PUBKEY);

  pubkeys = (secp256k1_xonly_pubkey **)bcrypto_malloc(length * sizeof(secp256k1_xonly_pubkey *));
  pubkey_data = (secp256k1_xonly_pubkey *)bcrypto_malloc(length * sizeof(secp256k1_xonly_pubkey));

  if (pubkeys == NULL || pubkey_data == NULL)
    goto fail;

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_buffer_info(env, item, (void **)&pub,
                               &pub_len) == napi_ok);

    if (pub_len != 32)
      goto fail;

    if (!secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey_data[i], pub))
      goto fail;

    pubkeys[i] = &pubkey_data[i];
  }

  ok = secp256k1_ec_pubkey_combine(ec->ctx, (secp256k1_pubkey *)&pubkey,
                                   (const secp256k1_pubkey *const *)pubkeys,
                                   length);

fail:
  bcrypto_free(pubkeys);
  bcrypto_free(pubkey_data);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  secp256k1_xonly_pubkey_serialize(ec->ctx, out, &pubkey);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_schnorr_sign(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  secp256k1_schnorrsig sigout;
  uint8_t out[64];
  const uint8_t *msg, *priv, *aux;
  size_t msg_len, priv_len, aux_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&aux,
                             &aux_len) == napi_ok);

  JS_ASSERT(msg_len == 32, JS_ERR_MSG_SIZE);
  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);
  JS_ASSERT(aux_len == 32, JS_ERR_ENTROPY_SIZE);

  ok = secp256k1_schnorrsig_sign(ec->ctx,
                                 &sigout,
                                 msg,
                                 priv,
                                 NULL,
                                 (void *)aux);

  JS_ASSERT(ok, JS_ERR_SIGN);

  secp256k1_schnorrsig_serialize(ec->ctx, out, &sigout);

  CHECK(napi_create_buffer_copy(env, 64, out, NULL, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_schnorr_verify(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  const uint8_t *msg, *sig, *pub;
  size_t msg_len, sig_len, pub_len;
  secp256k1_schnorrsig sigin;
  secp256k1_xonly_pubkey pubkey;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&sig, &sig_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[3], (void **)&pub, &pub_len) == napi_ok);

  ok = msg_len == 32 && sig_len == 64 && pub_len == 32
    && secp256k1_schnorrsig_parse(ec->ctx, &sigin, sig)
    && secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub)
    && secp256k1_schnorrsig_verify(ec->ctx, &sigin, msg, &pubkey);

  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_secp256k1_schnorr_verify_batch(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t i, length, item_len;
  const uint8_t *sig, *pub;
  size_t msg_len, sig_len, pub_len;
  const uint8_t **msgs;
  secp256k1_schnorrsig **sigs;
  secp256k1_schnorrsig *sig_data;
  secp256k1_xonly_pubkey **pubkeys;
  secp256k1_xonly_pubkey *pubkey_data;
  bcrypto_secp256k1_t *ec;
  napi_value item, result;
  napi_value items[3];
  int ok = 0;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_array_length(env, argv[1], &length) == napi_ok);

  if (length == 0) {
    CHECK(napi_get_boolean(env, true, &result) == napi_ok);
    return result;
  }

  msgs = (const unsigned char **)bcrypto_malloc(length * sizeof(unsigned char *));
  sigs = (secp256k1_schnorrsig **)bcrypto_malloc(length * sizeof(secp256k1_schnorrsig *));
  sig_data = (secp256k1_schnorrsig *)bcrypto_malloc(length * sizeof(secp256k1_schnorrsig));
  pubkeys = (secp256k1_xonly_pubkey **)bcrypto_malloc(length * sizeof(secp256k1_xonly_pubkey *));
  pubkey_data = (secp256k1_xonly_pubkey *)bcrypto_malloc(length * sizeof(secp256k1_xonly_pubkey));

  if (msgs == NULL
      || sigs == NULL
      || sig_data == NULL
      || pubkeys == NULL
      || pubkey_data == NULL) {
    goto fail;
  }

  for (i = 0; i < length; i++) {
    CHECK(napi_get_element(env, argv[1], i, &item) == napi_ok);
    CHECK(napi_get_array_length(env, item, &item_len) == napi_ok);
    CHECK(item_len == 3);

    CHECK(napi_get_element(env, item, 0, &items[0]) == napi_ok);
    CHECK(napi_get_element(env, item, 1, &items[1]) == napi_ok);
    CHECK(napi_get_element(env, item, 2, &items[2]) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[0], (void **)&msgs[i],
                               &msg_len) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[1], (void **)&sig,
                               &sig_len) == napi_ok);

    CHECK(napi_get_buffer_info(env, items[2], (void **)&pub,
                               &pub_len) == napi_ok);

    if (msg_len != 32 || sig_len != 64 || pub_len != 32)
      goto fail;

    if (!secp256k1_schnorrsig_parse(ec->ctx, &sig_data[i], sig))
      goto fail;

    if (!secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey_data[i], pub))
      goto fail;

    sigs[i] = &sig_data[i];
    pubkeys[i] = &pubkey_data[i];
  }

  /* See:
   *   https://github.com/ElementsProject/secp256k1-zkp/issues/69
   *   https://github.com/bitcoin-core/secp256k1/pull/638
   */
  if (ec->scratch == NULL)
    ec->scratch = secp256k1_scratch_space_create(ec->ctx, 1024 * 1024);

  CHECK(ec->scratch != NULL);

  ok = secp256k1_schnorrsig_verify_batch(
    ec->ctx,
    ec->scratch,
    (const secp256k1_schnorrsig *const *)sigs,
    msgs,
    (const secp256k1_xonly_pubkey *const *)pubkeys,
    length
  );

fail:
  CHECK(napi_get_boolean(env, ok, &result) == napi_ok);

  bcrypto_free(msgs);
  bcrypto_free(sigs);
  bcrypto_free(sig_data);
  bcrypto_free(pubkeys);
  bcrypto_free(pubkey_data);

  return result;
}

static int
ecdh_hash_function_xonly(unsigned char *out,
                         const unsigned char *x,
                         const unsigned char *y,
                         void *data) {
  memcpy(out, x, 32);
  return 1;
}

static napi_value
bcrypto_secp256k1_xonly_derive(napi_env env, napi_callback_info info) {
  secp256k1_ecdh_hash_function hashfp = ecdh_hash_function_xonly;
  napi_value argv[3];
  size_t argc = 3;
  secp256k1_xonly_pubkey pubkey;
  uint8_t out[32];
  const uint8_t *pub, *priv;
  size_t pub_len, priv_len;
  bcrypto_secp256k1_t *ec;
  napi_value result;
  int ok;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&pub, &pub_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&priv,
                             &priv_len) == napi_ok);

  JS_ASSERT(pub_len == 32, JS_ERR_PUBKEY_SIZE);
  JS_ASSERT(priv_len == 32, JS_ERR_PRIVKEY_SIZE);

  JS_ASSERT(secp256k1_xonly_pubkey_parse(ec->ctx, &pubkey, pub), JS_ERR_PUBKEY);

  ok = secp256k1_ecdh(ec->ctx,
                      out,
                      (secp256k1_pubkey *)&pubkey,
                      priv,
                      hashfp,
                      NULL);

  JS_ASSERT(ok, JS_ERR_PUBKEY);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}
#endif /* BCRYPTO_USE_SECP256K1_LATEST */
#endif /* BCRYPTO_USE_SECP256K1 */

/*
 * Secret Box
 */

static napi_value
bcrypto_secretbox_seal(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t *out;
  size_t out_len;
  const uint8_t *msg, *key, *nonce;
  size_t msg_len, key_len, nonce_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&nonce,
                             &nonce_len) == napi_ok);

  JS_ASSERT(key_len == 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(nonce_len == 24, JS_ERR_NONCE_SIZE);

  out_len = SECRETBOX_SEAL_SIZE(msg_len);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  secretbox_seal(out, msg, msg_len, key, nonce);

  return result;
}

static napi_value
bcrypto_secretbox_open(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint8_t *out;
  size_t out_len;
  const uint8_t *sealed, *key, *nonce;
  size_t sealed_len, key_len, nonce_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&sealed,
                             &sealed_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&nonce,
                             &nonce_len) == napi_ok);

  JS_ASSERT(key_len == 32, JS_ERR_KEY_SIZE);
  JS_ASSERT(nonce_len == 24, JS_ERR_NONCE_SIZE);

  out_len = SECRETBOX_OPEN_SIZE(sealed_len);

  JS_ASSERT(out_len <= MAX_BUFFER_LENGTH, JS_ERR_ALLOC);

  JS_CHECK_ALLOC(napi_create_buffer(env, out_len, (void **)&out, &result));

  JS_ASSERT(secretbox_open(out, sealed, sealed_len, key, nonce),
            JS_ERR_DECRYPT);

  return result;
}

static napi_value
bcrypto_secretbox_derive(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint8_t out[32];
  const uint8_t *secret;
  size_t secret_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&secret,
                             &secret_len) == napi_ok);

  JS_ASSERT(secret_len == 32, JS_ERR_SECRET_SIZE);

  secretbox_derive(out, secret);

  CHECK(napi_create_buffer_copy(env, 32, out, NULL, &result) == napi_ok);

  return result;
}

/*
 * Siphash
 */

static napi_value
bcrypto_siphash(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint64_t out;
  const uint8_t *msg, *key;
  size_t msg_len, key_len;
  napi_value hival, loval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(key_len >= 16, JS_ERR_KEY_SIZE);

  out = siphash(msg, msg_len, key);

  CHECK(napi_create_uint32(env, out >> 32, &hival) == napi_ok);
  CHECK(napi_create_uint32(env, out, &loval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, hival) == napi_ok);
  CHECK(napi_set_element(env, result, 1, loval) == napi_ok);

  return result;
}

static napi_value
bcrypto_siphash32(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t out, num;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_uint32(env, argv[0], &num) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(key_len >= 16, JS_ERR_KEY_SIZE);

  out = siphash32(num, key);

  CHECK(napi_create_uint32(env, out, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_siphash64(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint64_t out, num;
  uint32_t hi, lo;
  const uint8_t *key;
  size_t key_len;
  napi_value hival, loval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_uint32(env, argv[0], &hi) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &lo) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(key_len >= 16, JS_ERR_KEY_SIZE);

  num = ((uint64_t)hi << 32) | lo;
  out = siphash64(num, key);

  CHECK(napi_create_uint32(env, out >> 32, &hival) == napi_ok);
  CHECK(napi_create_uint32(env, out, &loval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, hival) == napi_ok);
  CHECK(napi_set_element(env, result, 1, loval) == napi_ok);

  return result;
}

static napi_value
bcrypto_siphash32k256(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  uint32_t out, num;
  const uint8_t *key;
  size_t key_len;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_uint32(env, argv[0], &num) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(key_len >= 32, JS_ERR_KEY_SIZE);

  out = siphash32k256(num, key);

  CHECK(napi_create_uint32(env, out, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_siphash64k256(napi_env env, napi_callback_info info) {
  napi_value argv[3];
  size_t argc = 3;
  uint64_t out, num;
  uint32_t hi, lo;
  const uint8_t *key;
  size_t key_len;
  napi_value hival, loval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 3);
  CHECK(napi_get_value_uint32(env, argv[0], &hi) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[1], &lo) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[2], (void **)&key, &key_len) == napi_ok);

  JS_ASSERT(key_len >= 32, JS_ERR_KEY_SIZE);

  num = ((uint64_t)hi << 32) | lo;
  out = siphash64k256(num, key);

  CHECK(napi_create_uint32(env, out >> 32, &hival) == napi_ok);
  CHECK(napi_create_uint32(env, out, &loval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, hival) == napi_ok);
  CHECK(napi_set_element(env, result, 1, loval) == napi_ok);

  return result;
}

static napi_value
bcrypto_sipmod(napi_env env, napi_callback_info info) {
  napi_value argv[4];
  size_t argc = 4;
  uint64_t out, mod;
  uint32_t mhi, mlo;
  const uint8_t *msg, *key;
  size_t msg_len, key_len;
  napi_value hival, loval, result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 4);
  CHECK(napi_get_buffer_info(env, argv[0], (void **)&msg, &msg_len) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&key, &key_len) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[2], &mhi) == napi_ok);
  CHECK(napi_get_value_uint32(env, argv[3], &mlo) == napi_ok);

  JS_ASSERT(key_len >= 16, JS_ERR_KEY_SIZE);

  mod = ((uint64_t)mhi << 32) | mlo;
  out = sipmod(msg, msg_len, key, mod);

  CHECK(napi_create_uint32(env, out >> 32, &hival) == napi_ok);
  CHECK(napi_create_uint32(env, out, &loval) == napi_ok);

  CHECK(napi_create_array_with_length(env, 2, &result) == napi_ok);
  CHECK(napi_set_element(env, result, 0, hival) == napi_ok);
  CHECK(napi_set_element(env, result, 1, loval) == napi_ok);

  return result;
}

/*
 * Short Weierstrass Curve
 */

static void
bcrypto_wei_curve_destroy(napi_env env, void *data, void *hint) {
  bcrypto_wei_curve_t *ec = (bcrypto_wei_curve_t *)data;

  if (ec->scratch != NULL)
    wei_scratch_destroy(ec->ctx, ec->scratch);

  wei_curve_destroy(ec->ctx);
  bcrypto_free(ec);
}

static napi_value
bcrypto_wei_curve_create(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  uint32_t type;
  bcrypto_wei_curve_t *ec;
  wei_curve_t *ctx;
  napi_value handle;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_uint32(env, argv[0], &type) == napi_ok);

  JS_ASSERT(ctx = wei_curve_create(type), JS_ERR_CONTEXT);

  ec = (bcrypto_wei_curve_t *)bcrypto_xmalloc(sizeof(bcrypto_wei_curve_t));
  ec->ctx = ctx;
  ec->scratch = NULL;
  ec->scalar_size = wei_curve_scalar_size(ec->ctx);
  ec->scalar_bits = wei_curve_scalar_bits(ec->ctx);
  ec->field_size = wei_curve_field_size(ec->ctx);
  ec->field_bits = wei_curve_field_bits(ec->ctx);
  ec->sig_size = ecdsa_sig_size(ec->ctx);
  ec->legacy_size = schnorr_legacy_sig_size(ec->ctx);
  ec->schnorr_size = schnorr_sig_size(ec->ctx);

  CHECK(napi_create_external(env,
                             ec,
                             bcrypto_wei_curve_destroy,
                             NULL,
                             &handle) == napi_ok);

  return handle;
}

static napi_value
bcrypto_wei_curve_field_size(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_create_uint32(env, ec->field_size, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_wei_curve_field_bits(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = 1;
  bcrypto_wei_curve_t *ec;
  napi_value result;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 1);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_create_uint32(env, ec->field_bits, &result) == napi_ok);

  return result;
}

static napi_value
bcrypto_wei_curve_randomize(napi_env env, napi_callback_info info) {
  napi_value argv[2];
  size_t argc = 2;
  const uint8_t *entropy;
  size_t entropy_len;
  bcrypto_wei_curve_t *ec;

  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == napi_ok);
  CHECK(argc == 2);
  CHECK(napi_get_value_external(env, argv[0], (void **)&ec) == napi_ok);
  CHECK(napi_get_buffer_info(env, argv[1], (void **)&entropy,
                             &entropy_len) == napi_ok);

  JS_ASSERT(entropy_len == ENTROPY_SIZE, JS_ERR_ENTROPY_SIZE);

  wei_curve_randomize(ec->ctx, entropy);

  cleanse((void *)entropy, entropy_len);

  return argv[0];
}

/*
 * Module
 */

napi_value
bcrypto_init(napi_env env, napi_value exports) {
  size_t i;

  static struct {
    const char *name;
    napi_callback callback;
  } funcs[] = {
    /* AEAD */
    { "aead_create", bcrypto_aead_create },
    { "aead_init", bcrypto_aead_init },
    { "aead_aad", bcrypto_aead_aad },
    { "aead_encrypt", bcrypto_aead_encrypt },
    { "aead_decrypt", bcrypto_aead_decrypt },
    { "aead_auth", bcrypto_aead_auth },
    { "aead_final", bcrypto_aead_final },
    { "aead_destroy", bcrypto_aead_destroy },
    { "aead_verify", bcrypto_aead_verify },
    { "aead_static_encrypt", bcrypto_aead_static_encrypt },
    { "aead_static_decrypt", bcrypto_aead_static_decrypt },
    { "aead_static_auth", bcrypto_aead_static_auth },

    /* Base16 */
    { "base16_encode", bcrypto_base16_encode },
    { "base16_decode", bcrypto_base16_decode },
    { "base16_test", bcrypto_base16_test },

    /* Base16 (Little Endian) */
    { "base16le_encode", bcrypto_base16le_encode },
    { "base16le_decode", bcrypto_base16le_decode },
    { "base16le_test", bcrypto_base16le_test },

    /* Base32 */
    { "base32_encode", bcrypto_base32_encode },
    { "base32_decode", bcrypto_base32_decode },
    { "base32_test", bcrypto_base32_test },

    /* Base32-Hex */
    { "base32hex_encode", bcrypto_base32hex_encode },
    { "base32hex_decode", bcrypto_base32hex_decode },
    { "base32hex_test", bcrypto_base32hex_test },

    /* Base58 */
    { "base58_encode", bcrypto_base58_encode },
    { "base58_decode", bcrypto_base58_decode },
    { "base58_test", bcrypto_base58_test },

    /* Base64 */
    { "base64_encode", bcrypto_base64_encode },
    { "base64_decode", bcrypto_base64_decode },
    { "base64_test", bcrypto_base64_test },

    /* Base64-URL */
    { "base64url_encode", bcrypto_base64url_encode },
    { "base64url_decode", bcrypto_base64url_decode },
    { "base64url_test", bcrypto_base64url_test },

    /* Bcrypt */
    { "bcrypt_hash192", bcrypto_bcrypt_hash192 },
    { "bcrypt_hash256", bcrypto_bcrypt_hash256 },
    { "bcrypt_pbkdf", bcrypto_bcrypt_pbkdf },
    { "bcrypt_pbkdf_async", bcrypto_bcrypt_pbkdf_async },
    { "bcrypt_derive", bcrypto_bcrypt_derive },
    { "bcrypt_generate", bcrypto_bcrypt_generate },
    { "bcrypt_generate_with_salt64", bcrypto_bcrypt_generate_with_salt64 },
    { "bcrypt_verify", bcrypto_bcrypt_verify },

    /* Bech32 */
    { "bech32_serialize", bcrypto_bech32_serialize },
    { "bech32_deserialize", bcrypto_bech32_deserialize },
    { "bech32_is", bcrypto_bech32_is },
    { "bech32_convert_bits", bcrypto_bech32_convert_bits },
    { "bech32_encode", bcrypto_bech32_encode },
    { "bech32_decode", bcrypto_bech32_decode },
    { "bech32_test", bcrypto_bech32_test },

    /* BLAKE2b */
    { "blake2b_create", bcrypto_blake2b_create },
    { "blake2b_init", bcrypto_blake2b_init },
    { "blake2b_update", bcrypto_blake2b_update },
    { "blake2b_final", bcrypto_blake2b_final },
    { "blake2b_digest", bcrypto_blake2b_digest },
    { "blake2b_root", bcrypto_blake2b_root },
    { "blake2b_multi", bcrypto_blake2b_multi },

    /* BLAKE2s */
    { "blake2s_create", bcrypto_blake2s_create },
    { "blake2s_init", bcrypto_blake2s_init },
    { "blake2s_update", bcrypto_blake2s_update },
    { "blake2s_final", bcrypto_blake2s_final },
    { "blake2s_digest", bcrypto_blake2s_digest },
    { "blake2s_root", bcrypto_blake2s_root },
    { "blake2s_multi", bcrypto_blake2s_multi },

    /* Cash32 */
    { "cash32_serialize", bcrypto_cash32_serialize },
    { "cash32_deserialize", bcrypto_cash32_deserialize },
    { "cash32_is", bcrypto_cash32_is },
    { "cash32_convert_bits", bcrypto_cash32_convert_bits },
    { "cash32_encode", bcrypto_cash32_encode },
    { "cash32_decode", bcrypto_cash32_decode },
    { "cash32_test", bcrypto_cash32_test },

    /* ChaCha20 */
    { "chacha20_create", bcrypto_chacha20_create },
    { "chacha20_init", bcrypto_chacha20_init },
    { "chacha20_encrypt", bcrypto_chacha20_encrypt },
    { "chacha20_destroy", bcrypto_chacha20_destroy },
    { "chacha20_derive", bcrypto_chacha20_derive },

    /* Cipher */
    { "cipher_create", bcrypto_cipher_create },
    { "cipher_init", bcrypto_cipher_init },
    { "cipher_set_padding", bcrypto_cipher_set_padding },
    { "cipher_set_aad", bcrypto_cipher_set_aad },
    { "cipher_set_ccm", bcrypto_cipher_set_ccm },
    { "cipher_set_tag", bcrypto_cipher_set_tag },
    { "cipher_get_tag", bcrypto_cipher_get_tag },
    { "cipher_update", bcrypto_cipher_update },
    { "cipher_crypt", bcrypto_cipher_crypt },
    { "cipher_final", bcrypto_cipher_final },
    { "cipher_destroy", bcrypto_cipher_destroy },
    { "cipher_encrypt", bcrypto_cipher_encrypt },
    { "cipher_decrypt", bcrypto_cipher_decrypt },

    /* Cleanse */
    { "cleanse", bcrypto_cleanse },

    /* CTR-DRBG */
    { "ctr_drbg_create", bcrypto_ctr_drbg_create },
    { "ctr_drbg_init", bcrypto_ctr_drbg_init },
    { "ctr_drbg_reseed", bcrypto_ctr_drbg_reseed },
    { "ctr_drbg_generate", bcrypto_ctr_drbg_generate },

    /* DSA */
    { "dsa_params_create", bcrypto_dsa_params_create },
    { "dsa_params_generate", bcrypto_dsa_params_generate },
    { "dsa_params_generate_async", bcrypto_dsa_params_generate_async },
    { "dsa_params_bits", bcrypto_dsa_params_bits },
    { "dsa_params_qbits", bcrypto_dsa_params_qbits },
    { "dsa_params_verify", bcrypto_dsa_params_verify },
    { "dsa_params_import", bcrypto_dsa_params_import },
    { "dsa_params_export", bcrypto_dsa_params_export },
    { "dsa_privkey_create", bcrypto_dsa_privkey_create },
    { "dsa_privkey_bits", bcrypto_dsa_privkey_bits },
    { "dsa_privkey_qbits", bcrypto_dsa_privkey_qbits },
    { "dsa_privkey_verify", bcrypto_dsa_privkey_verify },
    { "dsa_privkey_import", bcrypto_dsa_privkey_import },
    { "dsa_privkey_export", bcrypto_dsa_privkey_export },
    { "dsa_pubkey_create", bcrypto_dsa_pubkey_create },
    { "dsa_pubkey_bits", bcrypto_dsa_pubkey_bits },
    { "dsa_pubkey_qbits", bcrypto_dsa_pubkey_qbits },
    { "dsa_pubkey_verify", bcrypto_dsa_pubkey_verify },
    { "dsa_pubkey_import", bcrypto_dsa_pubkey_import },
    { "dsa_pubkey_export", bcrypto_dsa_pubkey_export },
    { "dsa_signature_export", bcrypto_dsa_signature_export },
    { "dsa_signature_import", bcrypto_dsa_signature_import },
    { "dsa_sign", bcrypto_dsa_sign },
    { "dsa_sign_der", bcrypto_dsa_sign_der },
    { "dsa_verify", bcrypto_dsa_verify },
    { "dsa_verify_der", bcrypto_dsa_verify_der },
    { "dsa_derive", bcrypto_dsa_derive },

    /* EB2K */
    { "eb2k_derive", bcrypto_eb2k_derive },

    /* ECDH */
    { "ecdh_privkey_generate", bcrypto_ecdh_privkey_generate },
    { "ecdh_privkey_verify", bcrypto_ecdh_privkey_verify },
    { "ecdh_privkey_export", bcrypto_ecdh_privkey_export },
    { "ecdh_privkey_import", bcrypto_ecdh_privkey_import },
    { "ecdh_pubkey_create", bcrypto_ecdh_pubkey_create },
    { "ecdh_pubkey_convert", bcrypto_ecdh_pubkey_convert },
    { "ecdh_pubkey_from_uniform", bcrypto_ecdh_pubkey_from_uniform },
    { "ecdh_pubkey_to_uniform", bcrypto_ecdh_pubkey_to_uniform },
    { "ecdh_pubkey_from_hash", bcrypto_ecdh_pubkey_from_hash },
    { "ecdh_pubkey_to_hash", bcrypto_ecdh_pubkey_to_hash },
    { "ecdh_pubkey_verify", bcrypto_ecdh_pubkey_verify },
    { "ecdh_pubkey_export", bcrypto_ecdh_pubkey_export },
    { "ecdh_pubkey_import", bcrypto_ecdh_pubkey_import },
    { "ecdh_pubkey_is_small", bcrypto_ecdh_pubkey_is_small },
    { "ecdh_pubkey_has_torsion", bcrypto_ecdh_pubkey_has_torsion },
    { "ecdh_derive", bcrypto_ecdh_derive },

    /* ECDSA */
    { "ecdsa_privkey_generate", bcrypto_ecdsa_privkey_generate },
    { "ecdsa_privkey_verify", bcrypto_ecdsa_privkey_verify },
    { "ecdsa_privkey_export", bcrypto_ecdsa_privkey_export },
    { "ecdsa_privkey_import", bcrypto_ecdsa_privkey_import },
    { "ecdsa_privkey_tweak_add", bcrypto_ecdsa_privkey_tweak_add },
    { "ecdsa_privkey_tweak_mul", bcrypto_ecdsa_privkey_tweak_mul },
    { "ecdsa_privkey_reduce", bcrypto_ecdsa_privkey_reduce },
    { "ecdsa_privkey_negate", bcrypto_ecdsa_privkey_negate },
    { "ecdsa_privkey_invert", bcrypto_ecdsa_privkey_invert },
    { "ecdsa_pubkey_create", bcrypto_ecdsa_pubkey_create },
    { "ecdsa_pubkey_convert", bcrypto_ecdsa_pubkey_convert },
    { "ecdsa_pubkey_from_uniform", bcrypto_ecdsa_pubkey_from_uniform },
    { "ecdsa_pubkey_to_uniform", bcrypto_ecdsa_pubkey_to_uniform },
    { "ecdsa_pubkey_from_hash", bcrypto_ecdsa_pubkey_from_hash },
    { "ecdsa_pubkey_to_hash", bcrypto_ecdsa_pubkey_to_hash },
    { "ecdsa_pubkey_verify", bcrypto_ecdsa_pubkey_verify },
    { "ecdsa_pubkey_export", bcrypto_ecdsa_pubkey_export },
    { "ecdsa_pubkey_import", bcrypto_ecdsa_pubkey_import },
    { "ecdsa_pubkey_tweak_add", bcrypto_ecdsa_pubkey_tweak_add },
    { "ecdsa_pubkey_tweak_mul", bcrypto_ecdsa_pubkey_tweak_mul },
    { "ecdsa_pubkey_combine", bcrypto_ecdsa_pubkey_combine },
    { "ecdsa_pubkey_negate", bcrypto_ecdsa_pubkey_negate },
    { "ecdsa_signature_normalize", bcrypto_ecdsa_signature_normalize },
    { "ecdsa_signature_normalize_der", bcrypto_ecdsa_signature_normalize_der },
    { "ecdsa_signature_export", bcrypto_ecdsa_signature_export },
    { "ecdsa_signature_import", bcrypto_ecdsa_signature_import },
    { "ecdsa_is_low_s", bcrypto_ecdsa_is_low_s },
    { "ecdsa_is_low_der", bcrypto_ecdsa_is_low_der },
    { "ecdsa_sign", bcrypto_ecdsa_sign },
    { "ecdsa_sign_recoverable", bcrypto_ecdsa_sign_recoverable },
    { "ecdsa_sign_der", bcrypto_ecdsa_sign_der },
    { "ecdsa_sign_recoverable_der", bcrypto_ecdsa_sign_recoverable_der },
    { "ecdsa_verify", bcrypto_ecdsa_verify },
    { "ecdsa_verify_der", bcrypto_ecdsa_verify_der },
    { "ecdsa_recover", bcrypto_ecdsa_recover },
    { "ecdsa_recover_der", bcrypto_ecdsa_recover_der },
    { "ecdsa_derive", bcrypto_ecdsa_derive },

    /* EdDSA */
    { "eddsa_pubkey_size", bcrypto_eddsa_pubkey_size },
    { "eddsa_privkey_generate", bcrypto_eddsa_privkey_generate },
    { "eddsa_privkey_verify", bcrypto_eddsa_privkey_verify },
    { "eddsa_privkey_export", bcrypto_eddsa_privkey_export },
    { "eddsa_privkey_import", bcrypto_eddsa_privkey_import },
    { "eddsa_privkey_expand", bcrypto_eddsa_privkey_expand },
    { "eddsa_privkey_convert", bcrypto_eddsa_privkey_convert },
    { "eddsa_scalar_generate", bcrypto_eddsa_scalar_generate },
    { "eddsa_scalar_verify", bcrypto_eddsa_scalar_verify },
    { "eddsa_scalar_clamp", bcrypto_eddsa_scalar_clamp },
    { "eddsa_scalar_is_zero", bcrypto_eddsa_scalar_is_zero },
    { "eddsa_scalar_tweak_add", bcrypto_eddsa_scalar_tweak_add },
    { "eddsa_scalar_tweak_mul", bcrypto_eddsa_scalar_tweak_mul },
    { "eddsa_scalar_reduce", bcrypto_eddsa_scalar_reduce },
    { "eddsa_scalar_negate", bcrypto_eddsa_scalar_negate },
    { "eddsa_scalar_invert", bcrypto_eddsa_scalar_invert },
    { "eddsa_pubkey_create", bcrypto_eddsa_pubkey_create },
    { "eddsa_pubkey_from_scalar", bcrypto_eddsa_pubkey_from_scalar },
    { "eddsa_pubkey_convert", bcrypto_eddsa_pubkey_convert },
    { "eddsa_pubkey_from_uniform", bcrypto_eddsa_pubkey_from_uniform },
    { "eddsa_pubkey_to_uniform", bcrypto_eddsa_pubkey_to_uniform },
    { "eddsa_pubkey_from_hash", bcrypto_eddsa_pubkey_from_hash },
    { "eddsa_pubkey_to_hash", bcrypto_eddsa_pubkey_to_hash },
    { "eddsa_pubkey_verify", bcrypto_eddsa_pubkey_verify },
    { "eddsa_pubkey_export", bcrypto_eddsa_pubkey_export },
    { "eddsa_pubkey_import", bcrypto_eddsa_pubkey_import },
    { "eddsa_pubkey_is_infinity", bcrypto_eddsa_pubkey_is_infinity },
    { "eddsa_pubkey_is_small", bcrypto_eddsa_pubkey_is_small },
    { "eddsa_pubkey_has_torsion", bcrypto_eddsa_pubkey_has_torsion },
    { "eddsa_pubkey_tweak_add", bcrypto_eddsa_pubkey_tweak_add },
    { "eddsa_pubkey_tweak_mul", bcrypto_eddsa_pubkey_tweak_mul },
    { "eddsa_pubkey_combine", bcrypto_eddsa_pubkey_combine },
    { "eddsa_pubkey_negate", bcrypto_eddsa_pubkey_negate },
    { "eddsa_sign", bcrypto_eddsa_sign },
    { "eddsa_sign_with_scalar", bcrypto_eddsa_sign_with_scalar },
    { "eddsa_sign_tweak_add", bcrypto_eddsa_sign_tweak_add },
    { "eddsa_sign_tweak_mul", bcrypto_eddsa_sign_tweak_mul },
    { "eddsa_verify", bcrypto_eddsa_verify },
    { "eddsa_verify_single", bcrypto_eddsa_verify_single },
    { "eddsa_verify_batch", bcrypto_eddsa_verify_batch },
    { "eddsa_derive", bcrypto_eddsa_derive },
    { "eddsa_derive_with_scalar", bcrypto_eddsa_derive_with_scalar },

    /* Edwards Curve */
    { "edwards_curve_create", bcrypto_edwards_curve_create },
    { "edwards_curve_field_size", bcrypto_edwards_curve_field_size },
    { "edwards_curve_field_bits", bcrypto_edwards_curve_field_bits },
    { "edwards_curve_randomize", bcrypto_edwards_curve_randomize },

    /* Hash */
    { "hash_create", bcrypto_hash_create },
    { "hash_init", bcrypto_hash_init },
    { "hash_update", bcrypto_hash_update },
    { "hash_final", bcrypto_hash_final },
    { "hash_digest", bcrypto_hash_digest },
    { "hash_root", bcrypto_hash_root },
    { "hash_multi", bcrypto_hash_multi },

    /* Hash-DRBG */
    { "hash_drbg_create", bcrypto_hash_drbg_create },
    { "hash_drbg_init", bcrypto_hash_drbg_init },
    { "hash_drbg_reseed", bcrypto_hash_drbg_reseed },
    { "hash_drbg_generate", bcrypto_hash_drbg_generate },

    /* HKDF */
    { "hkdf_extract", bcrypto_hkdf_extract },
    { "hkdf_expand", bcrypto_hkdf_expand },

    /* HMAC */
    { "hmac_create", bcrypto_hmac_create },
    { "hmac_init", bcrypto_hmac_init },
    { "hmac_update", bcrypto_hmac_update },
    { "hmac_final", bcrypto_hmac_final },
    { "hmac_digest", bcrypto_hmac_digest },

    /* HMAC-DRBG */
    { "hmac_drbg_create", bcrypto_hmac_drbg_create },
    { "hmac_drbg_init", bcrypto_hmac_drbg_init },
    { "hmac_drbg_reseed", bcrypto_hmac_drbg_reseed },
    { "hmac_drbg_generate", bcrypto_hmac_drbg_generate },

    /* Keccak */
    { "keccak_create", bcrypto_keccak_create },
    { "keccak_init", bcrypto_keccak_init },
    { "keccak_update", bcrypto_keccak_update },
    { "keccak_final", bcrypto_keccak_final },
    { "keccak_digest", bcrypto_keccak_digest },
    { "keccak_root", bcrypto_keccak_root },
    { "keccak_multi", bcrypto_keccak_multi },

    /* Montgomery Curve */
    { "mont_curve_create", bcrypto_mont_curve_create },
    { "mont_curve_field_size", bcrypto_mont_curve_field_size },
    { "mont_curve_field_bits", bcrypto_mont_curve_field_bits },

    /* Murmur3 */
    { "murmur3_sum", bcrypto_murmur3_sum },
    { "murmur3_tweak", bcrypto_murmur3_tweak },

    /* PBKDF2 */
    { "pbkdf2_derive", bcrypto_pbkdf2_derive },
    { "pbkdf2_derive_async", bcrypto_pbkdf2_derive_async },

    /* PGPDF */
    { "pgpdf_derive_simple", bcrypto_pgpdf_derive_simple },
    { "pgpdf_derive_salted", bcrypto_pgpdf_derive_salted },
    { "pgpdf_derive_iterated", bcrypto_pgpdf_derive_iterated },

    /* Poly1305 */
    { "poly1305_create", bcrypto_poly1305_create },
    { "poly1305_init", bcrypto_poly1305_init },
    { "poly1305_update", bcrypto_poly1305_update },
    { "poly1305_final", bcrypto_poly1305_final },
    { "poly1305_destroy", bcrypto_poly1305_destroy },
    { "poly1305_verify", bcrypto_poly1305_verify },

    /* RC4 */
    { "rc4_create", bcrypto_rc4_create },
    { "rc4_init", bcrypto_rc4_init },
    { "rc4_encrypt", bcrypto_rc4_encrypt },
    { "rc4_destroy", bcrypto_rc4_destroy },

    /* RNG */
    { "rng_create", bcrypto_rng_create },
    { "rng_init", bcrypto_rng_init },
    { "rng_generate", bcrypto_rng_generate },
    { "rng_random", bcrypto_rng_random },
    { "rng_uniform", bcrypto_rng_uniform },
    { "getentropy", bcrypto_getentropy },

    /* RSA */
    { "rsa_privkey_generate", bcrypto_rsa_privkey_generate },
    { "rsa_privkey_generate_async", bcrypto_rsa_privkey_generate_async },
    { "rsa_privkey_bits", bcrypto_rsa_privkey_bits },
    { "rsa_privkey_verify", bcrypto_rsa_privkey_verify },
    { "rsa_privkey_import", bcrypto_rsa_privkey_import },
    { "rsa_privkey_export", bcrypto_rsa_privkey_export },
    { "rsa_pubkey_create", bcrypto_rsa_pubkey_create },
    { "rsa_pubkey_bits", bcrypto_rsa_pubkey_bits },
    { "rsa_pubkey_verify", bcrypto_rsa_pubkey_verify },
    { "rsa_pubkey_import", bcrypto_rsa_pubkey_import },
    { "rsa_pubkey_export", bcrypto_rsa_pubkey_export },
    { "rsa_sign", bcrypto_rsa_sign },
    { "rsa_verify", bcrypto_rsa_verify },
    { "rsa_encrypt", bcrypto_rsa_encrypt },
    { "rsa_decrypt", bcrypto_rsa_decrypt },
    { "rsa_sign_pss", bcrypto_rsa_sign_pss },
    { "rsa_verify_pss", bcrypto_rsa_verify_pss },
    { "rsa_encrypt_oaep", bcrypto_rsa_encrypt_oaep },
    { "rsa_decrypt_oaep", bcrypto_rsa_decrypt_oaep },
    { "rsa_veil", bcrypto_rsa_veil },
    { "rsa_unveil", bcrypto_rsa_unveil },

    /* Salsa20 */
    { "salsa20_create", bcrypto_salsa20_create },
    { "salsa20_init", bcrypto_salsa20_init },
    { "salsa20_encrypt", bcrypto_salsa20_encrypt },
    { "salsa20_destroy", bcrypto_salsa20_destroy },
    { "salsa20_derive", bcrypto_salsa20_derive },

    /* Schnorr */
    { "schnorr_privkey_generate", bcrypto_schnorr_privkey_generate },
    { "schnorr_privkey_verify", bcrypto_schnorr_privkey_verify },
    { "schnorr_privkey_export", bcrypto_schnorr_privkey_export },
    { "schnorr_privkey_import", bcrypto_schnorr_privkey_import },
    { "schnorr_privkey_tweak_add", bcrypto_schnorr_privkey_tweak_add },
    { "schnorr_privkey_tweak_mul", bcrypto_schnorr_privkey_tweak_mul },
    { "schnorr_privkey_reduce", bcrypto_schnorr_privkey_reduce },
    { "schnorr_privkey_invert", bcrypto_schnorr_privkey_invert },
    { "schnorr_pubkey_create", bcrypto_schnorr_pubkey_create },
    { "schnorr_pubkey_from_uniform", bcrypto_schnorr_pubkey_from_uniform },
    { "schnorr_pubkey_to_uniform", bcrypto_schnorr_pubkey_to_uniform },
    { "schnorr_pubkey_from_hash", bcrypto_schnorr_pubkey_from_hash },
    { "schnorr_pubkey_to_hash", bcrypto_schnorr_pubkey_to_hash },
    { "schnorr_pubkey_verify", bcrypto_schnorr_pubkey_verify },
    { "schnorr_pubkey_export", bcrypto_schnorr_pubkey_export },
    { "schnorr_pubkey_import", bcrypto_schnorr_pubkey_import },
    { "schnorr_pubkey_tweak_add", bcrypto_schnorr_pubkey_tweak_add },
    { "schnorr_pubkey_tweak_mul", bcrypto_schnorr_pubkey_tweak_mul },
    { "schnorr_pubkey_tweak_sum", bcrypto_schnorr_pubkey_tweak_sum },
    { "schnorr_pubkey_tweak_test", bcrypto_schnorr_pubkey_tweak_test },
    { "schnorr_pubkey_combine", bcrypto_schnorr_pubkey_combine },
    { "schnorr_sign", bcrypto_schnorr_sign },
    { "schnorr_verify", bcrypto_schnorr_verify },
    { "schnorr_verify_batch", bcrypto_schnorr_verify_batch },
    { "schnorr_derive", bcrypto_schnorr_derive },

    /* Schnorr Legacy */
    { "schnorr_legacy_sign", bcrypto_schnorr_legacy_sign },
    { "schnorr_legacy_verify", bcrypto_schnorr_legacy_verify },
    { "schnorr_legacy_verify_batch", bcrypto_schnorr_legacy_verify_batch },

    /* Scrypt */
    { "scrypt_derive", bcrypto_scrypt_derive },
    { "scrypt_derive_async", bcrypto_scrypt_derive_async },

#ifdef BCRYPTO_USE_SECP256K1
    /* Secp256k1 */
    { "secp256k1_context_create", bcrypto_secp256k1_context_create },
    { "secp256k1_context_randomize", bcrypto_secp256k1_context_randomize },
    { "secp256k1_privkey_generate", bcrypto_secp256k1_privkey_generate },
    { "secp256k1_privkey_verify", bcrypto_secp256k1_privkey_verify },
    { "secp256k1_privkey_export", bcrypto_secp256k1_privkey_export },
    { "secp256k1_privkey_import", bcrypto_secp256k1_privkey_import },
    { "secp256k1_privkey_tweak_add", bcrypto_secp256k1_privkey_tweak_add },
    { "secp256k1_privkey_tweak_mul", bcrypto_secp256k1_privkey_tweak_mul },
    { "secp256k1_privkey_reduce", bcrypto_secp256k1_privkey_reduce },
    { "secp256k1_privkey_negate", bcrypto_secp256k1_privkey_negate },
    { "secp256k1_privkey_invert", bcrypto_secp256k1_privkey_invert },
    { "secp256k1_pubkey_create", bcrypto_secp256k1_pubkey_create },
    { "secp256k1_pubkey_convert", bcrypto_secp256k1_pubkey_convert },
    { "secp256k1_pubkey_from_uniform", bcrypto_secp256k1_pubkey_from_uniform },
    { "secp256k1_pubkey_to_uniform", bcrypto_secp256k1_pubkey_to_uniform },
    { "secp256k1_pubkey_from_hash", bcrypto_secp256k1_pubkey_from_hash },
    { "secp256k1_pubkey_to_hash", bcrypto_secp256k1_pubkey_to_hash },
    { "secp256k1_pubkey_verify", bcrypto_secp256k1_pubkey_verify },
    { "secp256k1_pubkey_export", bcrypto_secp256k1_pubkey_export },
    { "secp256k1_pubkey_import", bcrypto_secp256k1_pubkey_import },
    { "secp256k1_pubkey_tweak_add", bcrypto_secp256k1_pubkey_tweak_add },
    { "secp256k1_pubkey_tweak_mul", bcrypto_secp256k1_pubkey_tweak_mul },
    { "secp256k1_pubkey_combine", bcrypto_secp256k1_pubkey_combine },
    { "secp256k1_pubkey_negate", bcrypto_secp256k1_pubkey_negate },
    { "secp256k1_signature_normalize", bcrypto_secp256k1_signature_normalize },
    { "secp256k1_signature_normalize_der", bcrypto_secp256k1_signature_normalize_der },
    { "secp256k1_signature_export", bcrypto_secp256k1_signature_export },
    { "secp256k1_signature_import", bcrypto_secp256k1_signature_import },
    { "secp256k1_is_low_s", bcrypto_secp256k1_is_low_s },
    { "secp256k1_is_low_der", bcrypto_secp256k1_is_low_der },
    { "secp256k1_sign", bcrypto_secp256k1_sign },
    { "secp256k1_sign_recoverable", bcrypto_secp256k1_sign_recoverable },
    { "secp256k1_sign_der", bcrypto_secp256k1_sign_der },
    { "secp256k1_sign_recoverable_der", bcrypto_secp256k1_sign_recoverable_der },
    { "secp256k1_verify", bcrypto_secp256k1_verify },
    { "secp256k1_verify_der", bcrypto_secp256k1_verify_der },
    { "secp256k1_recover", bcrypto_secp256k1_recover },
    { "secp256k1_recover_der", bcrypto_secp256k1_recover_der },
    { "secp256k1_derive", bcrypto_secp256k1_derive },
    { "secp256k1_schnorr_legacy_sign", bcrypto_secp256k1_schnorr_legacy_sign },
    { "secp256k1_schnorr_legacy_verify", bcrypto_secp256k1_schnorr_legacy_verify },
    { "secp256k1_schnorr_legacy_verify_batch", bcrypto_secp256k1_schnorr_legacy_verify_batch },
#ifdef BCRYPTO_USE_SECP256K1_LATEST
    { "secp256k1_xonly_privkey_export", bcrypto_secp256k1_xonly_privkey_export },
    { "secp256k1_xonly_privkey_tweak_add", bcrypto_secp256k1_xonly_privkey_tweak_add },
    { "secp256k1_xonly_create", bcrypto_secp256k1_xonly_create },
    { "secp256k1_xonly_from_uniform", bcrypto_secp256k1_xonly_from_uniform },
    { "secp256k1_xonly_to_uniform", bcrypto_secp256k1_xonly_to_uniform },
    { "secp256k1_xonly_from_hash", bcrypto_secp256k1_xonly_from_hash },
    { "secp256k1_xonly_to_hash", bcrypto_secp256k1_xonly_to_hash },
    { "secp256k1_xonly_verify", bcrypto_secp256k1_xonly_verify },
    { "secp256k1_xonly_export", bcrypto_secp256k1_xonly_export },
    { "secp256k1_xonly_import", bcrypto_secp256k1_xonly_import },
    { "secp256k1_xonly_tweak_add", bcrypto_secp256k1_xonly_tweak_add },
    { "secp256k1_xonly_tweak_mul", bcrypto_secp256k1_xonly_tweak_mul },
    { "secp256k1_xonly_tweak_sum", bcrypto_secp256k1_xonly_tweak_sum },
    { "secp256k1_xonly_tweak_test", bcrypto_secp256k1_xonly_tweak_test },
    { "secp256k1_xonly_combine", bcrypto_secp256k1_xonly_combine },
    { "secp256k1_schnorr_sign", bcrypto_secp256k1_schnorr_sign },
    { "secp256k1_schnorr_verify", bcrypto_secp256k1_schnorr_verify },
    { "secp256k1_schnorr_verify_batch", bcrypto_secp256k1_schnorr_verify_batch },
    { "secp256k1_xonly_derive", bcrypto_secp256k1_xonly_derive },
#endif
#endif

    /* Secret Box */
    { "secretbox_seal", bcrypto_secretbox_seal },
    { "secretbox_open", bcrypto_secretbox_open },
    { "secretbox_derive", bcrypto_secretbox_derive },

    /* Siphash */
    { "siphash", bcrypto_siphash },
    { "siphash32", bcrypto_siphash32 },
    { "siphash64", bcrypto_siphash64 },
    { "siphash32k256", bcrypto_siphash32k256 },
    { "siphash64k256", bcrypto_siphash64k256 },
    { "sipmod", bcrypto_sipmod },

    /* Short Weierstrass Curve */
    { "wei_curve_create", bcrypto_wei_curve_create },
    { "wei_curve_field_size", bcrypto_wei_curve_field_size },
    { "wei_curve_field_bits", bcrypto_wei_curve_field_bits },
    { "wei_curve_randomize", bcrypto_wei_curve_randomize }
  };

  static struct {
    const char *name;
    int value;
  } flags[] = {
#ifdef BCRYPTO_USE_SECP256K1
    { "USE_SECP256K1", 1 },
#else
    { "USE_SECP256K1", 0 },
#endif
#ifdef BCRYPTO_USE_SECP256K1_LATEST
    { "USE_SECP256K1_LATEST", 1 },
#else
    { "USE_SECP256K1_LATEST", 0 },
#endif
    { "ENTROPY_SIZE", ENTROPY_SIZE }
  };

  for (i = 0; i < sizeof(funcs) / sizeof(funcs[0]); i++) {
    const char *name = funcs[i].name;
    napi_callback callback = funcs[i].callback;
    napi_value fn;

    CHECK(napi_create_function(env,
                               name,
                               NAPI_AUTO_LENGTH,
                               callback,
                               NULL,
                               &fn) == napi_ok);

    CHECK(napi_set_named_property(env, exports, name, fn) == napi_ok);
  }

  for (i = 0; i < sizeof(flags) / sizeof(flags[0]); i++) {
    const char *name = flags[i].name;
    int value = flags[i].value;
    napi_value val;

    CHECK(napi_create_int32(env, value, &val) == napi_ok);
    CHECK(napi_set_named_property(env, exports, name, val) == napi_ok);
  }

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, bcrypto_init)
