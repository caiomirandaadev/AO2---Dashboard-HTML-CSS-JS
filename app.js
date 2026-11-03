let b4aAppId = localStorage.getItem('b4a_app_id') || '';
let b4aRestKey = localStorage.getItem('b4a_rest_key') || '';

const rawGamesData = [
  { id: 1, name: 'Counter-Strike 2', genre: 'FPS', ccu: 1420000, prizeUSD: 2250000, rating: 88, year: '2026', icon: 'fa-crosshairs', color: '#8b5cf6' },
  { id: 2, name: 'Dota 2', genre: 'MOBA', ccu: 780000, prizeUSD: 15200000, rating: 82, year: '2026', icon: 'fa-shield-halved', color: '#06b6d4' },
  { id: 3, name: 'PUBG: BATTLEGROUNDS', genre: 'Battle Royale', ccu: 620000, prizeUSD: 3100000, rating: 71, year: '2025', icon: 'fa-person-rifle', color: '#f59e0b' },
  { id: 4, name: 'Apex Legends', genre: 'Battle Royale', ccu: 390000, prizeUSD: 2000000, rating: 78, year: '2026', icon: 'fa-jet-fighter', color: '#ef4444' },
  { id: 5, name: 'GTA V / FiveM', genre: 'RPG', ccu: 290000, prizeUSD: 450000, rating: 90, year: '2024', icon: 'fa-car', color: '#10b981' },
  { id: 6, name: 'Baldur\'s Gate 3', genre: 'RPG', ccu: 180000, prizeUSD: 100000, rating: 96, year: '2024', icon: 'fa-dice-d20', color: '#ec4899' },
  { id: 7, name: 'Valorant', genre: 'FPS', ccu: 950000, prizeUSD: 4500000, rating: 85, year: '2026', icon: 'fa-gun', color: '#f43f5e' },
  { id: 8, name: 'League of Legends', genre: 'MOBA', ccu: 1850000, prizeUSD: 5000000, rating: 80, year: '2026', icon: 'fa-hat-wizard', color: '#3b82f6' },
  { id: 9, name: 'Age of Empires II', genre: 'Strategy', ccu: 45000, prizeUSD: 300000, rating: 94, year: '2025', icon: 'fa-chess-king', color: '#84cc16' }
];

const ccuMonthlyTrend = {
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  data2026: [1120, 1180, 1250, 1210, 1300, 1380, 1450, 1420, 1500, 1580, 1620, 1700],
  data2025: [950, 980, 1020, 1050, 1100, 1150, 1180, 1200, 1220, 1280, 1310, 1350]
};

let exchangeRates = { USD: 1, BRL: 5.15, EUR: 0.92 };
let chartLine = null;
let chartDonut = null;
let chartBar = null;
let chartCrud = null;
let metasData = [];

document.addEventListener('DOMContentLoaded', () => {
  initUIEvents();
  fetchExchangeRates();
  renderDashboard();
  loadMetas();
});

function initUIEvents() {
  const btnToggle = document.getElementById('btnToggleSidebar');
  const sidebar = document.getElementById('sidebar');
  if (btnToggle && sidebar) {
    btnToggle.addEventListener('click', () => sidebar.classList.toggle('-ml-64'));
  }

  const btnTheme = document.getElementById('btnThemeToggle');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => document.documentElement.classList.toggle('dark'));
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      switchTab(target);
    });
  });

  document.getElementById('filterSearch').addEventListener('input', renderDashboard);
  document.getElementById('filterGenre').addEventListener('change', renderDashboard);
  document.getElementById('filterYear').addEventListener('change', renderDashboard);
  document.getElementById('filterCurrency').addEventListener('change', renderDashboard);

  document.getElementById('btnOpenModalMeta').addEventListener('click', () => openMetaModal());
  document.getElementById('btnCloseModal').addEventListener('click', closeMetaModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeMetaModal);
  document.getElementById('formMeta').addEventListener('submit', handleMetaSubmit);
  document.getElementById('btnRefreshMetas').addEventListener('click', loadMetas);

  const formB4A = document.getElementById('formB4AConfig');
  if (formB4A) {
    document.getElementById('inputAppId').value = b4aAppId;
    document.getElementById('inputRestKey').value = b4aRestKey;

    formB4A.addEventListener('submit', (e) => {
      e.preventDefault();
      b4aAppId = document.getElementById('inputAppId').value.trim();
      b4aRestKey = document.getElementById('inputRestKey').value.trim();
      localStorage.setItem('b4a_app_id', b4aAppId);
      localStorage.setItem('b4a_rest_key', b4aRestKey);
      alert('Configurações salvas!');
      loadMetas();
    });
  }
}

