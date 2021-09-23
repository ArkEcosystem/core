/*!
 * sys.c - os/system entropy for libtorsion
 * Copyright (c) 2020, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/libtorsion
 *
 * Resources:
 *   https://en.wikipedia.org/wiki/Entropy-supplying_system_calls
 *   https://en.wikipedia.org/wiki/CryptGenRandom
 *   https://en.wikipedia.org/wiki/dev/random
 *
 * Windows:
 *   https://docs.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptgenrandom
 *   https://docs.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-rtlgenrandom
 *
 * Linux:
 *   http://man7.org/linux/man-pages/man2/getrandom.2.html
 *   http://man7.org/linux/man-pages/man4/random.4.html
 *
 * OSX/iOS:
 *   https://www.unix.com/man-page/mojave/2/getentropy/
 *   https://www.unix.com/man-page/mojave/4/random/
 *
 * OpenBSD:
 *   https://man.openbsd.org/getentropy.2
 *   https://github.com/openbsd/src/blob/2981a53/sys/sys/sysctl.h#L140
 *   https://man.openbsd.org/random.4
 *
 * FreeBSD:
 *   https://www.freebsd.org/cgi/man.cgi?getrandom(2)
 *   https://www.freebsd.org/cgi/man.cgi?getentropy(3)
 *   https://www.freebsd.org/cgi/man.cgi?sysctl(3)
 *   https://www.freebsd.org/cgi/man.cgi?random(4)
 *
 * NetBSD:
 *   https://netbsd.gw.com/cgi-bin/man-cgi?sysctl+3+NetBSD-8.0
 *   https://netbsd.gw.com/cgi-bin/man-cgi?random+4+NetBSD-8.0
 *
 * DragonFly BSD:
 *   https://leaf.dragonflybsd.org/cgi/web-man?command=getrandom&section=2
 *   https://leaf.dragonflybsd.org/cgi/web-man?command=random&section=4
 *
 * Solaris/Illumos:
 *   https://docs.oracle.com/cd/E88353_01/html/E37841/getrandom-2.html
 *   https://docs.oracle.com/cd/E36784_01/html/E36884/random-7d.html
 *
 * VxWorks:
 *   https://docs.windriver.com/bundle/vxworks_7_application_core_os_sr0630-enus/page/CORE/randomNumGenLib.html
 *
 * Fuchsia:
 *   https://fuchsia.dev/fuchsia-src/zircon/syscalls/cprng_draw
 *
 * CloudABI:
 *   https://nuxi.nl/cloudabi/#random_get
 *   https://github.com/NuxiNL/cloudabi/blob/d283c05/headers/cloudabi_syscalls.h#L193
 *   https://github.com/NuxiNL/cloudabi/blob/d283c05/headers/cloudabi_types_common.h#L89
 *
 * WASI:
 *   https://github.com/WebAssembly/WASI/blob/5d10b2c/design/WASI-core.md#random_get
 *   https://github.com/WebAssembly/WASI/blob/2627acd/phases/snapshot/witx/typenames.witx#L34
 *   https://github.com/WebAssembly/WASI/blob/2627acd/phases/snapshot/witx/wasi_snapshot_preview1.witx#L481
 *
 * Emscripten (wasm, asm.js):
 *   https://emscripten.org/docs/api_reference/emscripten.h.html
 *   https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 *   https://nodejs.org/api/crypto.html#crypto_crypto_randomfillsync_buffer_offset_size
 */

