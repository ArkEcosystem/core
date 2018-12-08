import engine from "../engine"

export default attributes => {
  const { error, value } = engine.validate(attributes, engine.joi.arkAddress());

  return {
    data: value,
    errors: error ? error.details : null,
    passes: !error,
    fails: error
  };
};
