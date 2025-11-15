CREATE EXTENSION IF NOT EXISTS "pg_cron";

SELECT
  cron.schedule (
    '0 * * * *', -- every hour
    'SELECT cleanup_expired_sessions_tokens();'
  );

SELECT
  cron.schedule (
    'daily_cleanup_revoked_tokens', -- task name
    '0 3 * * *', -- schedule: every day at 3:00
    'SELECT cleanup_revoked_tokens_older_than(30);' -- remove tokens revoked more than 30 days ago
  );