function switchTab(targetId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(targetId).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-target') === targetId) {
      btn.className = 'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white shadow-md shadow-brand-600/20';
    } else {
      btn.className = 'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition';
    }
  });
}

async function fetchExchangeRates() {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL');
    if (!res.ok) throw new Error('Falha API Moedas');
    const data = await res.json();

    const usdBrl = parseFloat(data.USDBRL.bid);
    const eurBrl = parseFloat(data.EURBRL.bid);

    exchangeRates.BRL = usdBrl;
    exchangeRates.EUR = usdBrl / eurBrl;

    document.getElementById('rateUSD').textContent = `USD: R$ ${usdBrl.toFixed(2)}`;
    document.getElementById('rateEUR').textContent = `EUR: R$ ${eurBrl.toFixed(2)}`;
  } catch (err) {
    document.getElementById('rateUSD').textContent = 'USD: R$ 5.15';
    document.getElementById('rateEUR').textContent = 'EUR: R$ 5.60';
  }
}

function getFilteredGames() {
  const search = document.getElementById('filterSearch').value.toLowerCase();
  const genre = document.getElementById('filterGenre').value;
  const year = document.getElementById('filterYear').value;

  return rawGamesData.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search);
    const matchGenre = genre === 'ALL' || g.genre === genre;
    const matchYear = year === 'ALL' || g.year === year;
    return matchSearch && matchGenre && matchYear;
  });
}

function renderDashboard() {
  const filtered = getFilteredGames();
  const currency = document.getElementById('filterCurrency').value;
  const rate = exchangeRates[currency] || 1;

  const totalCCU = filtered.reduce((acc, g) => acc + g.ccu, 0);
  const totalPrizeUSD = filtered.reduce((acc, g) => acc + g.prizeUSD, 0);
  const avgRating = filtered.length ? (filtered.reduce((acc, g) => acc + g.rating, 0) / filtered.length).toFixed(1) : 0;

  document.getElementById('kpiCCU').textContent = (totalCCU / 1000).toFixed(0) + 'k';
  document.getElementById('kpiGames').textContent = filtered.length;
  document.getElementById('kpiPrize').textContent = formatCurrency(totalPrizeUSD * rate, currency);
  document.getElementById('kpiRating').textContent = avgRating + '%';

  renderLineChart();
  renderDonutChart(filtered);
  renderBarChart(filtered, currency, rate);
  renderFeaturedList(filtered, currency, rate);
}

function formatCurrency(val, currency) {
  const symbol = currency === 'BRL' ? 'R$ ' : currency === 'EUR' ? '€ ' : '$ ';
  return symbol + val.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

function renderLineChart() {
  const canvas = document.getElementById('chartLineCCU');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (chartLine) chartLine.destroy();

  chartLine = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ccuMonthlyTrend.labels,
      datasets: [
        {
          label: '2026 (k Jogadores)',
          data: ccuMonthlyTrend.data2026,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        },
        {
          label: '2025 (k Jogadores)',
          data: ccuMonthlyTrend.data2025,
          borderColor: '#06b6d4',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { display: false } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.3)' } }
      }
    }
  });
}

function renderDonutChart(data) {
  const canvas = document.getElementById('chartDonutGenres');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (chartDonut) chartDonut.destroy();

  const genres = ['FPS', 'MOBA', 'Battle Royale', 'RPG', 'Strategy'];
  const counts = genres.map(gn => data.filter(g => g.genre === gn).length);

  chartDonut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: genres,
      datasets: [{
        data: counts,
        backgroundColor: ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#84cc16'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } },
      cutout: '70%'
    }
  });
}

