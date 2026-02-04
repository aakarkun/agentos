-- AgentOS: replay guard for signed Agent API requests.
-- key = address + timestamp + path + bodySha256; insert on verify; conflict → replay.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS agent_request_nonces (
  request_key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: periodic cleanup of old keys (e.g. older than 10 min) can be done via pg_cron or a job.
-- For lite, we leave rows; they are small (one per request within ±5 min window).
