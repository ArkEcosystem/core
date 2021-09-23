/*!
 * hw.c - hardware entropy for libtorsion
 * Copyright (c) 2020, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/libtorsion
 *
 * Resources:
 *   https://en.wikipedia.org/wiki/Time_Stamp_Counter
 *   https://en.wikipedia.org/wiki/RDRAND
 *
 * Windows:
 *   https://docs.microsoft.com/en-us/cpp/c-runtime-library/reference/ftime-ftime32-ftime64?view=vs-2019
 *   https://docs.microsoft.com/en-us/cpp/intrinsics/rdtsc?view=vs-2019
 *
 * Unix:
 *   http://man7.org/linux/man-pages/man2/gettimeofday.2.html
 *
 * VxWorks:
 *   https://docs.windriver.com/bundle/vxworks_7_application_core_os_sr0630-enus/page/CORE/clockLib.html
 *
 * Fuchsia:
 *   https://fuchsia.dev/fuchsia-src/reference/syscalls/clock_get_monotonic
 *
 * CloudABI:
 *   https://nuxi.nl/cloudabi/#clock_time_get
 *
 * WASI:
 *   https://github.com/WebAssembly/WASI/blob/5d10b2c/design/WASI-core.md#clock_time_get
 *   https://github.com/WebAssembly/WASI/blob/2627acd/phases/snapshot/witx/wasi_snapshot_preview1.witx#L58
 *
 * Emscripten (wasm, asm.js):
 *   https://emscripten.org/docs/api_reference/emscripten.h.html
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
 *   https://nodejs.org/api/process.html#process_process_hrtime_time
 *
 * x86{,-64}:
 *   https://www.felixcloutier.com/x86/rdtsc
 *   https://www.felixcloutier.com/x86/rdrand
 *   https://www.felixcloutier.com/x86/rdseed
 */

/**
 * Hardware Entropy
 *
 * One simple source of hardware entropy is the current cycle
 * count. This is accomplished via RDTSC on x86 CPUs. We only
 * call RDTSC if there is an instrinsic for it (win32) or if
 * the compiler supports inline ASM (gcc/clang).
 *
 * For non-x86 hardware, we fallback to whatever system clocks
 * are available. This includes:
 *
 *   - QueryPerformanceCounter, _ftime (win32)
 *   - clock_gettime (unix, vxworks)
 *   - gettimeofday (unix legacy)
 *   - zx_clock_get_monotonic (fuchsia)
 *   - cloudabi_sys_clock_time_get (cloud abi)
 *   - __wasi_clock_time_get (wasi)
 *   - Date.now, process.hrtime (wasm, asm.js)
 *
 * Note that the only clocks which do not have nanosecond
 * precision are `_ftime`, `gettimeofday`, and `Date.now`.
 *
 * Furthermore, QueryPerformance{Counter,Frequency} may fail
 * on Windows 2000. For this reason, we require Windows XP or
 * above (otherwise we fall back to _ftime).
 *
 * The CPUID instruction can serve as good source of "static"
 * entropy for seeding (see env.c).
 *
 * x86{,-64} also offers hardware entropy in the form of RDRAND
 * and RDSEED. There are concerns that these instructions may
 * be backdoored in some way. This is not an issue as we only
 * use hardware entropy to supplement our full entropy pool.
 *
 * For non-x86 hardware, torsion_rdrand and torsion_rdseed are
 * no-ops returning zero. torsion_has_rd{rand,seed} MUST be
 * checked before calling torsion_rd{rand,seed}.
 */

#if !defined(_WIN32) && !defined(_GNU_SOURCE)
/* For clock_gettime(2). */
#  define _GNU_SOURCE
#endif

#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include "entropy.h"

#if defined(__CloudABI__)
uint16_t cloudabi_sys_clock_time_get(uint32_t clock_id,
                                     uint64_t precision,
                                     uint64_t *time);
