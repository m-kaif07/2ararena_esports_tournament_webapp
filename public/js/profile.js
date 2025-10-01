function fmtDate(dt) {
  const d = new Date(dt);
  return d.toLocaleString();
}

// Notification settings functionality with toggle
async function initializeNotificationSettings() {
  const statusEl = document.getElementById('notificationStatus');
  const toggle = document.getElementById('notificationToggle');
  const helpEl = document.getElementById('notificationHelp');

  // Check if notifications are supported
  if (!('Notification' in window)) {
    statusEl.textContent = 'Notifications are not supported in this browser.';
    helpEl.textContent = 'Please use a modern browser that supports notifications.';
    toggle.disabled = true;
    return;
  }

  // Check current permission status
  const permission = Notification.permission;

  if (permission === 'granted') {
    statusEl.textContent = 'Notifications are enabled. You will receive tournament updates.';
    toggle.checked = true;
    helpEl.textContent = 'Toggle off to disable notifications.';
  } else if (permission === 'denied') {
    statusEl.textContent = 'Notifications are blocked. You will not receive updates.';
    toggle.checked = false;
    toggle.disabled = true;
    helpEl.textContent = 'To enable notifications: Go to browser settings → Notifications → Allow this site.';
  } else {
    statusEl.textContent = 'Notifications are not enabled. Enable them to receive tournament updates.';
    toggle.checked = false;
    helpEl.textContent = 'Toggle on to enable notifications.';
  }

  // Toggle change handler
  toggle.addEventListener('change', async () => {
    if (toggle.checked) {
      // Enable
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Get FCM token and save it
          if (typeof firebase !== 'undefined' && firebase.messaging) {
            const messaging = firebase.messaging();
            const token = await messaging.getToken({
              vapidKey: "BLjD_rqopmKcujWud5s2M2cJrL6HUS156HJkbAGkflQV0wAHIIoAIf4dbbv2vpyDOQutvfMFf3-ATQBi3T9CbX8"
            });

            if (token) {
              await fetch("/save-token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${API.token}`
                },
                body: JSON.stringify({ token }),
              });
            }
          }

          statusEl.textContent = 'Notifications enabled successfully!';
          helpEl.textContent = 'You will now receive tournament updates.';
          toggle.disabled = false;

          setTimeout(() => {
            initializeNotificationSettings(); // Refresh status
          }, 1000);
        } else {
          statusEl.textContent = 'Permission denied. Notifications not enabled.';
          helpEl.textContent = 'To enable notifications: Go to browser settings → Notifications → Allow this site.';
          toggle.checked = false;
        }
      } catch (err) {
        console.error('Error enabling notifications:', err);
        statusEl.textContent = 'Failed to enable notifications. Please try again.';
        toggle.checked = false;
      }
    } else {
      // Disable
      if (confirm('Are you sure you want to disable notifications? You will stop receiving tournament updates.')) {
        try {
          // Remove FCM token from server
          await fetch("/save-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${API.token}`
            },
            body: JSON.stringify({ token: null }),
          });

          statusEl.textContent = 'Notifications disabled.';
          helpEl.textContent = 'Toggle on to enable notifications again.';
        } catch (err) {
          console.error('Error disabling notifications:', err);
          statusEl.textContent = 'Failed to disable notifications. Please try again.';
          toggle.checked = true;
        }
      } else {
        toggle.checked = true;
      }
    }
  });
}

