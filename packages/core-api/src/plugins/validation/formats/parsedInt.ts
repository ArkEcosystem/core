/* eslint no-restricted-globals: "off" */

export default function(ajv) {
  ajv.addFormat("parsedInt", {
    type: "string",
    validate: (value) => {
      if (
        isNaN(value) ||
        parseInt(value, 10) !== value ||
        isNaN(parseInt(value, 10))
      ) {
        return false;
      }

      value = parseInt(value, 10);

      return true;
    },
  });
}
