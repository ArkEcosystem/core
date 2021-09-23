/*!
 * poly1305.h - poly1305 for libtorsion
 * Copyright (c) 2020, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/libtorsion
 */

#ifndef _TORSION_POLY1305_H
#define _TORSION_POLY1305_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>

/*
 * Symbol Aliases
 */

#define poly1305_init torsion_poly1305_init
#define poly1305_update torsion_poly1305_update
#define poly1305_final torsion_poly1305_final
#define poly1305_auth torsion_poly1305_auth
#define poly1305_verify torsion_poly1305_verify

/*
 * Structs
 */

typedef struct _poly1305_s {
  size_t aligner;
  unsigned char opaque[136];
} poly1305_t;

/*
 * Poly1305
 */

void
poly1305_init(poly1305_t *ctx, const unsigned char *key);

void
poly1305_update(poly1305_t *ctx, const unsigned char *m, size_t bytes);

void
poly1305_final(poly1305_t *ctx, unsigned char *mac);

void
poly1305_auth(unsigned char *mac,
              const unsigned char *m,
              size_t bytes,
              const unsigned char *key);

int
poly1305_verify(const unsigned char *mac1, const unsigned char *mac2);

#ifdef __cplusplus
}
#endif

#endif /* _TORSION_POLY1305_H */
