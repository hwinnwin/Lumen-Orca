-- Add 'queued' and 'cancelled' statuses to builds and build_steps
-- Add queue position tracking column
-- Add RLS policy for users to cancel own builds

-- Drop and recreate CHECK constraints to add new statuses
ALTER TABLE public.builds DROP CONSTRAINT IF EXISTS builds_status_check;
ALTER TABLE public.builds ADD CONSTRAINT builds_status_check
  CHECK (status IN ('queued', 'pending', 'specifying', 'generating', 'deploying', 'live', 'failed', 'cancelled'));

ALTER TABLE public.build_steps DROP CONSTRAINT IF EXISTS build_steps_status_check;
ALTER TABLE public.build_steps ADD CONSTRAINT build_steps_status_check
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));

-- Queue position tracking
ALTER TABLE public.builds ADD COLUMN IF NOT EXISTS position_in_queue integer;

-- Index for fast queue lookups
CREATE INDEX IF NOT EXISTS idx_builds_queued ON public.builds(user_id, created_at)
  WHERE status = 'queued';

-- Users need UPDATE to cancel their own builds
CREATE POLICY "Users can cancel own builds"
  ON public.builds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