#  define CLOUDABI_CLOCK_MONOTONIC 1
#elif defined(__wasi__)
uint16_t __wasi_clock_time_get(uint32_t clock_id,
                               uint64_t precision,
                               uint64_t *time);
#  define __WASI_CLOCK_MONOTONIC 1
#elif defined(__EMSCRIPTEN__)
#  include <emscripten.h> /* EM_ASM_INT */
#elif defined(__wasm__) || defined(__asmjs__)
/* nothing */
#elif defined(_WIN32)
#  include <windows.h> /* _WIN32_WINNT, QueryPerformance{Counter,Frequency} */
#  if defined(_WIN32_WINNT) && _WIN32_WINNT >= 0x0501 /* >= Windows XP */
#    pragma comment(lib, "kernel32.lib")
#    define HAVE_QPC
#  else
#    include <sys/timeb.h> /* _timeb, _ftime */
#    ifdef __BORLANDC__
#      define _timeb timeb
#      define _ftime ftime
#    endif
#    ifdef _MSC_VER
#      pragma warning(disable: 4996) /* deprecation warning */
#    endif
#  endif
#  if defined(_MSC_VER) && _MSC_VER >= 1900 /* VS 2015 */
#    if defined(_M_X64) || defined(_M_AMD64) || defined(_M_IX86)
#      include <intrin.h> /* __cpuidex, __rdtsc */
#      include <immintrin.h> /* _rd{rand,seed}{32,64}_step */
#      pragma intrinsic(__cpuidex, __rdtsc)
#      define HAVE_CPUIDEX
#      define HAVE_RDTSC
#    endif
#  endif
#elif defined(__vxworks)
#  include <time.h> /* clock_gettime */
#elif defined(__fuchsia__)
#  include <zircon/syscalls.h> /* zx_clock_get_monotonic */
#else
#  include <time.h> /* clock_gettime */
#  ifndef CLOCK_MONOTONIC
#    ifdef __APPLE__
#      include <mach/mach.h>
#      include <mach/mach_time.h> /* mach_timebase_info, mach_absolute_time */
#    else
#      include <sys/time.h> /* gettimeofday */
#    endif
#  endif
#  if defined(__GNUC__)
#    define HAVE_INLINE_ASM
#    if defined(__x86_64__) || defined(__amd64__) || defined(__i386__)
#      define HAVE_CPUID
#    endif
#  endif
#endif

/*
 * High-Resolution Time
 */

