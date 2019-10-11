UPDATE transactions SET vendor_field_hex = ('\x' || ENCODE(vendor_field_hex, 'escape'))::BYTEA;

ALTER TABLE transactions RENAME vendor_field_hex TO vendor_field;
