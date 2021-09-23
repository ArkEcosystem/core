/*!
 * secretbox.c - nacl secretbox for libtorsion
 * Copyright (c) 2020, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcrypto
 */

#ifndef _TORSION_SECRETBOX_H
#define _TORSION_SECRETBOX_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>

/*
 * Symbol Aliases
 */

#define secretbox_seal torsion_secretbox_seal
#define secretbox_open torsion_secretbox_open
#define secretbox_derive torsion_secretbox_derive

/*
 * Macros
 */

#define SECRETBOX_SEAL_SIZE(len) (16 + (len))
#define SECRETBOX_OPEN_SIZE(len) ((len) < 16 ? 0 : (len) - 16)

/*
 * Secret Box
 */

void
secretbox_seal(unsigned char *sealed,
               const unsigned char *msg,
               size_t msg_len,
               const unsigned char *key,
               const unsigned char *nonce);

int
secretbox_open(unsigned char *msg,
               const unsigned char *sealed,
               size_t sealed_len,
               const unsigned char *key,
               const unsigned char *nonce);

void
secretbox_derive(unsigned char *key, const unsigned char *secret);

#ifdef __cplusplus
}
#endif

#endif /* _TORSION_SECRETBOX_H */
