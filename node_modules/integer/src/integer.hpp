#include <cmath>
#include <string>
#include <node.h>
#include <node_object_wrap.h>
#include "result.hpp"
#include "macros.hpp"

inline void NODE_SET_PROTOTYPE_GETTER(v8::Local<v8::FunctionTemplate> recv, const char* name, v8::AccessorGetterCallback getter) {
	v8::Isolate* isolate = v8::Isolate::GetCurrent();
	v8::HandleScope scope(isolate);
	recv->InstanceTemplate()->SetAccessor(
		StringFromLatin1(isolate, name),
		getter,
		0,
		v8::Local<v8::Value>(),
		v8::AccessControl::ALL_CAN_READ,
		v8::PropertyAttribute::None,
		v8::AccessorSignature::New(isolate, recv)
	);
}
