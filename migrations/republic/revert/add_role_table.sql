-- Revert postgres:add_role_column_to_users from pg

BEGIN;

DROP TABLE public.users;

COMMIT;
