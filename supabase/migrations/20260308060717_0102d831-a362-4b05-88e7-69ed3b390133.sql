
-- Add notification preferences to profiles
ALTER TABLE public.profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"realtime_alerts": true, "email_daily_summary": false, "alert_sound": true}'::jsonb;
