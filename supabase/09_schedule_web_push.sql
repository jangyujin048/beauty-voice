-- Run AFTER deploying send-push and creating these two Vault secrets through Dashboard:
-- bv_push_function_url = https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push
-- bv_push_worker_secret = same value as Edge Function PUSH_WORKER_SECRET
-- Never paste secret values into this committed file.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if not exists(select 1 from vault.decrypted_secrets where name='bv_push_function_url')
 or not exists(select 1 from vault.decrypted_secrets where name='bv_push_worker_secret') then
  raise exception 'Create both Vault secrets before enabling the schedule';
 end if;
end $$;
select cron.schedule('beauty-voice-web-push','* * * * *', $cron$
 select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='bv_push_function_url'),
  headers := jsonb_build_object('Content-Type','application/json','x-push-secret',
   (select decrypted_secret from vault.decrypted_secrets where name='bv_push_worker_secret')),
  body := '{}'::jsonb, timeout_milliseconds := 60000
 );
$cron$);
-- Pause if needed: select cron.unschedule('beauty-voice-web-push');