function renderBarChart(data, currency, rate) {
  const canvas = document.getElementById('chartBarPrizes');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (chartBar) chartBar.destroy();

  const sorted = [...data].sort((a, b) => b.prizeUSD - a.prizeUSD).slice(0, 5);

  chartBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(g => g.name),
      datasets: [{
        label: `Premiação (${currency})`,
        data: sorted.map(g => g.prizeUSD * rate),
        backgroundColor: '#10b981',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { display: false } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.3)' } }
      }
    }
  });
}

function renderFeaturedList(data, currency, rate) {
  const container = document.getElementById('featuredGamesList');
  if (!container) return;
  container.innerHTML = '';

  data.slice(0, 4).forEach(g => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40 text-xs';
    item.innerHTML = `
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white" style="background-color: ${g.color}">
          <i class="fa-solid ${g.icon}"></i>
        </div>
        <div>
          <div class="font-bold text-white">${g.name}</div>
          <div class="text-[10px] text-slate-400">${g.genre} • Steam Rating: ${g.rating}%</div>
        </div>
      </div>
      <div class="text-right">
        <div class="font-bold text-emerald-400">${formatCurrency(g.prizeUSD * rate, currency)}</div>
        <div class="text-[10px] text-slate-500">${(g.ccu / 1000).toFixed(0)}k CCU</div>
      </div>
    `;
    container.appendChild(item);
  });
}

