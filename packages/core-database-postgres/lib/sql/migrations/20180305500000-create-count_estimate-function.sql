-- Function Definition
CREATE OR REPLACE FUNCTION count_estimate(query text) RETURNS integer AS $$
DECLARE
  rec   record;
  rows  integer;
BEGIN
  FOR rec IN EXECUTE 'EXPLAIN ' || query LOOP
    rows := substring(rec."QUERY PLAN" FROM ' rows=([[:digit:]]+)');
    EXIT WHEN rows IS NOT NULL;
  END LOOP;
  RETURN rows;
END;
$$ LANGUAGE plpgsql VOLATILE STRICT;
