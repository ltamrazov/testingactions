-- Verify postgres:create_darth_vader_role on pg

BEGIN;

SELECT 1 FROM pg_roles WHERE rolname='darth_vader';

ROLLBACK;