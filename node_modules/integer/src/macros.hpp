#define NODE_ARGUMENTS const v8::FunctionCallbackInfo<v8::Value>&
#define NODE_GETTER_ARGUMENTS const v8::PropertyCallbackInfo<v8::Value>&
#define NODE_METHOD(name) static void name(NODE_ARGUMENTS info)
#define NODE_GETTER(name) static void name(v8::Local<v8::String> _, NODE_GETTER_ARGUMENTS info)

inline v8::Local<v8::String> StringFromLatin1(v8::Isolate* isolate, const char* data) {
	return v8::String::NewFromOneByte(isolate, reinterpret_cast<const uint8_t*>(data), v8::NewStringType::kNormal).ToLocalChecked();
}

void ThrowException(NODE_ARGUMENTS info, Error error) {
	v8::Isolate* isolate = info.GetIsolate();
	isolate->ThrowException(error.Type(StringFromLatin1(isolate, error.message)));
}
void ThrowTypeError(NODE_ARGUMENTS info, const char* message) { ThrowException(info, Error(message, false)); }
void ThrowRangeError(NODE_ARGUMENTS info, const char* message) { ThrowException(info, Error(message, true)); }

#define _REQUIRE_ARGUMENT(at, var, Type, message, ...)\
	if (info.Length() <= (at()) || !info[at()]->Is##Type())\
		return ThrowTypeError(info, "Expected "#at" arguement to be "#message);\
	var = v8::Local<v8::Type>::Cast(info[at()])__VA_ARGS__

#define REQUIRE_ARGUMENT_INT32(at, var)\
	_REQUIRE_ARGUMENT(at, var, Int32, a regular 32-bit signed integer, ->Value())
#define REQUIRE_ARGUMENT_UINT32(at, var)\
	_REQUIRE_ARGUMENT(at, var, Uint32, a regular 32-bit unsigned integer, ->Value())
#define REQUIRE_ARGUMENT_NUMBER(at, var)\
	_REQUIRE_ARGUMENT(at, var, Number, a number)
#define REQUIRE_ARGUMENT_STRING(at, var)\
	_REQUIRE_ARGUMENT(at, var, String, a string)

#define first() 0
#define second() 1
#define third() 2
#define fourth() 3
#define fifth() 4

#if defined(V8_MAJOR_VERSION) && (V8_MAJOR_VERSION > 6 ||                      \
  (V8_MAJOR_VERSION == 6 && defined(V8_MINOR_VERSION) && V8_MINOR_VERSION >= 2))
#define EXTRACT_STRING(isolate, string) isolate, string
#else
#define EXTRACT_STRING(_unused, string) string
#endif

#define UseValue int64_t value = node::ObjectWrap::Unwrap<Integer>(info.This())->value
#define UseArgument\
	if (info.Length() == 0) return ThrowTypeError(info, "Missing argument");\
	Result cast = Cast(info, info[0]);\
	if (cast.error) return ThrowException(info, *cast.error);\
	int64_t arg = cast.Checked()