/**
 * OS/System Entropy
 *
 * We try to avoid /dev/{u,}random as much as possible. Not
 * only can they behave differenly on different OSes, but they
 * are unreliable in terms of usability (for example, what if
 * we are inside a chroot where /dev has not been setup?).
 *
 * To avoid locking ourselves down to a particular build system,
 * we check for features using only the C preprocessor. There is
 * one edge case as a result of of this: the build may fail for
 * older versions of Solaris. This is due to the fact that the
 * Solaris system header files do not expose a version number.
 * As such, it is impossible to tell whether getrandom(2) is
 * supported from the C preprocessor. Solaris versions released
 * prior to 2015 are affected.
 *
 * In the future, we may consider using dlsym(3) to check
 * features at runtime. This would ensure better ABI
 * compatibility across builds. If GCC is used we can prefer
 * __attribute__((weak)) over dlsym(3). We can take it even
 * further on clang by using __attribute__((availability)).
 *
 * We try to match the behavior of the getrandom rust library[1].
 * The primary difference involves the fact that we do not call
 * `SecRandomCopyBytes` on iOS as it requires us to link to the
 * Apple Security Framework.
 *
 * Our current entropy backends are as follows...
 *
 * Windows:
 *   Source: BCryptGenRandom
 *   Fallback: RtlGenRandom (SystemFunction036)
 *   Support: BCryptGenRandom added in Windows Vista.
 *
 * Linux/Android:
 *   Source: getrandom(2)
 *   Fallback: /dev/urandom (after polling /dev/random)
 *   Support: getrandom(2) added in Linux 3.17.
 *
 * OSX:
 *   Source: getentropy(2)
 *   Fallback: /dev/random (identical to /dev/urandom)
 *   Support: getentropy(2) added in OSX 10.12.
 *
 * iOS:
 *   Source: getentropy(2)
 *   Fallback: /dev/random (identical to /dev/urandom)
 *   Support: getentropy(2) added in iOS 10.0.
 *
 * OpenBSD:
 *   Source: getentropy(2)
 *   Fallback 1: sysctl(2) w/ kern.arandom
 *   Fallback 2: /dev/urandom
 *   Support: getentropy(2) added in OpenBSD 5.6.
 *
 * FreeBSD:
 *   Source: getrandom(2)
 *   Fallback 1: sysctl(2) w/ kern.arandom
 *   Fallback 2: /dev/urandom
 *   Support: getrandom(2) added in FreeBSD 12.0.
 *
 * NetBSD:
 *   Source: sysctl(2) w/ kern.arandom
 *   Fallback: /dev/urandom
 *   Support: kern.arandom was buggy until NetBSD 4.0.
 *
 * DragonFly BSD:
 *   Source: getrandom(2)
 *   Fallback: /dev/random
 *   Support: getrandom(2) added in DragonFly BSD 5.8.
 *
 * Solaris/Illumos:
 *   Source: getrandom(2)
 *   Fallback: /dev/random
 *   Support: getrandom(2) added in Solaris 11.3 (SunOS 5.11.3).
 *
 * Haiku:
 *   Source: /dev/random
 *   Fallback: none
 *
 * Unix:
 *   Source: /dev/urandom
 *   Fallback: none
 *
 * VxWorks:
 *   Source: randBytes (after polling randStatus)
 *   Fallback: none
 *   Support: randBytes added in VxWorks 7.
 *
 * Fuchsia:
 *   Source: zx_cprng_draw(2)
 *   Fallback: none
 *
 * CloudABI:
 *   Source: cloudabi_sys_random_get
 *   Fallback: none
 *
 * WASI:
 *   Source: __wasi_random_get
 *   Fallback: none
 *
 * Emscripten (wasm, asm.js):
 *   Browser:
 *     Source: window.crypto.getRandomValues
 *     Fallback: none
 *   Node.js
 *     Source: crypto.randomFillSync
 *     Fallback: none
 *
 * Note that there is an alternative fallback on linux worth
 * investigating. The _sysctl(2) call allows the generation
 * of random UUIDs (which pull from /dev/urandom) with a name
 * of kern.random.random_uuid. This approach is currently
 * implemented in libuv[2]. This would avoid us having to
 * access a device file which may not exist (!).
 *
 * [1] https://docs.rs/getrandom/0.1.14/getrandom/
 * [2] https://github.com/libuv/libuv/blob/a62f8ce/src/unix/random-sysctl-linux.c
 */

#if defined(__linux__) && !defined(_GNU_SOURCE)
/* For syscall(2). */
#  define _GNU_SOURCE
#endif

#include <assert.h>
#include <errno.h>
#include <limits.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include "entropy.h"

