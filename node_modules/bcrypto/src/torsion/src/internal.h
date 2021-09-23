/*!
 * internal.h - internal utils for libtorsion
 * Copyright (c) 2020, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/libtorsion
 *
 * Several macros based on GMP and libsecp256k1.
 */

#ifndef _TORSION_INTERNAL_H
#define _TORSION_INTERNAL_H

/*
 * Clang Compat
 */

#ifndef __has_builtin
#  define __has_builtin(x) 0
#endif

/*
 * GNUC Compat
 */

#if defined(__GNUC__) && defined(__GNUC_MINOR__)
#  define TORSION_GNUC_PREREQ(maj, min) \
    ((__GNUC__ << 16) + __GNUC_MINOR__ >= ((maj) << 16) + (min))
#else
#  define TORSION_GNUC_PREREQ(maj, min) 0
#endif

/*
 * Builtins
 */

#if TORSION_GNUC_PREREQ(3, 0) || __has_builtin(__builtin_expect)
#  define LIKELY(x) __builtin_expect(!!(x), 1)
#  define UNLIKELY(x) __builtin_expect(!!(x), 0)
#else
#  define LIKELY(x) (x)
#  define UNLIKELY(x) (x)
#endif

/*
 * Assertions
 */

#define ASSERT_ALWAYS(expr) do {                      \
  if (UNLIKELY(!(expr)))                              \
    __torsion_assert_fail(__FILE__, __LINE__, #expr); \
} while (0)

#ifdef TORSION_NO_ASSERT
#  define ASSERT(expr) (void)(expr)
#else
#  define ASSERT(expr) ASSERT_ALWAYS(expr)
#endif

void
__torsion_assert_fail(const char *file, int line, const char *expr);

/*
 * Keywords/Attributes
 */

#if !defined(__STDC_VERSION__) || __STDC_VERSION__ < 199901L
#  if TORSION_GNUC_PREREQ(2, 7)
#    define TORSION_INLINE __inline__
#  elif defined(_MSC_VER)
#    define TORSION_INLINE __inline
#  else
#    define TORSION_INLINE
#  endif
#else
#  define TORSION_INLINE inline
#endif

#if !defined(__STDC_VERSION__) || __STDC_VERSION__ < 199901L
#  if TORSION_GNUC_PREREQ(3, 0)
#    define TORSION_RESTRICT __restrict__
#  elif defined(_MSC_VER) && _MSC_VER >= 1400
#    define TORSION_RESTRICT __restrict
#  else
#    define TORSION_RESTRICT
#  endif
#else
#  define TORSION_RESTRICT restrict
#endif

#ifdef __GNUC__
#  define TORSION_UNUSED __attribute__((unused))
#  define TORSION_EXTENSION __extension__
#else
#  define TORSION_UNUSED
#  define TORSION_EXTENSION
#endif

/*
 * Endianness
 */

/* Any decent compiler should be able to optimize this out. */
static const unsigned long __torsion_endian_check = 1;

#define TORSION_BIGENDIAN \
  (*((const unsigned char *)&__torsion_endian_check) == 0)

/*
 * Configuration
 */

#ifndef TORSION_HAVE_CONFIG
/* TORSION_HAVE_CONFIG signals that the config
   will be passed in via the commandline (-D).
   Otherwise, auto configuration is useful if
   you're using an awful build system like gyp. */

/* Detect arch word size. */
#if defined(__EMSCRIPTEN__)
/* WASM and asm.js run faster as 32 bit. */
#else
#  if defined(__amd64__) \
   || defined(__amd64) \
   || defined(__x86_64__) \
   || defined(__x86_64) \
   || defined(_M_X64) \
   || defined(_M_AMD64) \
   || defined(__aarch64__) \
   || defined(_M_ARM64) \
   || defined(__ia64__) \
   || defined(_IA64) \
   || defined(__IA64__) \
   || defined(__ia64) \
   || defined(_M_IA64) \
   || ((defined(__mips__) \
     || defined(__mips) \
     || defined(__MIPS__)) \
     && defined(_MIPS_SZLONG) \
     && _MIPS_SZLONG == 64) \
   || ((defined(__powerpc) \
     || defined(__powerpc__) \
     || defined(__POWERPC__) \
     || defined(__ppc__) \
     || defined(__PPC__) \
     || defined(_M_PPC) \
     || defined(_ARCH_PPC)) \
     && defined(__64BIT__)) \
   || defined(__powerpc64__) \
   || defined(__ppc64__) \
   || defined(__PPC64__) \
   || defined(_ARCH_PPC64) \
   || defined(__sparc_v9__) \
   || defined(__sparcv9)
#    define TORSION_HAVE_64BIT
#  endif
#endif

/* Detect inline ASM support for x86-64. */
#if defined(__EMSCRIPTEN__) \
 || defined(__CYGWIN__) \
 || defined(__MINGW32__) \
 || defined(_WIN32)
/* No inline ASM support for wasm/asm.js/win32. */
#else
#  ifdef __GNUC__
#    if defined(__amd64__) || defined(__x86_64__)
#      define TORSION_HAVE_ASM_X64
#    endif
#  endif
#endif

/* Detect __int128 support. */
#if defined(__EMSCRIPTEN__)
/* According to libsodium, __int128 is broken in emscripten builds.
   See: https://github.com/jedisct1/libsodium/blob/master/configure.ac */
#else
/* According to this SO post[1], __int128 is supported
   since gcc 4.6 and clang 3.1. However, a quick look at
   godbolt suggests clang only gained support in 3.6. Note
   that icc has supported __int128 since 13.0, but didn't
   define `__SIZEOF_INT128__` until 16.0. All three of the
   aforementioned compilers define `__GNUC__` (and have
   since... forever?).

   [1] https://stackoverflow.com/a/54815033 */
#  ifdef TORSION_HAVE_64BIT
#    if defined(__GNUC__) && defined(__SIZEOF_INT128__)
#      define TORSION_HAVE_INT128
#    endif
#  endif
#endif

/* Allow some overrides (for testing). */
#ifdef TORSION_FORCE_32BIT
#  undef TORSION_HAVE_64BIT
#  undef TORSION_HAVE_ASM_X64
#  undef TORSION_HAVE_INT128
#endif

#ifdef TORSION_NO_ASM
#  undef TORSION_HAVE_ASM_X64
#endif

#ifdef TORSION_NO_INT128
#  undef TORSION_HAVE_INT128
#endif

#endif /* !TORSION_HAVE_CONFIG */

/*
 * Types
 */

#ifdef TORSION_HAVE_INT128
TORSION_EXTENSION typedef unsigned __int128 torsion_uint128_t;
TORSION_EXTENSION typedef signed __int128 torsion_int128_t;
#endif

/*
 * Sanity Checks
 */

#if (-1 & 3) != 3
#  error "Two's complement is required."
#endif

/*
 * Macros
 */

#define ENTROPY_SIZE 32
#define ARRAY_SIZE(x) (sizeof(x) / sizeof((x)[0]))

/*
 * Helpers
 */

#define torsion_die __torsion_die
#define torsion_abort __torsion_abort

void
torsion_die(const char *msg);

void
torsion_abort(void);

#endif /* _TORSION_INTERNAL_H */
