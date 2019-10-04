ALTER TABLE transactions
    ALTER COLUMN vendor_field_hex SET DATA TYPE varchar(255)
	USING
		ENCODE(('\x' || ENCODE(vendor_field_hex, 'escape'))::bytea, 'escape');

ALTER TABLE transactions RENAME vendor_field_hex TO vendor_field;