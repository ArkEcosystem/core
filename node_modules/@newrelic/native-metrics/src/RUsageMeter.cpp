
#include <cstring>
#include <nan.h>
#include <uv.h>

#include "RUsageMeter.hpp"

namespace nr {

NAN_METHOD(RUsageMeter::Read) {
  Nan::HandleScope scope;

  // Update our stats.
  RUsageMeter* self = RUsageMeter::Unwrap<RUsageMeter>(info.This());
  self->_read();

  // Build the results object.
  v8::Local<v8::Object> results = Nan::New<v8::Object>();
  Nan::Set(
    results,
    Nan::New("diff").ToLocalChecked(),
    self->_usageToJSObj(self->_usageDiff)
  );
  Nan::Set(
    results,
    Nan::New("current").ToLocalChecked(),
    self->_usageToJSObj(self->_lastUsage)
  );

  // Return the results.
  info.GetReturnValue().Set(results);
}

void RUsageMeter::_read() {
  uv_rusage_t nextUsage;
  uv_getrusage(&nextUsage);

  #define DIFF(X) _usageDiff.X = nextUsage.X - _lastUsage.X
  DIFF(ru_utime.tv_sec);
  DIFF(ru_utime.tv_usec);
  DIFF(ru_stime.tv_sec);
  DIFF(ru_stime.tv_usec);
  DIFF(ru_maxrss);
  DIFF(ru_ixrss);
  DIFF(ru_idrss);
  DIFF(ru_isrss);
  DIFF(ru_minflt);
  DIFF(ru_majflt);
  DIFF(ru_nswap);
  DIFF(ru_inblock);
  DIFF(ru_oublock);
  DIFF(ru_msgsnd);
  DIFF(ru_msgrcv);
  DIFF(ru_nsignals);
  DIFF(ru_nvcsw);
  DIFF(ru_nivcsw);
  #undef DIFF

  std::memcpy(&_lastUsage, &nextUsage, sizeof(uv_rusage_t));
}

v8::Local<v8::Object> RUsageMeter::_usageToJSObj(const uv_rusage_t& usage) {
  // Convert the CPU times into millisecond floating point values.
  double utime = (
    (double)(usage.ru_utime.tv_sec * 1000.0) +
    (double)(usage.ru_utime.tv_usec / 1000.0)
  );
  double stime = (
    (double)(usage.ru_stime.tv_sec * 1000.0) +
    (double)(usage.ru_stime.tv_usec / 1000.0)
  );

  // Copy all the values to V8 objects.
  v8::Local<v8::Object> obj = Nan::New<v8::Object>();
  #define SET(key, val) \
    Nan::Set(obj, Nan::New(key).ToLocalChecked(), Nan::New<v8::Number>((double)val))
  SET("ru_utime",     utime);
  SET("ru_stime",     stime);
  SET("ru_maxrss",    usage.ru_maxrss);
  SET("ru_ixrss",     usage.ru_ixrss);
  SET("ru_idrss",     usage.ru_idrss);
  SET("ru_isrss",     usage.ru_isrss);
  SET("ru_minflt",    usage.ru_minflt);
  SET("ru_majflt",    usage.ru_majflt);
  SET("ru_nswap",     usage.ru_nswap);
  SET("ru_inblock",   usage.ru_inblock);
  SET("ru_oublock",   usage.ru_oublock);
  SET("ru_msgsnd",    usage.ru_msgsnd);
  SET("ru_msgrcv",    usage.ru_msgrcv);
  SET("ru_nsignals",  usage.ru_nsignals);
  SET("ru_nvcsw",     usage.ru_nvcsw);
  SET("ru_nivcsw",    usage.ru_nivcsw);
  #undef SET

  return obj;
}

}
