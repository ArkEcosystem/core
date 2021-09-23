/*!
 * rand.h - RNG for libtorsion
 * Copyright (c) 2020, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/libtorsion
 */

#ifndef _TORSION_RAND_H
#define _TORSION_RAND_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>
#include <stdint.h>

/*
 * Symbol Aliases
 */

#define rng_init torsion_rng_init
#define rng_generate torsion_rng_generate
#define rng_random torsion_rng_random
#define rng_uniform torsion_rng_uniform

/*
 * Structs
 */

typedef struct _rng_s {
  uint64_t key[4];
  uint64_t zero;
  uint64_t nonce;
  uint32_t pool[16];
  size_t pos;
  int rdrand;
} rng_t;

/*
 * RNG
 */

int
rng_init(rng_t *rng);

void
rng_generate(rng_t *rng, void *dst, size_t size);

uint32_t
rng_random(rng_t *rng);

uint32_t
rng_uniform(rng_t *rng, uint32_t max);

/*
 * Entropy
 */

int
torsion_getentropy(void *dst, size_t size);

#ifdef __cplusplus
}
#endif

#endif /* _TORSION_RAND_H */
