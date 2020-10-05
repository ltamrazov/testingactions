-- Deploy postgres:add_role_column_to_users to pg

BEGIN;

CREATE TABLE public.users;

COMMIT;