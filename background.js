var SUPABASE_URL = "https://uqcufjiynyjwakgipszk.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxY3Vmaml5bnlqd2FrZ2lwc3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTM5MzIsImV4cCI6MjA5Nzc4OTkzMn0.wesm_O_9-10yUEOESG4aCfX72NCZMyJkc_Bo6lGeX74";

var blocklist = new Set();

function sbFetch(path, options) {
  options = options || {};
  return fetch(SUPABASE_URL + "/rest/v1/" + path, {
    method: options.method || "GET",
    body: options.body || undefined,
    headers: Object.assign({
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    }, options.headers || {})
  });
}

function loadBlocklist() {
  return chrome.storage.local.get(["paired", "parentId"]).then(function(stored) {
    if (!stored.paired || !stored.parentId) {
      console.log("Not paired yet");
      return;
    }
    console.log("Loading blocklist...");
    return sbFetch("blocked_sites?parent_id=eq." + stored.parentId + "&select=domain")
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var domains = data.map(function(r) { return r.domain; });
        blocklist = new Set(domains);
        console.log("Blocklist loaded:", domains);
        return chrome.storage.local.set({ blocklist: domains });
      });
  }).catch(function(e) {
    console.log("Blocklist load error:", e.message);
    return chrome.storage.local.get("blocklist").then(function(s) {
      blocklist = new Set(s.blocklist || []);
    });
  });
}

function isBlocked(domain) {
  if (blocklist.has(domain)) return true;
  var parts = domain.split(".");
  for (var i = 1; i < parts.length; i++) {
    if (blocklist.has(parts.slice(i).join("."))) return true;
  }
  return false;
}

function logVisit(domain, fullUrl) {
  chrome.storage.local.get(["paired", "parentId", "deviceId"]).then(function(stored) {
    if (!stored.paired) return;
    sbFetch("visits", {
      method: "POST",
      body: JSON.stringify({
        domain: domain,
        full_url: fullUrl,
        device_id: stored.deviceId,
        parent_id: stored.parentId,
        timestamp: new Date().toISOString()
      })
    }).catch(function() {});
  });
}

function init() {
  console.log("SafeGuard starting...");
  loadBlocklist().then(function() {
    console.log("SafeGuard ready. Blocked domains:", blocklist.size);
  });
}

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  if (details.frameId !== 0) return;
  if (!details.url || !details.url.startsWith("http")) return;

  var url = new URL(details.url);
  var domain = url.hostname.replace(/^www\./, "");

  console.log("Navigation:", domain, "| Blocked:", isBlocked(domain));

  if (isBlocked(domain)) {
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL("blocked.html?domain=" + encodeURIComponent(domain))
    });
    return;
  }

  logVisit(domain, details.url);
});

chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.type === "INIT") init();
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === "keepAlive") loadBlocklist();
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.alarms.create("keepAlive", { periodInMinutes: 0.5 });
  init();
});

chrome.runtime.onStartup.addListener(function() {
  chrome.alarms.create("keepAlive", { periodInMinutes: 0.5 });
  init();
});