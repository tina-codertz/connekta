-- Database trigger: call send-alert-push edge function when SOS / place alerts are created.
-- Deploy the function first, then configure alert_push_config (see bottom of this file).

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.alert_push_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  function_url TEXT NOT NULL,
  auth_header TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alert_push_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.alert_push_config FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.trigger_send_alert_push()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_row public.alert_push_config%ROWTYPE;
BEGIN
  IF NEW.type NOT IN ('sos', 'arrival', 'departure') THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO config_row
  FROM public.alert_push_config
  WHERE id = 1 AND enabled = true;

  IF NOT FOUND OR config_row.function_url IS NULL OR config_row.auth_header IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := config_row.function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', config_row.auth_header
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', jsonb_build_object(
        'id', NEW.id,
        'circle_id', NEW.circle_id,
        'user_id', NEW.user_id,
        'place_id', NEW.place_id,
        'type', NEW.type,
        'message', NEW.message
      )
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_alert_created_send_push ON public.alerts;

CREATE TRIGGER on_alert_created_send_push
  AFTER INSERT ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_alert_push();

-- After deploying the edge function, run once in the SQL editor (replace placeholders):
--
-- INSERT INTO public.alert_push_config (function_url, auth_header)
-- VALUES (
--   'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-alert-push',
--   'Bearer YOUR_SERVICE_ROLE_KEY'
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET
--   function_url = EXCLUDED.function_url,
--   auth_header = EXCLUDED.auth_header,
--   enabled = true,
--   updated_at = NOW();
