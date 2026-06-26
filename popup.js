const SUPABASE_URL = "https://uqcufjiynyjwakgipszk.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxY3Vmaml5bnlqd2FrZ2lwc3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTM5MzIsImV4cCI6MjA5Nzc4OTkzMn0.wesm_O_9-10yUEOESG4aCfX72NCZMyJkc_Bo6lGeX74"


async function sbFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {})
    }
  })
}

document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.local.get(['paired', 'childName'])

  if (stored.paired) {
    document.getElementById('setup-view').style.display = 'none'
    document.getElementById('connected-view').style.display = 'block'
    document.getElementById('child-name-display').textContent = stored.childName || ''
    return
  }

  document.getElementById('pair-btn').addEventListener('click', async () => {
    const code = document.getElementById('code-input').value.trim()
    const name = document.getElementById('name-input').value.trim()
    const errEl = document.getElementById('error-msg')
    errEl.textContent = ''

    if (code.length !== 6) {
      errEl.textContent = 'Please enter the full 6-digit code.'
      return
    }
    if (!name) {
      errEl.textContent = "Please enter the child's name."
      return
    }

    // Look up pairing code in devices table
    const res = await sbFetch(
      `devices?pairing_code=eq.${code}&select=id,parent_id,pairing_expires_at`
    )
    const rows = await res.json()

    if (!rows.length) {
      errEl.textContent = 'Invalid code. Check the parent dashboard.'
      return
    }

    const device = rows[0]
    const expired = new Date(device.pairing_expires_at) < new Date()
    if (expired) {
      errEl.textContent = 'Code has expired. Generate a new one in the dashboard.'
      return
    }

    // Generate a stable device ID
    const deviceId = crypto.randomUUID()

    // Update the device row with this device_id and child name
    await sbFetch(`devices?id=eq.${device.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        device_id: deviceId,
        child_name: name,
        pairing_code: null,
        pairing_expires_at: null,
        last_seen: new Date().toISOString()
      })
    })

    // Save locally
    await chrome.storage.local.set({
      paired: true,
      deviceId,
      parentId: device.parent_id,
      childName: name
    })

    // Show connected state
    document.getElementById('setup-view').style.display = 'none'
    document.getElementById('connected-view').style.display = 'block'
    document.getElementById('child-name-display').textContent = name

    // Tell background to load blocklist now
    chrome.runtime.sendMessage({ type: 'INIT' })
  })
})