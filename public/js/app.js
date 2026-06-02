/* ─── STATE ─────────────────────────────────────────────────── */
const state = {
  years: [],
  currentYear: null,
  nominations: [],
  winners: {},
  token: null,
  isAdmin: false,
  presentation: {
    categories: [],
    catIndex: 0,
    phase: 'nominees',
  },
};

/* ─── API ────────────────────────────────────────────────────── */
const API = {
  base: '/api',

  headers(auth) {
    const h = { 'Content-Type': 'application/json' };
    if (auth && state.token) h['Authorization'] = 'Bearer ' + state.token;
    return h;
  },

  async login(user, pass) {
    const r = await fetch(API.base + '/auth', {
      method: 'POST',
      headers: API.headers(false),
      body: JSON.stringify({ username: user, password: pass }),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  },

  async getYears() {
    const r = await fetch(API.base + '/years');
    if (!r.ok) return [];
    return r.json();
  },

  async createYear(year) {
    const r = await fetch(API.base + '/years', {
      method: 'POST',
      headers: API.headers(true),
      body: JSON.stringify({ year }),
    });
    return r.json();
  },

  async getNominations(year) {
    const r = await fetch(API.base + '/nominations?year=' + year);
    if (!r.ok) return [];
    return r.json();
  },

  async addNomination(year, category, data) {
    const r = await fetch(API.base + '/nominations', {
      method: 'POST',
      headers: API.headers(true),
      body: JSON.stringify({ year: year, category: category, data: data }),
    });
    return r.json();
  },

  async deleteNomination(year, id) {
    const r = await fetch(API.base + '/nominations?year=' + year + '&id=' + id, {
      method: 'DELETE',
      headers: API.headers(true),
    });
    return r.json();
  },

  async getWinners(year) {
    const r = await fetch(API.base + '/winners?year=' + year);
    if (!r.ok) return {};
    return r.json();
  },

  async setWinners(year, winners) {
    const r = await fetch(API.base + '/winners', {
      method: 'POST',
      headers: API.headers(true),
      body: JSON.stringify({ year: year, winners: winners }),
    });
    return r.json();
  },
};

/* ─── PARTICLE CANVAS ────────────────────────────────────────── */
function initParticles(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  var particles = [];

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (var i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.5 + 0.1,
      drift: (Math.random() - 0.5) * 0.2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function(p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201,168,76,' + p.opacity + ')';
      ctx.fill();
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
      if (p.x < -5) p.x = canvas.width + 5;
      if (p.x > canvas.width + 5) p.x = -5;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ─── CONFETTI ────────────────────────────────────────────────── */
function launchConfetti() {
  var container = document.getElementById('confetti');
  container.innerHTML = '';
  var colors = ['#c9a84c', '#e8c96a', '#fff8e0', '#f0d080', '#b8920a'];
  for (var i = 0; i < 120; i++) {
    var el = document.createElement('div');
    var color = colors[Math.floor(Math.random() * colors.length)];
    var size = Math.random() * 8 + 4;
    var shape = Math.random() > 0.5 ? '50%' : '2px';
    var left = Math.random() * 100;
    var opacity = Math.random() * 0.8 + 0.2;
    var duration = Math.random() * 3 + 2;
    var delay = Math.random() * 1.5;
    el.style.cssText = 'position:absolute;width:' + size + 'px;height:' + size + 'px;background:' + color + ';border-radius:' + shape + ';left:' + left + 'vw;top:-10px;opacity:' + opacity + ';animation:confetti-fall ' + duration + 's ease-in ' + delay + 's forwards;';
    container.appendChild(el);
  }

  var style = document.getElementById('confetti-style') || document.createElement('style');
  style.id = 'confetti-style';
  style.textContent = '@keyframes confetti-fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }';
  document.head.appendChild(style);

  setTimeout(function() { container.innerHTML = ''; }, 6000);
}

/* ─── CATEGORY HELPERS ───────────────────────────────────────── */
var CATEGORY_LABELS = {
  song: 'Song of the Year',
  album: 'Album of the Year',
  concert: 'Concert of the Year',
  rookie: 'Rookie of the Year',
};

var CATEGORY_FIELDS = {
  song: [
    { key: 'songName', label: 'Song Name', placeholder: 'e.g. Blinding Lights' },
    { key: 'artistName', label: 'Artist Name', placeholder: 'e.g. The Weeknd' },
    { key: 'releaseDate', label: 'Release Date', type: 'date' },
  ],
  album: [
    { key: 'albumName', label: 'Album Name', placeholder: 'e.g. Midnights' },
    { key: 'artistName', label: 'Artist Name', placeholder: 'e.g. Taylor Swift' },
    { key: 'releaseDate', label: 'Release Date', type: 'date' },
  ],
  concert: [
    { key: 'artistName', label: 'Artist Name', placeholder: 'e.g. Beyonce' },
    { key: 'venueName', label: 'Venue Name', placeholder: 'e.g. Madison Square Garden' },
    { key: 'concertDate', label: 'Concert Date', type: 'date' },
  ],
  rookie: [
    { key: 'artistName', label: 'Artist Name', placeholder: 'e.g. Ice Spice' },
    { key: 'debutDate', label: 'Debut Date', type: 'date' },
  ],
};

function getNomineePrimaryText(nom) {
  var d = nom.data;
  if (nom.category === 'song') return d.songName || '-';
  if (nom.category === 'album') return d.albumName || '-';
  if (nom.category === 'concert') return d.artistName || '-';
  if (nom.category === 'rookie') return d.artistName || '-';
  return '-';
}

function getNomineeSecondaryText(nom) {
  var d = nom.data;
  var parts = [];
  if (nom.category === 'song') {
    if (d.artistName) parts.push(d.artistName);
    if (d.releaseDate) parts.push(formatDate(d.releaseDate));
  } else if (nom.category === 'album') {
    if (d.artistName) parts.push(d.artistName);
    if (d.releaseDate) parts.push(formatDate(d.releaseDate));
  } else if (nom.category === 'concert') {
    if (d.venueName) parts.push(d.venueName);
    if (d.concertDate) parts.push(formatDate(d.concertDate));
  } else if (nom.category === 'rookie') {
    if (d.debutDate) parts.push('Debut: ' + formatDate(d.debutDate));
  }
  return parts.join(' · ');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch(e) { return dateStr; }
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── RENDER ─────────────────────────────────────────────────── */
function renderYearNav() {
  var nav = document.getElementById('year-nav');
  nav.innerHTML = '';

  state.years.forEach(function(y) {
    var btn = document.createElement('button');
    var classes = 'year-btn';
    if (y.status === 'complete') classes += ' complete';
    if (state.currentYear && state.currentYear.year === y.year) classes += ' active';
    btn.className = classes;
    btn.textContent = y.year;
    btn.addEventListener('click', function() { selectYear(y.year); });
    nav.appendChild(btn);
  });

  if (state.isAdmin) {
    var addBtn = document.createElement('button');
    addBtn.className = 'add-year-btn';
    addBtn.textContent = '+ New Year';
    addBtn.addEventListener('click', openYearModal);
    nav.appendChild(addBtn);
  }
}

function renderYearView() {
  if (!state.currentYear) {
    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('year-screen').classList.add('hidden');
    return;
  }

  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('year-screen').classList.remove('hidden');

  var y = state.currentYear;
  document.getElementById('year-title').textContent = y.year + ' Awards';

  var badge = document.getElementById('year-badge');
  badge.textContent = y.status === 'complete' ? 'Complete' : 'Accepting Nominations';
  badge.className = y.status === 'complete' ? 'complete' : 'open';

  var adminActions = document.getElementById('year-admin-actions');
  var addBtn = document.getElementById('add-nomination-btn');
  var selectBtn = document.getElementById('select-winners-btn');
  var presBtn = document.getElementById('start-presentation-btn');

  // Always show presentation button for complete years
  if (y.status === 'complete') {
    adminActions.classList.remove('hidden');
    addBtn.classList.add('hidden');
    selectBtn.classList.add('hidden');
    presBtn.classList.remove('hidden');
  } else if (state.isAdmin) {
    adminActions.classList.remove('hidden');
    addBtn.classList.remove('hidden');
    selectBtn.classList.remove('hidden');
    presBtn.classList.add('hidden');
  } else {
    adminActions.classList.add('hidden');
  }

  renderNominees();
}

function renderNominees() {
  ['song', 'album', 'concert', 'rookie'].forEach(function(cat) {
    var container = document.getElementById('nominees-' + cat);
    var catNoms = state.nominations.filter(function(n) { return n.category === cat; });
    container.innerHTML = '';

    if (catNoms.length === 0) {
      container.innerHTML = '<p class="empty-state">No nominees yet</p>';
      return;
    }

    catNoms.forEach(function(nom) {
      var winnerId = state.winners[cat];
      var isWinner = winnerId === nom.id;
      var item = document.createElement('div');
      item.className = 'nominee-item' + (isWinner ? ' winner' : '');

      var crown = isWinner ? '<span class="winner-crown">&#9819;</span>' : '';
      var info = document.createElement('div');
      info.className = 'nominee-info';
      info.innerHTML = '<div class="nominee-primary">' + crown + escHtml(getNomineePrimaryText(nom)) + '</div><div class="nominee-secondary">' + escHtml(getNomineeSecondaryText(nom)) + '</div>';
      item.appendChild(info);

      if (state.isAdmin && state.currentYear && state.currentYear.status === 'open') {
        var del = document.createElement('button');
        del.className = 'nominee-delete-btn';
        del.textContent = 'x';
        del.title = 'Remove nominee';
        del.addEventListener('click', (function(id) { return function() { deleteNominee(id); }; })(nom.id));
        item.appendChild(del);
      }

      container.appendChild(item);
    });
  });
}

/* ─── ACTIONS ─────────────────────────────────────────────────── */
async function loadYears() {
  try {
    state.years = await API.getYears();
    if (!Array.isArray(state.years)) state.years = [];
  } catch(e) {
    console.error('loadYears error:', e);
    state.years = [];
  }
}

async function selectYear(year) {
  state.currentYear = state.years.find(function(y) { return y.year === year; }) || null;
  if (state.currentYear) {
    state.nominations = await API.getNominations(year);
    state.winners = await API.getWinners(year);
    if (!Array.isArray(state.nominations)) state.nominations = [];
    if (!state.winners || typeof state.winners !== 'object') state.winners = {};
  }
  renderYearNav();
  renderYearView();
}

async function deleteNominee(id) {
  if (!confirm('Remove this nominee?')) return;
  await API.deleteNomination(state.currentYear.year, id);
  state.nominations = await API.getNominations(state.currentYear.year);
  renderNominees();
}

/* ─── LOGIN ──────────────────────────────────────────────────── */
document.getElementById('admin-toggle-btn').addEventListener('click', function() {
  if (state.isAdmin) {
    state.isAdmin = false;
    state.token = null;
    document.getElementById('admin-toggle-btn').textContent = 'Admin';
    renderYearNav();
    renderYearView();
  } else {
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('login-user').focus();
  }
});

document.getElementById('login-btn').addEventListener('click', async function() {
  var user = document.getElementById('login-user').value.trim();
  var pass = document.getElementById('login-pass').value;
  var errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  errEl.textContent = 'Invalid credentials';

  var res;
  try {
    res = await API.login(user, pass);
  } catch(e) {
    errEl.textContent = 'Could not reach server: ' + e.message;
    errEl.classList.remove('hidden');
    return;
  }

  if (res && res.success) {
    state.token = res.token;
    state.isAdmin = true;
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('admin-toggle-btn').textContent = 'Log Out';
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    await loadYears();
    renderYearNav();
    renderYearView();
  } else {
    errEl.textContent = (res && res.error) ? res.error : 'Invalid credentials';
    errEl.classList.remove('hidden');
  }
});

document.getElementById('login-cancel').addEventListener('click', function() {
  document.getElementById('login-overlay').classList.add('hidden');
});

document.getElementById('login-pass').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('login-btn').click();
});

/* ─── YEAR MODAL ─────────────────────────────────────────────── */
function openYearModal() {
  document.getElementById('year-modal').classList.remove('hidden');
  document.getElementById('new-year-input').value = '';
  document.getElementById('year-error').classList.add('hidden');
  setTimeout(function() { document.getElementById('new-year-input').focus(); }, 50);
}

document.getElementById('year-cancel').addEventListener('click', function() {
  document.getElementById('year-modal').classList.add('hidden');
});

document.getElementById('year-submit').addEventListener('click', async function() {
  var yearVal = parseInt(document.getElementById('new-year-input').value);
  var errEl = document.getElementById('year-error');
  errEl.classList.add('hidden');

  if (!yearVal || yearVal < 2000 || yearVal > 2099) {
    errEl.textContent = 'Please enter a valid year (2000-2099)';
    errEl.classList.remove('hidden');
    return;
  }

  var res;
  try {
    res = await API.createYear(yearVal);
  } catch(e) {
    errEl.textContent = 'Error: ' + e.message;
    errEl.classList.remove('hidden');
    return;
  }

  if (res && res.error) {
    errEl.textContent = res.error;
    errEl.classList.remove('hidden');
    return;
  }

  document.getElementById('year-modal').classList.add('hidden');
  // Optimistically add year to state in case Blobs read is stale
  var newYearObj = { year: yearVal, status: 'open', createdAt: new Date().toISOString() };
  if (!state.years.find(function(y) { return y.year === yearVal; })) {
    state.years.unshift(newYearObj);
  }
  await loadYears();
  if (!state.years.find(function(y) { return y.year === yearVal; })) {
    state.years.unshift(newYearObj);
  }
  await selectYear(yearVal);
});

document.getElementById('new-year-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('year-submit').click();
});

/* ─── NOMINATION MODAL ───────────────────────────────────────── */
function buildNomFields(category) {
  var fields = CATEGORY_FIELDS[category] || [];
  return fields.map(function(f) {
    return '<div class="modal-field"><label>' + f.label + '</label><input type="' + (f.type || 'text') + '" id="nom-field-' + f.key + '" placeholder="' + (f.placeholder || '') + '" /></div>';
  }).join('');
}

document.getElementById('add-nomination-btn').addEventListener('click', function() {
  var catSel = document.getElementById('nom-category');
  catSel.value = 'song';
  document.getElementById('nom-fields').innerHTML = buildNomFields('song');
  document.getElementById('nom-error').classList.add('hidden');
  document.getElementById('nomination-modal').classList.remove('hidden');
});

document.getElementById('nom-category').addEventListener('change', function(e) {
  document.getElementById('nom-fields').innerHTML = buildNomFields(e.target.value);
});

document.getElementById('nom-cancel').addEventListener('click', function() {
  document.getElementById('nomination-modal').classList.add('hidden');
});

document.getElementById('nom-submit').addEventListener('click', async function() {
  var category = document.getElementById('nom-category').value;
  var fields = CATEGORY_FIELDS[category];
  var data = {};
  var errEl = document.getElementById('nom-error');
  errEl.classList.add('hidden');

  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    var el = document.getElementById('nom-field-' + f.key);
    var val = el ? el.value.trim() : '';
    if (!val) {
      errEl.textContent = f.label + ' is required';
      errEl.classList.remove('hidden');
      return;
    }
    data[f.key] = val;
  }

  var res;
  try {
    res = await API.addNomination(state.currentYear.year, category, data);
  } catch(e) {
    errEl.textContent = 'Error: ' + e.message;
    errEl.classList.remove('hidden');
    return;
  }

  if (res && res.error) {
    errEl.textContent = res.error;
    errEl.classList.remove('hidden');
    return;
  }

  document.getElementById('nomination-modal').classList.add('hidden');
  // Optimistically add to local state so it shows immediately
  if (res && res.id) state.nominations.push(res);
  renderNominees();
  // Then reload from server in background to confirm
  API.getNominations(state.currentYear.year).then(function(noms) {
    if (Array.isArray(noms) && noms.length >= state.nominations.length) {
      state.nominations = noms;
      renderNominees();
    }
  });
});

/* ─── WINNERS MODAL ──────────────────────────────────────────── */
document.getElementById('select-winners-btn').addEventListener('click', function() {
  var form = document.getElementById('winners-form');
  form.innerHTML = '';
  document.getElementById('winners-error').classList.add('hidden');

  ['song', 'album', 'concert', 'rookie'].forEach(function(cat) {
    var catNoms = state.nominations.filter(function(n) { return n.category === cat; });
    var section = document.createElement('div');
    section.className = 'winner-section';

    var heading = document.createElement('h4');
    heading.textContent = CATEGORY_LABELS[cat];
    section.appendChild(heading);

    if (catNoms.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.style.marginBottom = '0.5rem';
      empty.textContent = 'No nominees in this category';
      section.appendChild(empty);
    } else {
      catNoms.forEach(function(nom) {
        var item = document.createElement('label');
        item.className = 'winner-radio-item';
        item.innerHTML = '<input type="radio" name="winner-' + cat + '" value="' + nom.id + '" /><div class="winner-radio-label">' + escHtml(getNomineePrimaryText(nom)) + '<div class="winner-radio-sublabel">' + escHtml(getNomineeSecondaryText(nom)) + '</div></div>';
        section.appendChild(item);
      });
    }
    form.appendChild(section);
  });

  document.getElementById('winners-modal').classList.remove('hidden');
});

document.getElementById('winners-cancel').addEventListener('click', function() {
  document.getElementById('winners-modal').classList.add('hidden');
});

document.getElementById('winners-submit').addEventListener('click', async function() {
  var errEl = document.getElementById('winners-error');
  errEl.classList.add('hidden');

  var cats = ['song', 'album', 'concert', 'rookie'];
  var winners = {};

  for (var i = 0; i < cats.length; i++) {
    var cat = cats[i];
    var catNoms = state.nominations.filter(function(n) { return n.category === cat; });
    if (catNoms.length === 0) continue;
    var sel = document.querySelector('input[name="winner-' + cat + '"]:checked');
    if (!sel) {
      errEl.textContent = 'Please select a winner for ' + CATEGORY_LABELS[cat];
      errEl.classList.remove('hidden');
      return;
    }
    winners[cat] = sel.value;
  }

  if (!confirm('This will lock the year and announce winners. Continue?')) return;

  var res;
  try {
    res = await API.setWinners(state.currentYear.year, winners);
  } catch(e) {
    errEl.textContent = 'Error: ' + e.message;
    errEl.classList.remove('hidden');
    return;
  }

  if (res && res.error) {
    errEl.textContent = res.error;
    errEl.classList.remove('hidden');
    return;
  }

  document.getElementById('winners-modal').classList.add('hidden');
  await loadYears();
  await selectYear(state.currentYear.year);
});

/* ─── PRESENTATION MODE ──────────────────────────────────────── */
var pres = state.presentation;

function buildPresCategories() {
  return ['song', 'album', 'concert', 'rookie'].filter(function(cat) {
    return state.nominations.some(function(n) { return n.category === cat; });
  });
}

function startPresentation() {
  pres.categories = buildPresCategories();
  pres.catIndex = 0;
  pres.phase = 'intro';

  document.getElementById('presentation-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  initParticles('pres-particles');
  showPresIntro();
}

function showPresIntro() {
  document.getElementById('pres-category-label').textContent = '';
  document.getElementById('pres-title').textContent = state.currentYear.year + ' Awards';
  document.getElementById('pres-nominees-list').innerHTML = '';
  document.getElementById('pres-winner-reveal').classList.add('hidden');
  document.getElementById('pres-next-btn').textContent = 'Begin >';
  pres.phase = 'intro';
}

function showPresNominees() {
  var cat = pres.categories[pres.catIndex];
  if (!cat) { endPresentation(); return; }

  var noms = state.nominations.filter(function(n) { return n.category === cat; });
  document.getElementById('pres-category-label').textContent = CATEGORY_LABELS[cat];
  document.getElementById('pres-title').textContent = 'And the nominees are...';
  document.getElementById('pres-winner-reveal').classList.add('hidden');

  var list = document.getElementById('pres-nominees-list');
  list.innerHTML = '';
  noms.forEach(function(nom, i) {
    var li = document.createElement('div');
    li.className = 'pres-nominee';
    li.style.animationDelay = (i * 0.15) + 's';
    li.innerHTML = escHtml(getNomineePrimaryText(nom)) + '<span>' + escHtml(getNomineeSecondaryText(nom)) + '</span>';
    list.appendChild(li);
  });

  document.getElementById('pres-next-btn').textContent = 'Reveal Winner >';
  pres.phase = 'nominees';
}

function showPresWinner() {
  var cat = pres.categories[pres.catIndex];
  var winnerId = state.winners[cat];
  var winner = state.nominations.find(function(n) { return n.id === winnerId; });

  if (!winner) { advancePres(); return; }

  document.getElementById('pres-nominees-list').innerHTML = '';
  document.getElementById('pres-winner-reveal').classList.remove('hidden');
  document.getElementById('pres-winner-name').textContent = getNomineePrimaryText(winner);
  document.getElementById('pres-winner-detail').textContent = getNomineeSecondaryText(winner);

  launchConfetti();

  var hasNext = pres.catIndex < pres.categories.length - 1;
  document.getElementById('pres-next-btn').textContent = hasNext ? 'Next Category >' : 'Finish >';
  pres.phase = 'winner';
}

function advancePres() {
  if (pres.phase === 'intro') {
    pres.catIndex = 0;
    showPresNominees();
  } else if (pres.phase === 'nominees') {
    showPresWinner();
  } else if (pres.phase === 'winner') {
    pres.catIndex++;
    if (pres.catIndex >= pres.categories.length) {
      endPresentation();
    } else {
      showPresNominees();
    }
  }
}

function endPresentation() {
  document.getElementById('presentation-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('pres-next-btn').addEventListener('click', advancePres);
document.getElementById('pres-exit').addEventListener('click', endPresentation);
document.getElementById('start-presentation-btn').addEventListener('click', startPresentation);

/* ─── CLOSE MODALS ON BACKDROP ───────────────────────────────── */
document.querySelectorAll('.modal').forEach(function(modal) {
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

/* ─── INIT ───────────────────────────────────────────────────── */
async function init() {
  initParticles('particles');
  await loadYears();
  if (state.years.length > 0) {
    await selectYear(state.years[0].year);
  }
}

init();
