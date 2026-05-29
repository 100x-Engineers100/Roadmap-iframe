-- email_jobs: tracks Resend send jobs for each lead's email sequence
-- sequence_step: 0=immediate, 1=day3, 2=day6
-- status flow: pending → sending → sent | failed → bounced | delivered | cancelled

CREATE TABLE IF NOT EXISTS email_jobs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  email               text        NOT NULL,
  sequence_step       int         NOT NULL,
  scheduled_at        timestamptz NOT NULL,
  status              text        NOT NULL DEFAULT 'pending',
  attempts            int         NOT NULL DEFAULT 0,
  resend_message_id   text,
  sent_at             timestamptz,
  last_error          text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, sequence_step)
);

CREATE INDEX IF NOT EXISTS email_jobs_due_idx
  ON email_jobs(scheduled_at, status, attempts)
  WHERE status IN ('pending', 'failed');

-- Atomic job claim using FOR UPDATE SKIP LOCKED — prevents duplicate sends under concurrent cron invocations
CREATE OR REPLACE FUNCTION claim_email_jobs()
RETURNS SETOF email_jobs
LANGUAGE sql AS $$
  UPDATE email_jobs
  SET status = 'sending', attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM email_jobs
    WHERE status IN ('pending', 'failed')
      AND attempts < 2
      AND scheduled_at <= now()
    ORDER BY scheduled_at
    LIMIT 10
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;
