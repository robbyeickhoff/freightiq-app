-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

DROP EXTENSION pg_graphql;

CREATE ROLE supabase_privileged_role;

GRANT supabase_privileged_role TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;

CREATE TABLE public.early_access_requests (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  name        text                     NOT NULL,
  email       text                     NOT NULL,
  platform    text                     NOT NULL,
  city_state  text,
  driver_type text,
  notes       text,
  status      text                     DEFAULT 'new'::text NOT NULL
);

ALTER TABLE public.early_access_requests
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.early_access_requests
  ADD CONSTRAINT early_access_requests_pkey PRIMARY KEY (id);

ALTER TABLE public.early_access_requests
  ADD CONSTRAINT early_access_requests_status_check CHECK (status = ANY (ARRAY['new'::text, 'invited'::text, 'installed'::text, 'feedback_received'::text]));

GRANT ALL ON public.early_access_requests TO anon;

GRANT ALL ON public.early_access_requests TO authenticated;

GRANT ALL ON public.early_access_requests TO service_role;

CREATE POLICY "Allow public early access request inserts" ON public.early_access_requests
  FOR INSERT
  TO anon
  WITH CHECK (((name <> ''::text) AND (email <> ''::text) AND (platform = ANY (ARRAY['Android'::text, 'iPhone'::text]))));

CREATE TABLE public.mfi_report_votes (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  report_id  uuid                     NOT NULL,
  user_id    uuid                     NOT NULL,
  vote_value integer                  NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.mfi_report_votes
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mfi_report_votes
  ADD CONSTRAINT mfi_report_votes_pkey PRIMARY KEY (id);

ALTER TABLE public.mfi_report_votes
  ADD CONSTRAINT mfi_report_votes_report_id_user_id_key UNIQUE (report_id, user_id);

ALTER TABLE public.mfi_report_votes
  ADD CONSTRAINT mfi_report_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.mfi_report_votes
  ADD CONSTRAINT mfi_report_votes_vote_value_check CHECK (vote_value = ANY (ARRAY[1, '-1'::integer]));

GRANT ALL ON public.mfi_report_votes TO anon;

GRANT ALL ON public.mfi_report_votes TO authenticated;

GRANT ALL ON public.mfi_report_votes TO service_role;

CREATE INDEX mfi_report_votes_report_id_idx ON public.mfi_report_votes (report_id);

CREATE INDEX mfi_report_votes_user_id_idx ON public.mfi_report_votes (user_id);

CREATE POLICY mfi_report_votes_delete_own ON public.mfi_report_votes
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY mfi_report_votes_insert_own ON public.mfi_report_votes
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY mfi_report_votes_read_all ON public.mfi_report_votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY mfi_report_votes_update_own ON public.mfi_report_votes
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE TABLE public.mfi_reports (
  id                   uuid                     DEFAULT gen_random_uuid() NOT NULL,
  stop_id              text                     NOT NULL,
  user_id              uuid                     NOT NULL,
  deliver_from_type    text,
  deliver_from_details text,
  approach_hint        text,
  back_in_required     boolean,
  truck_fit            text,
  contact              text,
  notes                text,
  votes_up             integer                  DEFAULT 0 NOT NULL,
  votes_down           integer                  DEFAULT 0 NOT NULL,
  created_at           timestamp with time zone DEFAULT now() NOT NULL,
  updated_at           timestamp with time zone DEFAULT now() NOT NULL,
  tractor_type         text,
  delivery_type        text
);

ALTER TABLE public.mfi_reports
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mfi_reports
  ADD CONSTRAINT mfi_reports_pkey PRIMARY KEY (id);

ALTER TABLE public.mfi_report_votes
  ADD CONSTRAINT mfi_report_votes_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.mfi_reports(id) ON DELETE CASCADE;

ALTER TABLE public.mfi_reports
  ADD CONSTRAINT mfi_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.mfi_reports TO anon;

GRANT ALL ON public.mfi_reports TO authenticated;

GRANT ALL ON public.mfi_reports TO service_role;

CREATE INDEX mfi_reports_stop_id_idx ON public.mfi_reports (stop_id);

CREATE INDEX mfi_reports_created_at_idx ON public.mfi_reports (created_at DESC);

CREATE INDEX mfi_reports_user_id_idx ON public.mfi_reports (user_id);

CREATE POLICY mfi_reports_delete_own ON public.mfi_reports
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY mfi_reports_insert_own ON public.mfi_reports
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY mfi_reports_read_all ON public.mfi_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY mfi_reports_update_own ON public.mfi_reports
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE TABLE public.mfi_stops (
  id                   text                     NOT NULL,
  name                 text                     NOT NULL,
  address              text,
  lat                  double precision         NOT NULL,
  lng                  double precision         NOT NULL,
  deliver_from_type    text,
  deliver_from_details text,
  approach_hint        text,
  back_in_required     boolean,
  truck_fit            text,
  contact              text,
  notes                text,
  entrance_lat         double precision,
  entrance_lng         double precision,
  votes_up             integer                  DEFAULT 0 NOT NULL,
  votes_down           integer                  DEFAULT 0 NOT NULL,
  updated_at           timestamp with time zone DEFAULT now() NOT NULL,
  entrance_photo_url   text,
  entrance_photo_path  text,
  user_id              uuid
);

ALTER TABLE public.mfi_stops
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mfi_stops
  ADD CONSTRAINT mfi_stops_pkey PRIMARY KEY (id);

ALTER TABLE public.mfi_reports
  ADD CONSTRAINT mfi_reports_stop_id_fkey FOREIGN KEY (stop_id) REFERENCES public.mfi_stops(id) ON DELETE CASCADE;

GRANT ALL ON public.mfi_stops TO anon;

GRANT ALL ON public.mfi_stops TO authenticated;

GRANT ALL ON public.mfi_stops TO service_role;

CREATE POLICY mfi_stops_delete_own ON public.mfi_stops
  FOR DELETE
  TO authenticated
  USING (((user_id = auth.uid()) OR (user_id IS NULL)));

CREATE POLICY mfi_stops_read_all ON public.mfi_stops
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY mfi_stops_update_all ON public.mfi_stops
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY mfi_stops_write_all ON public.mfi_stops
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE TABLE public.profiles (
  id               uuid                     NOT NULL,
  username         text                     NOT NULL,
  created_at       timestamp with time zone DEFAULT now() NOT NULL,
  reputation_score integer                  DEFAULT 0 NOT NULL,
  tractor_type     text
);

ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_key UNIQUE (username);

GRANT ALL ON public.profiles TO anon;

GRANT ALL ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = id));

CREATE POLICY profiles_read_all ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();
