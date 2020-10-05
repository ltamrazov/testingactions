-- Revert postgres:create_darth_vader_role from pg

BEGIN;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM darth_vader;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM darth_vader;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM darth_vader;
DROP ROLE darth_vader;

COMMIT;