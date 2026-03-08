
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create devices table
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  child_name TEXT NOT NULL,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pairing_code TEXT,
  pairing_expires_at TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage own devices" ON public.devices
  FOR ALL USING (auth.uid() = parent_id);

-- Create visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  full_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX visits_parent_timestamp_idx ON public.visits (parent_id, timestamp DESC);
CREATE INDEX visits_domain_idx ON public.visits (domain);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own visits" ON public.visits
  FOR SELECT USING (auth.uid() = parent_id);

-- Create blocked_sites table
CREATE TABLE public.blocked_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain, parent_id)
);

CREATE INDEX blocked_sites_parent_idx ON public.blocked_sites (parent_id);

ALTER TABLE public.blocked_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage own blocklist" ON public.blocked_sites
  FOR ALL USING (auth.uid() = parent_id);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  matched_keyword TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Suspicious keyword detected',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  device_id TEXT NOT NULL,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX alerts_parent_idx ON public.alerts (parent_id, timestamp DESC);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents update own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = parent_id);

-- Enable Realtime on visits, blocked_sites, alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_sites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Create trigger function for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