#if defined(__CloudABI__)
uint16_t cloudabi_sys_random_get(void *buf, size_t buf_len);
#elif defined(__wasi__)
uint16_t __wasi_random_get(void *buf, size_t buf_len);
#elif defined(__EMSCRIPTEN__)
#  include <emscripten.h> /* EM_ASM_INT */
#elif defined(__wasm__) || defined(__asmjs__)
/* nothing */
#elif defined(_WIN32)
#  include <windows.h> /* _WIN32_WINNT */
#  if defined(_MSC_VER) && _MSC_VER > 1500 /* VS 2008 */ \
   && defined(_WIN32_WINNT) && _WIN32_WINNT >= 0x0600 /* >= Vista (2007) */
#    include <bcrypt.h> /* BCryptGenRandom */
#    ifndef STATUS_SUCCESS
#      define STATUS_SUCCESS ((NTSTATUS)0)
#    endif
#    pragma comment(lib, "bcrypt.lib")
#    define HAVE_BCRYPTGENRANDOM
#  else
#    define RtlGenRandom SystemFunction036
BOOLEAN NTAPI RtlGenRandom(PVOID RandomBuffer, ULONG RandomBufferLength);
#    pragma comment(lib, "advapi32.lib")
#  endif
#elif defined(__vxworks)
#  include <version.h>
#  if defined(_WRS_VXWORKS_MAJOR) && _WRS_VXWORKS_MAJOR >= 7 /* 7 (2016) */
#    include <randomNumGen.h> /* randBytes */
#    include <taskLib.h> /* taskDelay */
#    define HAVE_RANDBYTES
#  endif
#elif defined(__fuchsia__)
#  include <zircon/syscalls.h>
#else
#  include <sys/types.h> /* open */
#  include <sys/stat.h> /* open, stat */
#  include <fcntl.h> /* open, fcntl */
#  include <unistd.h> /* stat, read, close, syscall */
#  ifndef S_ISNAM
#    ifdef __COMPCERT__
#      define S_ISNAM(x) 1
#    else
#      define S_ISNAM(x) 0
#    endif
#  endif
#  if defined(__linux__)
#    include <poll.h> /* poll */
#    include <sys/syscall.h> /* syscall */
#    if defined(SYS_getrandom) && defined(__NR_getrandom) /* 3.17 (2014) */
#      define getrandom(B, S, F) syscall(SYS_getrandom, (B), (int)(S), (F))
#      define HAVE_GETRANDOM
#    endif
#    define DEV_RANDOM_NAME "/dev/urandom"
#  elif defined(__APPLE__)
#    include <Availability.h>
#    include <TargetConditionals.h>
#    if TARGET_OS_IPHONE
#      if __IPHONE_OS_VERSION_MAX_ALLOWED >= 100000 /* 10.0 (2016) */
#        include <sys/random.h> /* getentropy */
#        define HAVE_GETENTROPY
#      endif
#    else
#      if __MAC_OS_X_VERSION_MAX_ALLOWED >= 101200 /* 10.12 (2016) */
#        include <sys/random.h> /* getentropy */
#        define HAVE_GETENTROPY
#      endif
#    endif
#    define DEV_RANDOM_NAME "/dev/random"
#  elif defined(__OpenBSD__)
#    include <sys/param.h>
#    include <sys/sysctl.h> /* sysctl */
#    if defined(OpenBSD) && OpenBSD >= 201411 /* 5.6 (2014) */
#      define HAVE_GETENTROPY /* resides in unistd.h */
#    endif
#    if defined(CTL_KERN) && defined(KERN_ARND)
#      define HAVE_SYSCTL_ARND
#    endif
#    define DEV_RANDOM_NAME "/dev/urandom"
#  elif defined(__FreeBSD__)
#    include <sys/param.h>
#    include <sys/sysctl.h> /* sysctl */
#    if defined(__FreeBSD_version) && __FreeBSD_version >= 1200000 /* 12.0 (2018) */
#      include <sys/random.h> /* getrandom, getentropy */
#      define HAVE_GETRANDOM
#      define HAVE_GETENTROPY
#    endif
#    if defined(CTL_KERN) && defined(KERN_ARND)
#      define HAVE_SYSCTL_ARND
#    endif
#    define DEV_RANDOM_NAME "/dev/urandom"
#  elif defined(__NetBSD__)
#    include <sys/param.h>
#    include <sys/sysctl.h> /* sysctl */
#    if defined(__NetBSD_Version__) && __NetBSD_Version__ >= 400000000 /* 4.0 (2007) */
#      if defined(CTL_KERN) && defined(KERN_ARND)
#        define HAVE_SYSCTL_ARND
#      endif
#    endif
#    define DEV_RANDOM_NAME "/dev/urandom"
#  elif defined(__DragonFly__)
#    include <sys/param.h>
#    if defined(__DragonFly_version) && __DragonFly_version >= 500800 /* 5.8 (2020) */
#      include <sys/random.h> /* getrandom */
#      define HAVE_GETRANDOM
#    endif
#    define DEV_RANDOM_NAME "/dev/random"
#  elif defined(__sun) && defined(__SVR4) /* 11.3 (2015) */
#    if defined(__SUNPRO_C) || defined(__SUNPRO_CC)
#      if (defined(__SunOS_RELEASE) && __SunOS_RELEASE >= 0x051103) \
        || defined(__SunOS_5_11)
