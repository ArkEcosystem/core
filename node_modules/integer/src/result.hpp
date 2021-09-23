typedef v8::Local<v8::Value> (*ErrorType)(v8::Local<v8::String>);

struct Error {
	explicit Error(const char* _message, bool range_error) : message(_message),
		Type(range_error ? v8::Exception::RangeError : v8::Exception::TypeError) {}
	const char* const message;
	const ErrorType Type;
};

class Result {
public:
	explicit Result(const char* message, bool range_error = false) : error(new Error(message, range_error)) {}
	explicit Result(int64_t _value) : error(NULL), value(_value) {}
	~Result() { delete error; }
	inline int64_t Checked() { assert(error == NULL); return value; }
	const Error* const error;
private:
	int64_t value;
};