uint64_t
torsion_hrtime(void) {
#if defined(__CloudABI__)
  uint64_t time;

  if (cloudabi_sys_clock_time_get(CLOUDABI_CLOCK_MONOTONIC, 0, &time) != 0)
    abort();

  return time;
#elif defined(__wasi__)
  uint64_t time;

  if (__wasi_clock_time_get(__WASI_CLOCK_MONOTONIC, 0, &time) != 0)
    abort();

  return time;
#elif defined(__EMSCRIPTEN__)
  uint32_t sec, nsec;

  int ret = EM_ASM_INT({
    try {
      if (typeof process !== 'undefined' && process
          && typeof process.hrtime === 'function') {
        var times = process.hrtime();

        HEAPU32[$0 >>> 2] = times[0];
        HEAPU32[$1 >>> 2] = times[1];

        return 1;
      }

      var now = Date.now ? Date.now() : +new Date();
      var ms = now % 1000;

      HEAPU32[$0 >>> 2] = (now - ms) / 1000;
      HEAPU32[$1 >>> 2] = ms * 1e6;

      return 1;
    } catch (e) {
      return 0;
    }
  }, (void *)&sec, (void *)&nsec);

  if (ret != 1)
    abort();

  return (uint64_t)sec * 1000000000 + (uint64_t)nsec;
#elif defined(__wasm__) || defined(__asmjs__)
  return 0;
#elif defined(HAVE_QPC) /* _WIN32 */
  static unsigned int scale = 1000000000;
  LARGE_INTEGER freq, ctr;
  double scaled, result;

  if (!QueryPerformanceFrequency(&freq))
    abort();

  if (!QueryPerformanceCounter(&ctr))
    abort();

  if (freq.QuadPart == 0)
    abort();

  /* We have no idea of the magnitude of `freq`,
   * so we must resort to double arithmetic[1].
   * Furthermore, we use some wacky arithmetic
   * to avoid a bug in Visual Studio 2019[2][3].
   *
   * [1] https://github.com/libuv/libuv/blob/7967448/src/win/util.c#L503
   * [2] https://github.com/libuv/libuv/issues/1633
   * [3] https://github.com/libuv/libuv/pull/2866
   */
  scaled = (double)freq.QuadPart / scale;
  result = (double)ctr.QuadPart / scaled;

  return (uint64_t)result;
#elif defined(_WIN32)
  /* We could convert GetSystemTimeAsFileTime into
   * unix time like libuv[1], but we opt for the
   * simpler `_ftime()` call a la libsodium[2].
   *
   * [1] https://github.com/libuv/libuv/blob/7967448/src/win/util.c#L1942
   * [2] https://github.com/jedisct1/libsodium/blob/d54f072/src/
   *     libsodium/randombytes/internal/randombytes_internal_random.c#L140
   */
  struct _timeb tb;

  _ftime(&tb);

  return (uint64_t)tb.time * 1000000000 + (uint64_t)tb.millitm * 1000000;
#elif defined(__vxworks)
  struct timespec ts;

  if (clock_gettime(CLOCK_REALTIME, &ts) != 0)
    abort();

  return (uint64_t)ts.tv_sec * 1000000000 + (uint64_t)ts.tv_nsec;
#elif defined(__fuchsia__)
  return zx_clock_get_monotonic();
#elif defined(CLOCK_MONOTONIC)
  struct timespec ts;

  if (clock_gettime(CLOCK_MONOTONIC, &ts) != 0)
    abort();

  return (uint64_t)ts.tv_sec * 1000000000 + (uint64_t)ts.tv_nsec;
#elif defined(__APPLE__)
  mach_timebase_info_data_t info;

  if (mach_timebase_info(&info) != KERN_SUCCESS)
    abort();

  return mach_absolute_time() * info.numer / info.denom;
#else
  struct timeval tv;

  if (gettimeofday(&tv, NULL) != 0)
    abort();

  return (uint64_t)tv.tv_sec * 1000000000 + (uint64_t)tv.tv_usec * 1000;
#endif
}

/*
 * Timestamp Counter
 */

uint64_t
torsion_rdtsc(void) {
#if defined(HAVE_RDTSC)
  return __rdtsc();
#elif defined(HAVE_QPC)
  LARGE_INTEGER ctr;

  if (!QueryPerformanceCounter(&ctr))
    abort();

  return (uint64_t)ctr.QuadPart;
#elif defined(HAVE_INLINE_ASM) && defined(__i386__)
  /* Borrowed from Bitcoin Core. */
  uint64_t r = 0;

  __asm__ __volatile__("rdtsc\n" : "=A" (r));

  return r;
#elif defined(HAVE_INLINE_ASM) && (defined(__x86_64__) || defined(__amd64__))
  /* Borrowed from Bitcoin Core. */
  uint64_t lo = 0;
  uint64_t hi = 0;

  __asm__ __volatile__("rdtsc\n" : "=a" (lo), "=d" (hi));

  return (hi << 32) | lo;
#else
  /* Fall back to high-resolution time. */
  return torsion_hrtime();
#endif
}

/*
 * CPUID
 */

int
torsion_has_cpuid(void) {
#if defined(HAVE_CPUIDEX)
  return 1;
#elif defined(HAVE_CPUID)
#if defined(__i386__)
  uint32_t ax, bx;

  __asm__ __volatile__(
    "pushfl\n"
    "pushfl\n"
    "popl %0\n"
    "movl %0, %1\n"
    "xorl %2, %0\n"
    "pushl %0\n"
    "popfl\n"
    "pushfl\n"
    "popl %0\n"
    "popfl\n"
    : "=&r" (ax), "=&r" (bx)
    : "i" (0x00200000)
  );

  return ((ax ^ bx) >> 21) & 1;
#else /* __i386__ */
  return 1;
#endif /* __i386__ */
#else
  return 0;
#endif
}

