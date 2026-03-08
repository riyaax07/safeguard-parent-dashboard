export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface Device {
  id: string;
  device_id: string;
  child_name: string;
  parent_id: string;
  pairing_code: string | null;
  pairing_expires_at: string | null;
  last_seen: string | null;
  registered_at: string;
}

export interface Visit {
  id: string;
  domain: string;
  full_url: string | null;
  timestamp: string;
  device_id: string;
  parent_id: string;
}

export interface BlockedSite {
  id: string;
  domain: string;
  parent_id: string;
  notes: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  domain: string;
  matched_keyword: string;
  reason: string;
  timestamp: string;
  device_id: string;
  parent_id: string;
  is_read: boolean;
}

export interface DashboardStats {
  visitsToday: number;
  uniqueDomainsToday: number;
  totalBlocked: number;
  unreadAlerts: number;
  topDomains: { domain: string; count: number }[];
}
