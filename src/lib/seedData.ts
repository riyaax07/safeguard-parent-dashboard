import { supabase } from "@/integrations/supabase/client";
import { subDays, subHours, subMinutes } from "date-fns";

const DOMAINS = [
  "youtube.com", "roblox.com", "google.com", "minecraft.net", "netflix.com",
  "wikipedia.org", "coolmathgames.com", "khanacademy.org", "disney.com", "scratch.mit.edu",
  "twitch.tv", "spotify.com", "amazon.com", "steam.com", "github.com",
];

const BLOCKED = [
  { domain: "tiktok.com", notes: "Inappropriate content" },
  { domain: "reddit.com", notes: "Unmoderated content" },
  { domain: "4chan.org", notes: "Not appropriate for children" },
  { domain: "twitter.com", notes: "Social media restriction" },
  { domain: "discord.com", notes: "Unmonitored chat" },
  { domain: "omegle.com", notes: "Stranger chat - dangerous" },
  { domain: "onlyfans.com", notes: "Adult content" },
  { domain: "chaturbate.com", notes: "Adult content" },
];

const ALERTS = [
  { domain: "casinoworld.com", matched_keyword: "casino", reason: "Suspicious keyword detected" },
  { domain: "bet365.com", matched_keyword: "betting", reason: "Suspicious keyword detected" },
  { domain: "adultsite.com", matched_keyword: "adult", reason: "Suspicious keyword detected" },
  { domain: "freeslots.net", matched_keyword: "slots", reason: "Suspicious keyword detected" },
  { domain: "onlinegambling.io", matched_keyword: "gambling", reason: "Suspicious keyword detected" },
];

const DEVICES = [
  { device_id: "device-emma-laptop", child_name: "Emma's Laptop" },
  { device_id: "device-jake-ipad", child_name: "Jake's iPad" },
  { device_id: "device-livingroom-pc", child_name: "Living Room PC" },
];

export async function seedDemoData(userId: string) {
  // Insert devices
  for (const d of DEVICES) {
    await supabase.from("devices").upsert({
      device_id: d.device_id,
      child_name: d.child_name,
      parent_id: userId,
      last_seen: subMinutes(new Date(), Math.floor(Math.random() * 60)).toISOString(),
    }, { onConflict: "device_id" });
  }

  // Insert visits
  const visits = [];
  for (let i = 0; i < 50; i++) {
    const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
    visits.push({
      domain,
      full_url: `https://${domain}/page${Math.floor(Math.random() * 100)}`,
      timestamp: subHours(new Date(), Math.floor(Math.random() * 168)).toISOString(),
      device_id: device.device_id,
      parent_id: userId,
    });
  }
  await supabase.from("visits").insert(visits);

  // Insert blocked sites
  for (const b of BLOCKED) {
    await supabase.from("blocked_sites").upsert({
      domain: b.domain,
      parent_id: userId,
      notes: b.notes,
    }, { onConflict: "domain,parent_id" });
  }

  // Insert alerts
  const alertData = ALERTS.map((a, i) => ({
    domain: a.domain,
    matched_keyword: a.matched_keyword,
    reason: a.reason,
    device_id: DEVICES[i % DEVICES.length].device_id,
    parent_id: userId,
    is_read: i > 2,
    timestamp: subHours(new Date(), Math.floor(Math.random() * 48)).toISOString(),
  }));
  await supabase.from("alerts").insert(alertData);
}