#        include <sys/random.h> /* getrandom */
#        define HAVE_GETRANDOM
#      endif
#    else
#      include <sys/random.h> /* getrandom */
#      define HAVE_GETRANDOM
#    endif
#    define DEV_RANDOM_NAME "/dev/random"
#  elif defined(__HAIKU__)
#    define DEV_RANDOM_NAME "/dev/random"
#  else
#    define DEV_RANDOM_NAME "/dev/urandom"
#  endif
#endif

/*
 * Syscall Entropy
 */

static int
torsion_syscallrand(void *dst, size_t size) {
#if defined(__CloudABI__)
  return cloudabi_sys_random_get(dst, size) == 0;
#elif defined(__wasi__)
  return __wasi_random_get(dst, size) == 0;
#elif defined(__EMSCRIPTEN__)
  if (size > (size_t)INT_MAX)
    return 0;

  return EM_ASM_INT({
    try {
      var ptr = $0;
      var len = $1;
      var crypto = null;

      if (typeof window !== 'undefined' && window)
        crypto = window.crypto || window.msCrypto;
      else if (typeof self !== 'undefined' && self)
        crypto = self.crypto || self.msCrypto;

      if (crypto) {
        var max = 65536;

        while (len > 0) {
          if (max > len)
            max = len;

          var buf = HEAPU8.subarray(ptr, ptr + max);

          crypto.getRandomValues(buf);

          ptr += max;
          len -= max;
        }
      } else {
        var Buffer = require('buffer').Buffer;
        var buf = Buffer.from(HEAPU8.buffer, ptr, len);

        require('crypto').randomFillSync(buf, 0, len);
      }

      return 1;
    } catch (e) {
      return 0;
    }
  }, dst, size);
#elif defined(__wasm__) || defined(__asmjs__)
  return 0;
#elif defined(HAVE_BCRYPTGENRANDOM) /* _WIN32 */
  return BCryptGenRandom(NULL, (PUCHAR)dst, (ULONG)size,
                         BCRYPT_USE_SYSTEM_PREFERRED_RNG) == STATUS_SUCCESS;
#elif defined(_WIN32)
  return RtlGenRandom((PVOID)dst, (ULONG)size) == TRUE;
#elif defined(HAVE_RANDBYTES) /* __vxworks */
  /* Borrowed from OpenSSL. */
  size_t i;

  if (size > (size_t)INT_MAX)
    return 0;

  for (i = 0; i < 10; i++) {
    RANDOM_NUM_GEN_STATUS status = randStatus();

    if (status != RANDOM_NUM_GEN_ENOUGH_ENTROPY
        && status != RANDOM_NUM_GEN_MAX_ENTROPY) {
      taskDelay(5);
      continue;
    }

    if (randBytes((unsigned char *)dst, (int)size) == 0)
      return 1;
  }

  return 0;
#elif defined(__fuchsia__)
  zx_cprng_draw(dst, size);
  return 1;
#elif defined(HAVE_GETRANDOM)
  unsigned char *data = (unsigned char *)dst;
  size_t max = 256;
  ssize_t nread;

  while (size > 0) {
    if (max > size)
      max = size;

    for (;;) {
      nread = getrandom(data, max, 0);

      if (nread < 0) {
        if (errno == EINTR || errno == EAGAIN)
          continue;
      }

      break;
    }

    if (nread < 0)
      return 0;

    assert(size >= (size_t)nread);

    data += nread;
    size -= nread;
  }

  return 1;
#elif defined(HAVE_GETENTROPY)
  unsigned char *data = (unsigned char *)dst;
  size_t max = 256;

  /* NULL on older iOS versions. */
  /* See: https://github.com/jedisct1/libsodium/commit/d54f072 */
  if (&getentropy == NULL)
    return 0;

  while (size > 0) {
    if (max > size)
      max = size;

    if (getentropy(data, max) != 0)
      return 0;

    data += max;
    size -= max;
  }

  return 1;
#elif defined(HAVE_SYSCTL_ARND)
  static int name[2] = {CTL_KERN, KERN_ARND};
  unsigned char *data = (unsigned char *)dst;
  size_t max = 256;
  size_t nread;

  /* Older FreeBSD versions returned longs.
     Error if we're not properly aligned. */
#ifdef __FreeBSD__
  /* See: https://github.com/openssl/openssl/blob/ddec332/crypto/rand/rand_unix.c#L231 */
  if ((size % sizeof(long)) != 0)
    return 0;
#endif

  while (size > 0) {
    if (max > size)
      max = size;

    nread = max;

    if (sysctl(name, 2, data, &nread, NULL, 0) != 0)
      return 0;

    assert(size >= nread);

    data += nread;
    size -= nread;
  }

  return 1;
#else
  (void)dst;
  (void)size;
  return 0;
#endif
}