async function loadMetas() {
  const statusEl = document.getElementById('statusB4A');

  if (b4aAppId && b4aRestKey) {
    try {
      const res = await fetch('https://parseapi.back4app.com/classes/MetaGamer', {
        headers: {
          'X-Parse-Application-Id': b4aAppId,
          'X-Parse-REST-API-Key': b4aRestKey
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          metasData = data.results.map(item => ({
            id: item.objectId,
            title: item.title,
            game: item.game,
            target: item.target,
            current: item.current,
            deadline: item.deadline
          }));
          if (statusEl) {
            statusEl.textContent = 'Back4App OK';
            statusEl.className = 'font-medium text-emerald-400';
          }
          renderMetasTable();
          renderCrudStatsAndChart();
          return;
        }
      }
    } catch (err) {}
  }

  if (statusEl) {
    statusEl.textContent = 'Modo Local';
    statusEl.className = 'font-medium text-amber-400';
  }
  loadLocalMetas();
  renderMetasTable();
  renderCrudStatsAndChart();
}

function loadLocalMetas() {
  const local = localStorage.getItem('gamer_metas_local');
  if (local) {
    metasData = JSON.parse(local);
  } else {
    metasData = [
      { id: '1', title: 'Meta CS2 Major Copenhagen', game: 'Counter-Strike 2', target: 2000000, current: 1250000, deadline: '2026 Q3' },
      { id: '2', title: 'Orçamento Circuito Valorant', game: 'Valorant', target: 800000, current: 600000, deadline: '2026 Q4' },
      { id: '3', title: 'Fundo Internacional Dota 2', game: 'Dota 2', target: 5000000, current: 1800000, deadline: '2026 Q4' }
    ];
    saveLocalMetas();
  }
}

function saveLocalMetas() {
  localStorage.setItem('gamer_metas_local', JSON.stringify(metasData));
}

function renderMetasTable() {
  const tbody = document.getElementById('tableMetasBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  metasData.forEach(m => {
    const pct = Math.min(100, Math.round((m.current / m.target) * 100));
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-700/30 transition';
    tr.innerHTML = `
      <td class="p-3 pl-4 font-semibold text-white">${m.title}</td>
      <td class="p-3"><span class="bg-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-300">${m.game}</span></td>
      <td class="p-3 font-mono text-emerald-400">$ ${m.target.toLocaleString()}</td>
      <td class="p-3 font-mono text-cyan-400">$ ${m.current.toLocaleString()}</td>
      <td class="p-3 w-32">
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div class="bg-brand-500 h-full rounded-full" style="width: ${pct}%"></div>
          </div>
          <span class="text-[10px] text-slate-400 font-bold">${pct}%</span>
        </div>
      </td>
      <td class="p-3 text-right pr-4 space-x-2">
        <button onclick="editMeta('${m.id}')" class="text-brand-400 hover:text-brand-300 p-1"><i class="fa-solid fa-pen"></i></button>
        <button onclick="deleteMeta('${m.id}')" class="text-rose-400 hover:text-rose-300 p-1"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCrudStatsAndChart() {
  const totalTarget = metasData.reduce((acc, m) => acc + m.target, 0);
  const totalCurrent = metasData.reduce((acc, m) => acc + m.current, 0);
  const avgProgress = metasData.length ? (totalCurrent / totalTarget * 100).toFixed(0) : 0;

  const elTotal = document.getElementById('statTotalMetas');
  const elAmount = document.getElementById('statTargetAmount');
  const elAvg = document.getElementById('statAvgProgress');

  if (elTotal) elTotal.textContent = metasData.length;
  if (elAmount) elAmount.textContent = '$ ' + totalTarget.toLocaleString();
  if (elAvg) elAvg.textContent = avgProgress + '%';

  const canvas = document.getElementById('chartCrudComparison');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (chartCrud) chartCrud.destroy();

  chartCrud = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: metasData.map(m => m.title.length > 15 ? m.title.substring(0, 15) + '...' : m.title),
      datasets: [
        { label: 'Alvo ($)', data: metasData.map(m => m.target), backgroundColor: '#334155', borderRadius: 6 },
        { label: 'Atual ($)', data: metasData.map(m => m.current), backgroundColor: '#8b5cf6', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { display: false } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.3)' } }
      }
    }
  });
}

function openMetaModal(meta = null) {
  const modal = document.getElementById('modalMeta');
  if (!modal) return;
  modal.classList.remove('hidden');

  if (meta) {
    document.getElementById('modalTitle').textContent = 'Editar Meta';
    document.getElementById('metaId').value = meta.id;
    document.getElementById('metaTitle').value = meta.title;
    document.getElementById('metaGame').value = meta.game;
    document.getElementById('metaDeadline').value = meta.deadline;
    document.getElementById('metaTarget').value = meta.target;
    document.getElementById('metaCurrent').value = meta.current;
  } else {
    document.getElementById('modalTitle').textContent = 'Nova Meta de Torneio';
    document.getElementById('formMeta').reset();
    document.getElementById('metaId').value = '';
  }
}

function closeMetaModal() {
  const modal = document.getElementById('modalMeta');
  if (modal) modal.classList.add('hidden');
}

async function handleMetaSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('metaId').value;
  const payload = {
    title: document.getElementById('metaTitle').value,
    game: document.getElementById('metaGame').value,
    deadline: document.getElementById('metaDeadline').value,
    target: parseFloat(document.getElementById('metaTarget').value),
    current: parseFloat(document.getElementById('metaCurrent').value)
  };

  if (b4aAppId && b4aRestKey) {
    try {
      const url = id 
        ? `https://parseapi.back4app.com/classes/MetaGamer/${id}`
        : 'https://parseapi.back4app.com/classes/MetaGamer';
      const method = id ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'X-Parse-Application-Id': b4aAppId,
          'X-Parse-REST-API-Key': b4aRestKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      handleLocalSave(id, payload);
    }
  } else {
    handleLocalSave(id, payload);
  }

  closeMetaModal();
  loadMetas();
}

function handleLocalSave(id, payload) {
  if (id) {
    const idx = metasData.findIndex(m => m.id === id);
    if (idx !== -1) metasData[idx] = { id, ...payload };
  } else {
    metasData.push({ id: Date.now().toString(), ...payload });
  }
  saveLocalMetas();
}

async function editMeta(id) {
  const item = metasData.find(m => m.id === id);
  if (item) openMetaModal(item);
}

async function deleteMeta(id) {
  if (!confirm('Deseja realmente excluir esta meta?')) return;

  if (b4aAppId && b4aRestKey) {
    try {
      await fetch(`https://parseapi.back4app.com/classes/MetaGamer/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Parse-Application-Id': b4aAppId,
          'X-Parse-REST-API-Key': b4aRestKey
        }
      });
    } catch (e) {
      metasData = metasData.filter(m => m.id !== id);
      saveLocalMetas();
    }
  } else {
    metasData = metasData.filter(m => m.id !== id);
    saveLocalMetas();
  }

  loadMetas();
}