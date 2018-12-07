export default function(ajv) {
  ajv.addFormat("vendorField", {
    type: "string",
    validate: (value) => {
      try {
        return Buffer.from(value).length < 65;
      } catch (e) {
        return false;
      }
    },
  });
}