/*
 * Device Entropy
 */

static int
torsion_devrand(void *dst, size_t size) {
#ifdef DEV_RANDOM_NAME
  unsigned char *data = (unsigned char *)dst;
#ifdef __linux__
  struct pollfd pfd;
  int ret;
#endif
  struct stat st;
  ssize_t nread;
  int fd;

#ifdef __linux__
  fd = open("/dev/random", O_RDONLY);

  if (fd == -1)
    return 0;

  pfd.fd = fd;
  pfd.events = POLLIN;
  pfd.revents = 0;

  for (;;) {
    ret = poll(&pfd, 1, -1);

    if (ret < 0) {
      if (errno == EINTR || errno == EAGAIN)
        continue;
    }

    break;
  }

  if (ret != 1) {
    close(fd);
    return 0;
  }

  if (close(fd) != 0)
    return 0;
#endif

  for (;;) {
    fd = open(DEV_RANDOM_NAME, O_RDONLY);

    if (fd == -1) {
      if (errno == EINTR)
        continue;

      return 0;
    }

    if (fstat(fd, &st) != 0) {
      close(fd);
      return 0;
    }

    /* Ensure this is a character device. */
    if (!S_ISCHR(st.st_mode) && !S_ISNAM(st.st_mode)) {
      close(fd);
      return 0;
    }

#if defined(F_SETFD) && defined(FD_CLOEXEC)
    /* Close on exec(). */
    fcntl(fd, F_SETFD, fcntl(fd, F_GETFD) | FD_CLOEXEC);
#endif

    break;
  }

  while (size > 0) {
    for (;;) {
      nread = read(fd, data, size);

      if (nread < 0) {
        if (errno == EINTR || errno == EAGAIN)
          continue;
      }

      break;
    }

    if (nread <= 0)
      break;

    assert(size >= (size_t)nread);

    data += nread;
    size -= nread;
  }

  close(fd);

  return size == 0;
#else /* DEV_RANDOM_NAME */
  (void)dst;
  (void)size;
  return 0;
#endif /* DEV_RANDOM_NAME */
}

/*
 * Entropy
 */

int
torsion_sysrand(void *dst, size_t size) {
  if (size == 0)
    return 1;

  return torsion_syscallrand(dst, size)
      || torsion_devrand(dst, size);
}