void
torsion_cpuid(uint32_t *a,
              uint32_t *b,
              uint32_t *c,
              uint32_t *d,
              uint32_t leaf,
              uint32_t subleaf) {
#if defined(HAVE_CPUIDEX)
  unsigned int regs[4];

  __cpuidex((int *)regs, leaf, subleaf);

  *a = regs[0];
  *b = regs[1];
  *c = regs[2];
  *d = regs[3];
#elif defined(HAVE_CPUID)
  *a = 0;
  *b = 0;
  *c = 0;
  *d = 0;
#if defined(__i386__)
  /* Older GCC versions reserve %ebx as the global
   * offset table register when compiling position
   * independent code[1]. We borrow some assembly
   * from libsodium to work around this.
   *
   * [1] https://gcc.gnu.org/bugzilla/show_bug.cgi?id=54232
   */
  if (torsion_has_cpuid()) {
    __asm__ __volatile__(
      "xchgl %%ebx, %k1\n"
      "cpuid\n"
      "xchgl %%ebx, %k1\n"
      : "=a" (*a), "=&r" (*b), "=c" (*c), "=d" (*d)
      : "0" (leaf), "2" (subleaf)
    );
  }
#else /* __i386__ */
  __asm__ __volatile__(
    "cpuid\n"
    : "=a" (*a), "=b" (*b), "=c" (*c), "=d" (*d)
    : "0" (leaf), "2" (subleaf)
  );
#endif /* __i386__ */
#else
  (void)leaf;
  (void)subleaf;

  *a = 0;
  *b = 0;
  *c = 0;
  *d = 0;
#endif
}

/*
 * RDRAND/RDSEED
 */

int
torsion_has_rdrand(void) {
#if defined(HAVE_CPUIDEX) || defined(HAVE_CPUID)
  uint32_t eax, ebx, ecx, edx;

  torsion_cpuid(&eax, &ebx, &ecx, &edx, 1, 0);

  return (ecx >> 30) & 1;
#else
  return 0;
#endif
}

int
torsion_has_rdseed(void) {
#if defined(HAVE_CPUIDEX) || defined(HAVE_CPUID)
  uint32_t eax, ebx, ecx, edx;

  torsion_cpuid(&eax, &ebx, &ecx, &edx, 7, 0);

  return (ebx >> 18) & 1;
#else
  return 0;
#endif
}

uint64_t
torsion_rdrand(void) {
#if defined(HAVE_CPUIDEX)
#if defined(_M_IX86)
  unsigned int lo, hi;
  int i;

  for (i = 0; i < 10; i++) {
    if (_rdrand32_step(&lo))
      break;
  }

  for (i = 0; i < 10; i++) {
    if (_rdrand32_step(&hi))
      break;
  }

  return ((uint64_t)hi << 32) | lo;
#else /* _M_IX86 */
  unsigned __int64 r;
  int i;

  for (i = 0; i < 10; i++) {
    if (_rdrand64_step(&r))
      break;
  }

  return r;
#endif /* _M_IX86 */
#elif defined(HAVE_CPUID)
#if defined(__i386__)
  /* Borrowed from Bitcoin Core. */
  uint32_t lo, hi;
  uint8_t ok;
  int i;

  for (i = 0; i < 10; i++) {
    __asm__ __volatile__(
      ".byte 0x0f, 0xc7, 0xf0\n" /* rdrand %eax */
      "setc %1\n"
      : "=a" (lo), "=q" (ok)
      :
      : "cc"
    );

    if (ok)
      break;
  }

  for (i = 0; i < 10; i++) {
    __asm__ __volatile__(
      ".byte 0x0f, 0xc7, 0xf0\n" /* rdrand %eax */
      "setc %1\n"
      : "=a" (hi), "=q" (ok)
      :
      : "cc"
    );

    if (ok)
      break;
  }

  return ((uint64_t)hi << 32) | lo;
#else /* __i386__ */
  /* Borrowed from Bitcoin Core. */
  uint8_t ok;
  uint64_t r;
  int i;

  for (i = 0; i < 10; i++) {
    __asm__ __volatile__(
      ".byte 0x48, 0x0f, 0xc7, 0xf0\n" /* rdrand %rax */
      "setc %1\n"
      : "=a" (r), "=q" (ok)
      :
      : "cc"
    );

    if (ok)
      break;
  }

  return r;
#endif /* __i386__ */
#else
  return 0;
#endif
}