async function loadMyProfile() {
  const profileUsername = document.getElementById('profileUsername');
  const profileEmail = document.getElementById('profileEmail');
  const profileAvatar = document.getElementById('profileAvatar');

  // Load user info
  try {
    const user = await API.request('/api/auth/me');
    if (user && user.username) profileUsername.textContent = user.username;
    if (user && user.email) profileEmail.textContent = user.email;
    profileAvatar.textContent = (user.username || 'U').slice(0,1).toUpperCase();
  } catch (err) {
    msg.textContent = 'Failed to load profile: ' + err.message;
  }
  if (!API.token) {
    window.location.href = '/login.html';
    return;
  }
  const wrap = document.getElementById('myTours');
  const earnWrap = document.getElementById('myEarnings');
  const msg = document.getElementById('profileMsg');

  // Load registrations
  try {
    const regs = await API.request('/api/tournaments/me/registrations/list');
    if (!regs.length) {
      wrap.innerHTML = '<p class="muted">No tournaments registered yet.</p>';
    } else {
      wrap.innerHTML = '';
      regs.forEach(t => {
        const banner = t.bannerPath ? t.bannerPath : '/img/placeholder-banner.jpg';
        const now = new Date();
        const tourDate = new Date(t.dateTime);
        let status = 'upcoming';
        let statusText = 'Upcoming';
        if (tourDate < now) {
          status = 'completed';
          statusText = 'Completed';
        } else if (Math.abs(tourDate - now) < 24 * 60 * 60 * 1000) { // within 24 hours
          status = 'ongoing';
          statusText = 'Ongoing';
        }
        const item = document.createElement('div');
        item.className = 'tournament-item';
        item.innerHTML = `
          <img class="tournament-thumbnail" src="${banner}" alt="${t.title}"/>
          <div class="tournament-info">
            <h3>${t.title}</h3>
            <div class="tournament-meta">
              <span class="tournament-status status-${status}">${statusText}</span>
              <span>${t.mode}</span>
              <span>${t.map}</span>
            </div>
            <p class="tournament-date">${fmtDate(t.dateTime)}</p>
          </div>
        `;
        item.addEventListener('click', async () => {
          try {
            const details = await API.request(`/api/tournaments/${t.id}`);
            let info = `<strong>${details.title}</strong><br/>`;
            info += `Date: ${fmtDate(details.dateTime)}<br/>Map: ${details.map}<br/>Mode: ${details.mode}<br/>`;
            if (details.roomId || details.roomPassword) {
              info += `<br/><b>Room ID:</b> ${details.roomId || 'N/A'}<br/><b>Password:</b> ${details.roomPassword || 'N/A'}`;
            } else {
              info += `<br/><i>Room ID and Password not set yet.</i>`;
            }
            showModal('Tournament Details', info);
          } catch (err) {
            showModal('Tournament Details', 'Failed to load details: ' + err.message);
          }
        });
        wrap.appendChild(item);
      });
    }
  } catch (err) {
    wrap.innerHTML = '<p>Error loading tournaments.</p>';
  }

  // Load earnings
  try {
    const earnings = await API.request('/api/auth/me/earnings');
    if (!earnings.length) {
      earnWrap.textContent = 'No earnings yet';
    } else {
      const total = earnings.reduce((sum, e) => sum + e.amount, 0);
      earnWrap.textContent = `₹${total}`;
    }
  } catch (err) {
    earnWrap.textContent = 'Error loading earnings';
  }
}

// Simple modal utility for details
function showModal(title, content) {
  let modal = document.getElementById('profile-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.innerHTML = `<div style="background:var(--card);color:var(--text);padding:24px 32px;border-radius:16px;max-width:90vw;min-width:300px;box-shadow:0 10px 40px var(--shadow);position:relative;border:1px solid #1a2342;">
      <button id="close-profile-modal" style="position:absolute;top:8px;right:12px;font-size:1.5em;background:none;border:none;color:var(--muted);cursor:pointer;">&times;</button>
      <h2 style="margin-top:0;color:var(--accent);">${title}</h2>
      <div>${content}</div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#close-profile-modal').onclick = () => modal.remove();
  } else {
    modal.querySelector('h2').textContent = title;
    modal.querySelector('div > div').innerHTML = content;
    modal.style.display = 'flex';
    modal.querySelector('#close-profile-modal').onclick = () => modal.remove();
  }
}

document.addEventListener('DOMContentLoaded', loadMyProfile);
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('logoutBtnProfile');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      API.token = '';
      window.location.href = '/';
    });
  }
});

// Initialize notification settings after profile loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initializeNotificationSettings();
  }, 500);
});
