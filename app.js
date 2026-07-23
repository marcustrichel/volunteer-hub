// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ['purple', 'teal', 'coral', 'blue', 'amber', 'pink'];

// Used only to reseed the swag table on "Reset all data".
const DEFAULT_SWAG = [
  { name: 'Enamel pin',       emoji: '📌', description: 'Exclusive org logo pin',       hrs: 10  },
  { name: 'Tote bag',          emoji: '👜', description: 'Heavy-duty canvas tote',        hrs: 25  },
  { name: 'Hoodie',            emoji: '🧥', description: 'Embroidered crew hoodie',       hrs: 50  },
  { name: 'Insulated tumbler', emoji: '☕', description: 'Custom 20oz tumbler',           hrs: 75  },
  { name: 'Jacket',            emoji: '🧤', description: 'Premium fleece zip-up',         hrs: 100 },
  { name: 'Experience day',    emoji: '🌟', description: 'VIP behind-the-scenes invite',  hrs: 150 },
];

// ─── Supabase client ─────────────────────────────────────────────────────────

const configOk = !!(window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && !window.SUPABASE_CONFIG.url.includes('YOUR_PROJECT'));
const supabaseClient = (configOk && window.supabase)
  ? window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey)
  : null;

// ─── State ───────────────────────────────────────────────────────────────────

let state = { volunteers: [], logs: [], swag: [], groupName: 'My Volunteers' };
let dataLoaded = false;

// ─── Auth ────────────────────────────────────────────────────────────────────

function showAuthScreen() {
  document.getElementById('boot-loading')?.classList.add('hidden');
  document.getElementById('app-root').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
}

function showApp(session) {
  document.getElementById('boot-loading')?.classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-root').classList.remove('hidden');
  const emailEl = document.getElementById('account-email');
  if (emailEl) emailEl.textContent = 'Signed in as ' + (session.user.email || '');
}

async function signIn() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-error');
  errEl.textContent = '';
  if (!email || !password) { errEl.textContent = 'Enter your email and password.'; return; }
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) errEl.textContent = error.message;
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

function initAuth() {
  if (!supabaseClient) {
    document.getElementById('boot-loading')?.classList.add('hidden');
    document.getElementById('auth-error').textContent = !window.supabase
      ? "Couldn't load the Supabase library — check your internet connection and reload."
      : "Supabase isn't configured for this deployment — check the SUPABASE_URL/SUPABASE_ANON_KEY secrets on the production environment.";
    document.getElementById('auth-screen').classList.remove('hidden');
    return;
  }
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      if (!dataLoaded) { dataLoaded = true; await loadState(); }
      showApp(session);
    } else {
      dataLoaded = false;
      state = { volunteers: [], logs: [], swag: [], groupName: 'My Volunteers' };
      showAuthScreen();
    }
  });
}

// ─── Data loading ────────────────────────────────────────────────────────────

async function loadState() {
  try {
    const [volRes, logRes, swagRes, settingsRes] = await Promise.all([
      supabaseClient.from('volunteers').select('*').order('created_at'),
      supabaseClient.from('logs').select('*'),
      supabaseClient.from('swag').select('*'),
      supabaseClient.from('app_settings').select('*').eq('id', 1).single(),
    ]);
    const failed = [volRes, logRes, swagRes, settingsRes].find(r => r.error);
    if (failed) throw failed.error;
    state = {
      volunteers: volRes.data || [],
      logs: logRes.data || [],
      swag: swagRes.data || [],
      groupName: settingsRes.data?.group_name || 'My Volunteers',
    };
  } catch (e) {
    toast('Failed to load data — reload the page to try again.');
    console.error(e);
    return;
  }
  render();
}

async function refetchVolunteers() {
  const { data, error } = await supabaseClient.from('volunteers').select('*').order('created_at');
  if (error) { toast('Failed to load volunteers: ' + error.message); return; }
  state.volunteers = data || [];
}

async function refetchLogs() {
  const { data, error } = await supabaseClient.from('logs').select('*');
  if (error) { toast('Failed to load logs: ' + error.message); return; }
  state.logs = data || [];
}