uint64_t
torsion_rdseed(void) {
#if defined(HAVE_CPUIDEX)
#if defined(_M_IX86)
  unsigned int lo, hi;

  for (;;) {
    if (_rdseed32_step(&lo))
      break;

#ifdef YieldProcessor
    YieldProcessor();
#endif
  }

  for (;;) {
    if (_rdseed32_step(&hi))
      break;

#ifdef YieldProcessor
    YieldProcessor();
#endif
  }

  return ((uint64_t)hi << 32) | lo;
#else /* _M_IX86 */
  unsigned __int64 r;

  for (;;) {
    if (_rdseed64_step(&r))
      break;

#ifdef YieldProcessor
    YieldProcessor();
#endif
  }

  return r;
#endif /* _M_IX86 */
#elif defined(HAVE_CPUID)
#if defined(__i386__)
  /* Borrowed from Bitcoin Core. */
  uint32_t lo, hi;
  uint8_t ok;

  for (;;) {
    __asm__ __volatile__(
      ".byte 0x0f, 0xc7, 0xf8\n" /* rdseed %eax */
      "setc %1\n"
      : "=a" (lo), "=q" (ok)
      :
      : "cc"
    );

    if (ok)
      break;

    __asm__ __volatile__("pause");
  }

  for (;;) {
    __asm__ __volatile__(
      ".byte 0x0f, 0xc7, 0xf8\n" /* rdseed %eax */
      "setc %1\n"
      : "=a" (hi), "=q" (ok)
      :
      : "cc"
    );

    if (ok)
      break;

    __asm__ __volatile__("pause");
  }

  return ((uint64_t)hi << 32) | lo;
#else /* __i386__ */
  /* Borrowed from Bitcoin Core. */
  uint64_t r;
  uint8_t ok;

  for (;;) {
    __asm__ __volatile__(
      ".byte 0x48, 0x0f, 0xc7, 0xf8\n" /* rdseed %rax */
      "setc %1\n"
      : "=a" (r), "=q" (ok)
      :
      : "cc"
    );

    if (ok)
      break;

    __asm__ __volatile__("pause");
  }

  return r;
#endif /* __i386__ */
#else
  return 0;
#endif
}

/*
 * Hardware Entropy
 */

int
torsion_hwrand(void *dst, size_t size) {
#if defined(HAVE_CPUIDEX) || defined(HAVE_CPUID)
  unsigned char *data = (unsigned char *)dst;
  int has_rdrand = torsion_has_rdrand();
  int has_rdseed = torsion_has_rdseed();
  uint64_t x;
  size_t i;

  if (!has_rdrand && !has_rdseed)
    return 0;

  while (size > 0) {
    if (has_rdseed) {
      x = torsion_rdseed();
    } else {
      x = 0;

      /* Idea from Bitcoin Core: force rdrand to reseed. */
      for (i = 0; i < 1024; i++)
        x ^= torsion_rdrand();
    }

    if (size < 8) {
      memcpy(data, &x, size);
      break;
    }

    memcpy(data, &x, 8);

    data += 8;
    size -= 8;
  }

  return 1;
#else
  (void)dst;
  (void)size;
  return 0;
#endif
}
