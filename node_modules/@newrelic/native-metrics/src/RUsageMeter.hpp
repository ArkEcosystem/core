#pragma once

#include <nan.h>

namespace nr {

class RUsageMeter : public Nan::ObjectWrap {
public:
  /**
   * Initialze the RUsageMeter JS class.
   */
  static NAN_MODULE_INIT(Init) {
    v8::Local<v8::FunctionTemplate> clas = Nan::New<v8::FunctionTemplate>(New);
    clas->SetClassName(Nan::New("RUsageMeter").ToLocalChecked());
    clas->InstanceTemplate()->SetInternalFieldCount(1);

    SetPrototypeMethod(clas, "read", Read);

    constructor().Reset(Nan::GetFunction(clas).ToLocalChecked());
    Nan::Set(
      target,
      Nan::New("RUsageMeter").ToLocalChecked(),
      Nan::GetFunction(clas).ToLocalChecked()
    );
  }

  /**
   * JS constructor.
   */
  static NAN_METHOD(New) {
    RUsageMeter* obj = new RUsageMeter();
    obj->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
  }

  /**
   * Performs internal update of resource usage and returns the diff.
   *
   * @return The diff of the last usage reading and this one.
   */
  static NAN_METHOD(Read);

  RUsageMeter() {
    std::memset(&_lastUsage, 0, sizeof(uv_rusage_t));
  }

private:
  static inline Nan::Persistent<v8::Function> & constructor() {
    // ???
    static Nan::Persistent<v8::Function> _constructor;
    return _constructor;
  }

  /**
   * Fetches the latest resource usage numbers from libuv and updates the diff.
   */
  void _read();

  /**
   * Copies `uv_rusage_t` instances into new JS objects.
   *
   * @param usage The resource usage stats to copy.
   *
   * @return A JS object containing all the values of the given usage data.
   */
  v8::Local<v8::Object> _usageToJSObj(const uv_rusage_t& usage);

  uv_rusage_t _usageDiff;
  uv_rusage_t _lastUsage;
};

}