async function refetchSwag() {
  const { data, error } = await supabaseClient.from('swag').select('*');
  if (error) { toast('Failed to load swag: ' + error.message); return; }
  state.swag = data || [];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function totalHrs(vid) {
  return state.logs.filter(l => l.vid === vid).reduce((s, l) => s + (+l.hrs), 0);
}

function avatarColor(i) {
  return COLORS[i % COLORS.length];
}

function initials(name) {
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function showModal(html) {
  document.getElementById('modals').innerHTML =
    `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">${html}</div></div>`;
}

function closeModal() {
  document.getElementById('modals').innerHTML = '';
}

// ─── Navigation ──────────────────────────────────────────────────────────────

function goto(p) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(x => x.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  const idx = { dashboard: 0, volunteers: 1, log: 2, swag: 3, settings: 4 }[p];
  document.querySelectorAll('nav button')[idx].classList.add('active');
  if (p === 'log') populateLogDropdown();
  if (p === 'dashboard') renderDashboard();
  if (p === 'volunteers') renderVols();
  if (p === 'swag') renderSwag();
  if (p === 'settings') {
    const gi = document.getElementById('group-name-input');
    if (gi) gi.value = state.groupName || '';
  }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function renderDashboard() {
  const totalVols = state.volunteers.length;
  const totalHours = state.logs.reduce((s, l) => s + (+l.hrs), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthHrs = state.logs.filter(l => l.date && l.date.startsWith(thisMonth)).reduce((s, l) => s + (+l.hrs), 0);
  const avgHrs = totalVols ? Math.round(totalHours / totalVols) : 0;

  document.getElementById('metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Volunteers</div><div class="metric-val">${totalVols}</div></div>
    <div class="metric"><div class="metric-label">Total hours</div><div class="metric-val">${totalHours.toFixed(1)}</div></div>
    <div class="metric"><div class="metric-label">This month</div><div class="metric-val">${monthHrs.toFixed(1)}</div></div>
    <div class="metric"><div class="metric-label">Avg hrs/volunteer</div><div class="metric-val">${avgHrs}</div></div>`;

  const sorted = [...state.volunteers].sort((a, b) => totalHrs(b.id) - totalHrs(a.id)).slice(0, 5);
  const maxH = sorted[0] ? totalHrs(sorted[0].id) : 1;
  document.getElementById('top-vols').innerHTML = sorted.length
    ? sorted.map((v, i) => {
        const h = totalHrs(v.id);
        return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0">
          <span style="font-size:12px;color:var(--color-text-secondary);min-width:14px">${i + 1}</span>
          <div class="avatar av-${avatarColor(state.volunteers.indexOf(v))}" style="width:28px;height:28px;font-size:11px">${initials(v.name)}</div>
          <span style="font-size:13px;flex:1">${escapeHtml(v.name)}</span>
          <div class="progress-wrap" style="max-width:80px"><div class="progress-bar" style="width:${Math.round(h / maxH * 100)}%"></div></div>
          <span style="font-size:12px;color:var(--color-text-secondary);min-width:36px;text-align:right">${h.toFixed(1)}h</span>
        </div>`;
      }).join('')
    : '<div class="empty" style="padding:1rem">No volunteers yet</div>';

  const upcoming = getUpcomingDates();
  document.getElementById('upcoming-dates').innerHTML = upcoming.length
    ? upcoming.slice(0, 5).map(u => `
      <div class="log-entry">
        <div><div style="font-size:13px;font-weight:500">${escapeHtml(u.vol)}</div><div style="font-size:12px;color:var(--color-text-secondary)">${escapeHtml(u.label)}</div></div>
        <span class="upcoming-badge">${u.when}</span>
      </div>`).join('')
    : '<div class="empty" style="padding:1rem">No upcoming dates</div>';

  const recent = [...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  document.getElementById('recent-activity').innerHTML = recent.length
    ? recent.map(l => {
        const v = state.volunteers.find(x => x.id === l.vid);
        return `<div class="log-entry">
          <span style="font-size:13px">${escapeHtml(v ? v.name : 'Unknown')}</span>
          <span style="font-size:13px;color:var(--color-text-secondary);flex:1;padding:0 8px">${escapeHtml(l.note || 'Volunteer hours')}</span>
          <span style="font-size:13px;font-weight:500;color:#1D9E75">+${l.hrs}h</span>
          <span style="font-size:12px;color:var(--color-text-secondary)">${l.date || ''}</span>
        </div>`;
      }).join('')
    : '<div class="empty">No activity logged yet</div>';
}

function getUpcomingDates() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const results = [];
  state.volunteers.forEach(v => {
    const fields = [
      { key: 'birthday',      label: 'Birthday'                               },
      { key: 'anniversary',   label: 'Anniversary'                            },
      { key: 'custom_date_1', label: v.custom_date_1_label || 'Special date'  },
    ];
    fields.forEach(f => {
      if (!v[f.key]) return;
      const d = new Date(v[f.key]);
      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      const diff = Math.round((next - today) / (1000 * 60 * 60 * 24));
      if (diff <= 30) results.push({ vol: v.name, label: f.label, date: next, diff, when: diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff}d` });
    });
  });
  return results.sort((a, b) => a.diff - b.diff);
}

// ─── Volunteers ───────────────────────────────────────────────────────────────

function renderVols() {
  const q = (document.getElementById('vol-search') || {}).value || '';
  const filtered = state.volunteers.filter(v => v.name.toLowerCase().includes(q.toLowerCase()));
  document.getElementById('vol-list').innerHTML = filtered.length
    ? filtered.map((v, i) => {
        const h = totalHrs(v.id);
        const nextSwag = state.swag.filter(s => s.hrs > h).sort((a, b) => a.hrs - b.hrs)[0];
        const earnedCount = state.swag.filter(s => s.hrs <= h).length;
        return `<div class="vol-card" onclick="openVolDetail('${v.id}')">
          <div class="row" style="margin-bottom:8px">
            <div class="avatar av-${avatarColor(i)}">${escapeHtml(initials(v.name))}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:500;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(v.name)}</div>
              <div style="font-size:12px;color:var(--color-text-secondary)">${escapeHtml(v.role || 'Volunteer')}</div>
            </div>
          </div>
          <div class="row" style="gap:6px;margin-bottom:6px">
            <span style="font-size:13px;font-weight:500;color:#1D9E75">${h.toFixed(1)} hrs</span>
            ${earnedCount ? `<span class="badge badge-purple">${earnedCount} 🏅 earned</span>` : ''}
          </div>
          ${nextSwag
            ? `<div class="row" style="gap:6px"><div class="progress-wrap"><div class="progress-bar" style="width:${Math.min(100, Math.round(h / nextSwag.hrs * 100))}%"></div></div><span style="font-size:11px;color:var(--color-text-secondary)">${escapeHtml(nextSwag.emoji)} ${nextSwag.hrs - h > 0 ? (nextSwag.hrs - h).toFixed(1) + 'h left' : ''}</span></div>`
            : '<span class="badge badge-teal">All swag unlocked! 🎉</span>'}
        </div>`;
      }).join('')
    : '<div class="empty" style="grid-column:1/-1">No volunteers found.</div>';
}

function openAddVol() {
  showModal(`<h3 style="margin-bottom:1rem">Add volunteer</h3>
    <div class="form-row"><div><label>Full name *</label><input id="m-name" placeholder="Jane Smith"></div><div><label>Role / team</label><input id="m-role" placeholder="Food bank"></div></div>
    <div class="form-row"><div><label>Email</label><input id="m-email" type="email" placeholder="jane@email.com"></div><div><label>Phone</label><input id="m-phone" placeholder="555-0100"></div></div>
    <div class="form-row"><div><label>Birthday</label><input id="m-bday" type="date"></div><div><label>Join anniversary</label><input id="m-ann" type="date"></div></div>
    <hr class="divider">
    <p style="font-size:12px;color:var(--color-text-secondary);margin-bottom:.5rem">Favorite things (helps personalize recognition!)</p>
    <div class="form-row"><div><label>Favorite food</label><input id="m-food" placeholder="e.g. tacos"></div><div><label>Favorite color</label><input id="m-color" placeholder="e.g. green"></div></div>
    <div class="form-row single"><label>Favorite activity / hobby</label><input id="m-hobby" placeholder="e.g. hiking"></div>
    <hr class="divider">
    <div class="form-row"><div><label>Custom date label</label><input id="m-cdl" placeholder="e.g. Work anniversary"></div><div><label>Custom date</label><input id="m-cd" type="date"></div></div>
    <div class="form-row single"><label>Notes</label><textarea id="m-notes" rows="2" placeholder="Anything else to remember…"></textarea></div>
    <div style="display:flex;gap:8px;margin-top:.75rem">
      <button class="btn btn-primary" onclick="saveVol()">Add volunteer</button>
      <button class="btn" onclick="closeModal()">Cancel</button>
    </div>`);
}

async function saveVol(editId) {
  const name = document.getElementById('m-name').value.trim();
  if (!name) { toast('Name is required.'); return; }
  const payload = {
    name,
    role:                 document.getElementById('m-role').value,
    email:                document.getElementById('m-email').value,
    phone:                document.getElementById('m-phone').value,
    birthday:             document.getElementById('m-bday').value || null,
    anniversary:          document.getElementById('m-ann').value || null,
    food:                 document.getElementById('m-food').value,
    color:                document.getElementById('m-color').value,
    hobby:                document.getElementById('m-hobby').value,
    notes:                document.getElementById('m-notes').value,
    custom_date_1_label:  document.getElementById('m-cdl').value,
    custom_date_1:        document.getElementById('m-cd').value || null,
  };
  const { error } = editId
    ? await supabaseClient.from('volunteers').update(payload).eq('id', editId)
    : await supabaseClient.from('volunteers').insert(payload);
  if (error) { toast('Save failed: ' + error.message); return; }
  await refetchVolunteers();
  closeModal();
  renderVols();
  toast(editId ? 'Volunteer updated!' : 'Volunteer added! 🎉');
}

function openVolDetail(id) {
  const v = state.volunteers.find(x => x.id === id);
  if (!v) return;
  const h = totalHrs(v.id);
  const earned = state.swag.filter(s => s.hrs <= h).sort((a, b) => a.hrs - b.hrs);
  const logs = [...state.logs.filter(l => l.vid === id)].sort((a, b) => new Date(b.date) - new Date(a.date));
  showModal(`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
      <div class="avatar av-${avatarColor(state.volunteers.findIndex(x => x.id === id))}" style="width:44px;height:44px;font-size:15px">${escapeHtml(initials(v.name))}</div>
      <div><div style="font-size:17px;font-weight:500">${escapeHtml(v.name)}</div><div style="font-size:13px;color:var(--color-text-secondary)">${escapeHtml(v.role || 'Volunteer')}</div></div>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn-sm" onclick="openEditVol('${id}')"><i class="ti ti-edit" aria-hidden="true"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteVol('${id}')"><i class="ti ti-trash" aria-hidden="true"></i></button>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:1rem">
      <div class="metric" style="flex:1;text-align:center"><div class="metric-label">Total hours</div><div class="metric-val" style="color:#1D9E75">${h.toFixed(1)}</div></div>
      <div class="metric" style="flex:1;text-align:center"><div class="metric-label">Swag earned</div><div class="metric-val">${earned.length}</div></div>
      <div class="metric" style="flex:1;text-align:center"><div class="metric-label">Sessions</div><div class="metric-val">${logs.length}</div></div>
    </div>
    <div class="detail-section">
      ${v.email    ? `<div class="kv"><span class="kv-label"><i class="ti ti-mail" aria-hidden="true"></i> Email</span><span>${escapeHtml(v.email)}</span></div>` : ''}
      ${v.phone    ? `<div class="kv"><span class="kv-label"><i class="ti ti-phone" aria-hidden="true"></i> Phone</span><span>${escapeHtml(v.phone)}</span></div>` : ''}
      ${v.birthday ? `<div class="kv"><span class="kv-label">🎂 Birthday</span><span>${escapeHtml(v.birthday)}</span></div>` : ''}
      ${v.anniversary ? `<div class="kv"><span class="kv-label">🗓 Anniversary</span><span>${escapeHtml(v.anniversary)}</span></div>` : ''}
      ${v.custom_date_1 ? `<div class="kv"><span class="kv-label">📌 ${escapeHtml(v.custom_date_1_label || 'Special date')}</span><span>${escapeHtml(v.custom_date_1)}</span></div>` : ''}
    </div>
    ${(v.food || v.color || v.hobby) ? `
    <div class="detail-section" style="background:var(--color-bg-secondary);padding:.75rem;border-radius:var(--radius-md)">
      <div style="font-size:12px;font-weight:500;margin-bottom:6px;color:var(--color-text-secondary)">Favorites</div>
      ${v.food  ? `<div class="kv"><span class="kv-label">🍴 Food</span><span>${escapeHtml(v.food)}</span></div>` : ''}
      ${v.color ? `<div class="kv"><span class="kv-label">🎨 Color</span><span>${escapeHtml(v.color)}</span></div>` : ''}
      ${v.hobby ? `<div class="kv"><span class="kv-label">⭐ Hobby</span><span>${escapeHtml(v.hobby)}</span></div>` : ''}
    </div>` : ''}
    ${v.notes ? `<div class="kv" style="margin-top:8px"><span class="kv-label">📝 Notes</span><span style="font-size:13px">${escapeHtml(v.notes)}</span></div>` : ''}
    ${earned.length ? `
    <div style="margin-top:1rem">
      <div style="font-size:12px;font-weight:500;color:var(--color-text-secondary);margin-bottom:6px">Swag earned</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${earned.map(s => `<span class="badge badge-teal">${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</span>`).join('')}</div>
    </div>` : ''}
    <hr class="divider">
    <h3 style="margin-bottom:.5rem">Hour log</h3>
    <div style="max-height:180px;overflow-y:auto">
      ${logs.length
        ? logs.map(l => `<div class="log-entry"><span style="font-size:13px">${escapeHtml(l.note || 'Hours')}</span><span style="font-size:12px;color:var(--color-text-secondary)">${escapeHtml(l.date)}</span><span style="font-size:13px;font-weight:500;color:#1D9E75">+${l.hrs}h</span></div>`).join('')
        : '<div class="empty" style="padding:.75rem">No hours logged</div>'}
    </div>
    <button class="btn" style="margin-top:.75rem;width:100%" onclick="closeModal()">Close</button>`);
}

function openEditVol(id) {
  const v = state.volunteers.find(x => x.id === id);
  closeModal();
  showModal(`<h3 style="margin-bottom:1rem">Edit volunteer</h3>
    <div class="form-row"><div><label>Full name *</label><input id="m-name" value="${escapeHtml(v.name)}"></div><div><label>Role / team</label><input id="m-role" value="${escapeHtml(v.role)}"></div></div>
    <div class="form-row"><div><label>Email</label><input id="m-email" type="email" value="${escapeHtml(v.email)}"></div><div><label>Phone</label><input id="m-phone" value="${escapeHtml(v.phone)}"></div></div>
    <div class="form-row"><div><label>Birthday</label><input id="m-bday" type="date" value="${escapeHtml(v.birthday)}"></div><div><label>Anniversary</label><input id="m-ann" type="date" value="${escapeHtml(v.anniversary)}"></div></div>
    <hr class="divider">
    <div class="form-row"><div><label>Favorite food</label><input id="m-food" value="${escapeHtml(v.food)}"></div><div><label>Favorite color</label><input id="m-color" value="${escapeHtml(v.color)}"></div></div>
    <div class="form-row single"><label>Favorite hobby</label><input id="m-hobby" value="${escapeHtml(v.hobby)}"></div>
    <hr class="divider">
    <div class="form-row"><div><label>Custom date label</label><input id="m-cdl" value="${escapeHtml(v.custom_date_1_label)}"></div><div><label>Custom date</label><input id="m-cd" type="date" value="${escapeHtml(v.custom_date_1)}"></div></div>
    <div class="form-row single"><label>Notes</label><textarea id="m-notes" rows="2">${escapeHtml(v.notes)}</textarea></div>
    <div style="display:flex;gap:8px;margin-top:.75rem">
      <button class="btn btn-primary" onclick="saveVol('${id}')">Save</button>
      <button class="btn" onclick="closeModal()">Cancel</button>
    </div>`);
}

async function deleteVol(id) {
  if (!confirm('Remove this volunteer and all their logs?')) return;
  const { error } = await supabaseClient.from('volunteers').delete().eq('id', id);
  if (error) { toast('Delete failed: ' + error.message); return; }
  await Promise.all([refetchVolunteers(), refetchLogs()]);
  closeModal();
  renderVols();
  toast('Volunteer removed.');
}

// ─── Hour Logging ─────────────────────────────────────────────────────────────

function populateLogDropdown() {
  const s = document.getElementById('log-vol');
  s.innerHTML = state.volunteers.map(v => `<option value="${v.id}">${escapeHtml(v.name)}</option>`).join('');
  document.getElementById('log-date').value = new Date().toISOString().slice(0, 10);
  renderLogList();
}

async function submitLog() {
  const vid  = document.getElementById('log-vol').value;
  const hrs  = +document.getElementById('log-hrs').value;
  const date = document.getElementById('log-date').value;
  const note = document.getElementById('log-note').value;
  if (!vid || !hrs || hrs <= 0 || !date) { toast('Please select a volunteer, date, and hours.'); return; }
  const { error } = await supabaseClient.from('logs').insert({ vid, hrs, date, note });
  if (error) { toast('Log failed: ' + error.message); return; }
  await refetchLogs();
  toast('Hours logged! ✓');
  document.getElementById('log-hrs').value = '';
  document.getElementById('log-note').value = '';
  renderLogList();
  checkSwagUnlock(vid, hrs);
}

function checkSwagUnlock(vid, addedHrs) {
  const v = state.volunteers.find(x => x.id === vid);
  if (!v) return;
  const prev = totalHrs(vid) - addedHrs;
  const now  = totalHrs(vid);
  const newItems = state.swag.filter(s => s.hrs > prev && s.hrs <= now);
  if (newItems.length) toast(`🎉 ${v.name} unlocked: ${newItems.map(s => s.emoji + ' ' + s.name).join(', ')}!`);
}

function renderLogList() {
  const recent = [...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  document.getElementById('log-list').innerHTML = recent.length
    ? recent.map(l => {
        const v = state.volunteers.find(x => x.id === l.vid);
        return `<div class="log-entry">
          <span style="font-size:13px;font-weight:500">${escapeHtml(v ? v.name : '?')}</span>
          <span style="font-size:13px;color:var(--color-text-secondary);flex:1;padding:0 8px">${escapeHtml(l.note || '')}</span>
          <span style="font-size:13px;font-weight:500;color:#1D9E75;min-width:40px;text-align:right">+${l.hrs}h</span>
          <span style="font-size:12px;color:var(--color-text-secondary);min-width:80px;text-align:right">${escapeHtml(l.date)}</span>
          <button class="btn btn-sm btn-danger" style="margin-left:6px;padding:2px 6px" onclick="deleteLog('${l.id}')"><i class="ti ti-trash" aria-hidden="true"></i></button>
        </div>`;
      }).join('')
    : '<div class="empty">No logs yet.</div>';
}

async function deleteLog(id) {
  const { error } = await supabaseClient.from('logs').delete().eq('id', id);
  if (error) { toast('Delete failed: ' + error.message); return; }
  await refetchLogs();
  renderLogList();
  toast('Entry removed.');
}

function bulkLogOpen() {
  if (!state.volunteers.length) { toast('Add volunteers first.'); return; }
  showModal(`<h3 style="margin-bottom:.75rem">Bulk hour log</h3>
    <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:1rem">Log the same hours for multiple volunteers at once.</p>
    <div class="form-row"><div><label>Hours each</label><input id="bl-hrs" type="number" min=".5" step=".5" placeholder="e.g. 4"></div><div><label>Date</label><input id="bl-date" type="date" value="${new Date().toISOString().slice(0, 10)}"></div></div>
    <div class="form-row single"><label>Activity note</label><input id="bl-note" placeholder="e.g. Community fair"></div>
    <div style="max-height:200px;overflow-y:auto;border:0.5px solid var(--color-border);border-radius:var(--radius-md);padding:.5rem;margin-bottom:.75rem">
      ${state.volunteers.map(v => `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;cursor:pointer"><input type="checkbox" id="bl-${v.id}" style="width:auto"> ${escapeHtml(v.name)}</label>`).join('')}
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" onclick="submitBulkLog()">Log hours</button>
      <button class="btn" onclick="closeModal()">Cancel</button>
    </div>`);
}

async function submitBulkLog() {
  const hrs  = +document.getElementById('bl-hrs').value;
  const date = document.getElementById('bl-date').value;
  const note = document.getElementById('bl-note').value;
  if (!hrs || hrs <= 0 || !date) { toast('Enter a valid date and hours.'); return; }
  const selected = state.volunteers.filter(v => document.getElementById('bl-' + v.id)?.checked);
  if (!selected.length) { toast('Select at least one volunteer.'); return; }
  const rows = selected.map(v => ({ vid: v.id, hrs, date, note }));
  const { error } = await supabaseClient.from('logs').insert(rows);
  if (error) { toast('Log failed: ' + error.message); return; }
  await refetchLogs();
  closeModal();
  renderLogList();
  toast(`Logged ${hrs}h for ${selected.length} volunteers!`);
  selected.forEach(v => checkSwagUnlock(v.id, hrs));
}

// ─── Swag Vault ───────────────────────────────────────────────────────────────

function renderSwag() {
  const sorted = [...state.swag].sort((a, b) => a.hrs - b.hrs);
  document.getElementById('swag-tiers').innerHTML = sorted.map(s => `
    <div class="swag-item">
      <div class="swag-icon">${escapeHtml(s.emoji)}</div>
      <div class="swag-name">${escapeHtml(s.name)}</div>
      <div class="swag-desc">${escapeHtml(s.description)}</div>
      <div class="swag-hrs">${s.hrs} hrs</div>
    </div>`).join('');

  document.getElementById('swag-progress').innerHTML = [...state.volunteers]
    .sort((a, b) => totalHrs(b.id) - totalHrs(a.id))
    .map((v, i) => {
      const h = totalHrs(v.id);
      const earnedCount = sorted.filter(s => s.hrs <= h).length;
      const nextSwag = sorted.find(s => s.hrs > h);
      const pct = nextSwag ? Math.round(h / nextSwag.hrs * 100) : 100;
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:0.5px solid var(--color-border)">
        <div class="avatar av-${avatarColor(i)}" style="width:32px;height:32px;font-size:11px">${escapeHtml(initials(v.name))}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500">${escapeHtml(v.name)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
            <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
            <span style="font-size:11px;color:var(--color-text-secondary);white-space:nowrap">${h.toFixed(1)}h${nextSwag ? ' / ' + nextSwag.hrs + 'h' : ' ✓'}</span>
          </div>
        </div>
        ${earnedCount
          ? `<span class="badge badge-purple">${sorted.slice(0, earnedCount).map(s => escapeHtml(s.emoji)).join('')}</span>`
          : '<span class="badge badge-gray">0 earned</span>'}
      </div>`;
    }).join('') || '<div class="empty">No volunteers yet.</div>';
}

function openSwagEdit() {
  const sorted = [...state.swag].sort((a, b) => a.hrs - b.hrs);
  showModal(`<h3 style="margin-bottom:1rem">Edit swag rewards</h3>
    <div id="swag-edit-list">${sorted.map(s => `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px" id="se-${s.id}">
        <input style="width:44px" value="${escapeHtml(s.emoji)}" id="se-em-${s.id}" placeholder="🎁">
        <input style="flex:1" value="${escapeHtml(s.name)}" id="se-nm-${s.id}" placeholder="Item name">
        <input style="flex:1.5" value="${escapeHtml(s.description)}" id="se-dc-${s.id}" placeholder="Description">
        <input style="width:64px" type="number" value="${s.hrs}" id="se-hr-${s.id}" placeholder="hrs">
        <button class="btn btn-sm btn-danger" onclick="removeSwagItem('${s.id}')"><i class="ti ti-trash" aria-hidden="true"></i></button>
      </div>`).join('')}</div>
    <button class="btn" style="width:100%;margin-bottom:.75rem" onclick="addSwagRow()"><i class="ti ti-plus" aria-hidden="true"></i> Add tier</button>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" onclick="saveSwag()">Save rewards</button>
      <button class="btn" onclick="closeModal()">Cancel</button>
    </div>`);
}

let newSwagCounter = 0;

function addSwagRow() {
  const id = 'new-' + (++newSwagCounter);
  const div = document.createElement('div');
  div.id = 'se-' + id;
  div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px';
  div.innerHTML = `<input style="width:44px" id="se-em-${id}" placeholder="🎁"><input style="flex:1" id="se-nm-${id}" placeholder="Item name"><input style="flex:1.5" id="se-dc-${id}" placeholder="Description"><input style="width:64px" type="number" id="se-hr-${id}" placeholder="hrs"><button class="btn btn-sm btn-danger" onclick="removeSwagItem('${id}')"><i class="ti ti-trash" aria-hidden="true"></i></button>`;
  document.getElementById('swag-edit-list').appendChild(div);
}

function removeSwagItem(id) {
  const el = document.getElementById('se-' + id);
  if (el) el.remove();
}

async function saveSwag() {
  const allIds = [...document.querySelectorAll('[id^="se-em-"]')].map(el => el.id.replace('se-em-', ''));
  const rows = allIds.map(id => ({
    id,
    emoji: document.getElementById('se-em-' + id).value || '🎁',
    name:  document.getElementById('se-nm-' + id).value || 'Item',
    description: document.getElementById('se-dc-' + id).value || '',
    hrs:   +(document.getElementById('se-hr-' + id).value || 0),
  })).filter(s => s.name && s.hrs > 0);

  const originalIds = new Set(state.swag.map(s => s.id));
  const keptIds = new Set(rows.filter(r => !r.id.startsWith('new-')).map(r => r.id));
  const toDelete = [...originalIds].filter(id => !keptIds.has(id));
  const toInsert = rows.filter(r => r.id.startsWith('new-')).map(({ id, ...rest }) => rest);
  const toUpdate = rows.filter(r => !r.id.startsWith('new-'));

  try {
    if (toDelete.length) {
      const { error } = await supabaseClient.from('swag').delete().in('id', toDelete);
      if (error) throw error;
    }
    for (const row of toUpdate) {
      const { id, ...rest } = row;
      const { error } = await supabaseClient.from('swag').update(rest).eq('id', id);
      if (error) throw error;
    }
    if (toInsert.length) {
      const { error } = await supabaseClient.from('swag').insert(toInsert);
      if (error) throw error;
    }
  } catch (e) {
    toast('Save failed: ' + e.message);
    return;
  }
  await refetchSwag();
  closeModal(); renderSwag();
  toast('Swag rewards saved! 🎁');
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function saveGroupName() {
  const name = document.getElementById('group-name-input').value.trim() || 'My Volunteers';
  const { error } = await supabaseClient.from('app_settings').update({ group_name: name }).eq('id', 1);
  if (error) { toast('Save failed: ' + error.message); return; }
  state.groupName = name;
  toast('Saved!');
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'volunteer-hub-export.json';
  a.click();
}

async function confirmReset() {
  if (!confirm('Reset ALL data? This cannot be undone.')) return;
  try {
    let res = await supabaseClient.from('logs').delete().not('id', 'is', null);
    if (res.error) throw res.error;
    res = await supabaseClient.from('volunteers').delete().not('id', 'is', null);
    if (res.error) throw res.error;
    res = await supabaseClient.from('swag').delete().not('id', 'is', null);
    if (res.error) throw res.error;
    res = await supabaseClient.from('swag').insert(DEFAULT_SWAG);
    if (res.error) throw res.error;
    res = await supabaseClient.from('app_settings').update({ group_name: 'My Volunteers' }).eq('id', 1);
    if (res.error) throw res.error;
  } catch (e) {
    toast('Reset failed: ' + e.message);
    return;
  }
  await loadState();
  toast('Data reset.');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function render() {
  renderDashboard();
  renderVols();
  renderSwag();
}

initAuth();
