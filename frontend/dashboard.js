// Enterprise Warehouse Pro - Advanced Logic
const API_BASE = 'http://127.0.0.1:5000/api';
const userEmail = localStorage.getItem('userEmail');
const userName = localStorage.getItem('userName') || 'Employee';
const userRole = localStorage.getItem('userRole');
const userId = localStorage.getItem('userId');
const userToken = localStorage.getItem('userToken');

if (!userEmail) window.location.href = 'login.html';

document.getElementById('user-display').innerText = `${userName} (${userRole.toUpperCase()})`;
document.getElementById('company-name').innerText = 'Warelytics Inc.';

// State Management
let currentPage = 1;
let currentSearch = '';
let currentWarehouse = '';
let startDate = '';
let endDate = '';
let currentView = 'dashboard';
let targetId = null;

// Charts
let dailyChart, reasonChart;

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    initCharts();
    loadDashboardData();
    fetchAdvancedAnalytics();
    
    // Role based visibility
    if (userRole !== 'admin') {
        const adminBtn = document.getElementById('admin-add-btn');
        const adminCtrls = document.getElementById('admin-controls');
        if (adminBtn) adminBtn.style.display = 'none';
        if (adminCtrls) adminCtrls.style.display = 'none';
    }

    // Event Listeners for search & filters
    document.getElementById('search-input').addEventListener('input', debounce((e) => {
        currentSearch = e.target.value;
        currentPage = 1;
        loadReturns();
    }, 500));

    document.getElementById('filter-warehouse').addEventListener('change', (e) => {
        currentWarehouse = e.target.value;
        currentPage = 1;
        loadReturns();
    });

    document.getElementById('filter-start').addEventListener('change', (e) => {
        startDate = e.target.value;
        if (endDate) loadReturns();
    });

    document.getElementById('filter-end').addEventListener('change', (e) => {
        endDate = e.target.value;
        if (startDate) loadReturns();
    });
});

// View Management
function showView(view) {
    currentView = view;
    document.getElementById('dashboard-view').style.display = view === 'dashboard' ? 'block' : 'none';
    document.getElementById('kanban-view').style.display = view === 'kanban' ? 'block' : 'none';
    document.getElementById('analytics-section').style.display = view === 'dashboard' ? 'grid' : 'none';
    
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (view === 'kanban') loadKanban();
    else loadReturns();
}

// Data Fetching
async function loadDashboardData() {
    fetchStats();
    loadReturns();
}

async function fetchStats() {
    try {
        const [statsRes, analyticsRes] = await Promise.all([
            fetch(`${API_BASE}/stats`),
            fetch(`${API_BASE}/analytics/kpis`)
        ]);
        const stats = await statsRes.json();
        const kpis = await analyticsRes.json();

        document.getElementById('stat-total').innerText = stats.total;
        document.getElementById('stat-inspection').innerText = stats.Inspection;
        document.getElementById('stat-avg-time').innerText = kpis.avgProcessingTime;
        document.getElementById('stat-success').innerText = kpis.successRate;
        document.getElementById('stat-scrap-perc').innerText = kpis.scrapRate;
    } catch (e) { console.error('Stats loading failed', e); }
}

async function loadReturns() {
    const tbody = document.getElementById('returns-table');
    const url = `${API_BASE}/returns?page=${currentPage}&search=${currentSearch}&warehouse=${currentWarehouse}&startDate=${startDate}&endDate=${endDate}`;
    
    try {
        const res = await fetch(url);
        const result = await res.json();

        tbody.innerHTML = result.data.map(item => `
            <tr class="${item.isDelayed ? 'delayed' : ''}">
                <td>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        ${item.imageUrl ? `<img src="${API_BASE.replace('/api', '')}${item.imageUrl}" style="width:40px;height:40px;border-radius:0.5rem;object-fit:cover;">` : '<i class="fa-solid fa-box" style="font-size:1.5rem;color:var(--text-dim)"></i>'}
                        <div>
                            <strong>${item.productName}</strong><br>
                            <small style="color:var(--text-dim)">#${item._id.slice(-6)}</small> • 
                            <span class="cat-badge cat-${(item.category || 'others').toLowerCase()}">${item.category || 'Others'}</span>
                        </div>
                    </div>
                </td>
                <td style="font-weight:700;">$${item.productValue || '0'}</td>
                <td>
                    <span style="font-size:0.8rem;"><i class="fa-solid fa-warehouse"></i> ${item.warehouse}</span><br>
                    <small style="color:var(--text-dim)">Sec: ${item.section || 'N/A'} • Rack: ${item.rack || 'N/A'}</small>
                </td>
                <td style="font-size: 0.8rem;">
                    <span title="Return Date">Ret: ${new Date(item.returnDate).toLocaleDateString()}</span><br>
                    <span style="color:var(--text-dim)">Age: ${Math.floor((new Date() - new Date(item.returnDate))/(1000*3600*24))} days</span>
                </td>
                <td><span class="badge st-${item.status.toLowerCase()}">${item.status}</span></td>
                <td>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-auth" style="padding:0.4rem; font-size:0.7rem; background:rgba(99,102,241,0.2); color:var(--primary);" title="Auto Suggest Decision" onclick="requestDecision('${item._id}')"><i class="fa-solid fa-robot"></i></button>
                        <button class="btn-auth" style="padding:0.4rem; font-size:0.7rem;" onclick="autoMove('${item._id}')"><i class="fa-solid fa-forward"></i></button>
                        ${userRole === 'admin' ? `<button class="btn-auth" style="padding:0.4rem; font-size:0.7rem; background:rgba(239,68,68,0.2); color:var(--scrap);" onclick="deleteItem('${item._id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        renderPagination(result.totalPages);
    } catch (e) { console.error('Returns failed to load', e); }
}

// Kanban Logic
async function loadKanban() {
    const statuses = ['Received', 'Inspection', 'Repair', 'Resale', 'Scrap'];
    try {
        const res = await fetch(`${API_BASE}/returns?limit=100`);
        const result = await res.json();
        
        statuses.forEach(status => {
            const col = document.querySelector(`#col-${status.toLowerCase()} .kanban-items`);
            const items = result.data.filter(i => i.status === status);
            col.innerHTML = items.map(item => `
                <div class="kanban-item ${item.isDelayed ? 'delayed' : ''}" draggable="true" ondragstart="drag(event, '${item._id}')">
                    <strong>${item.productName}</strong><br>
                    <small>$${item.productValue || 0} • ${item.warehouse}</small>
                </div>
            `).join('');
        });
    } catch (e) { console.error('Kanban load failed', e); }
}

// Drag and Drop
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev, id) { ev.dataTransfer.setData("text", id); }
async function drop(ev, newStatus) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text");
    await updateStatus(id, newStatus);
    loadKanban();
}

async function updateStatus(id, status) {
    try {
        await fetch(`${API_BASE}/returns/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, workerId: userId })
        });
        showNotification(`Moved item to ${status}`);
    } catch (e) { console.error('Move failed', e); }
}

// Decision AI logic
async function requestDecision(id) {
    targetId = id;
    try {
        const res = await fetch(`${API_BASE}/returns/${id}/suggest`);
        const { suggestion } = await res.json();
        
        const modal = document.getElementById('decision-modal');
        document.getElementById('decision-prompt').innerText = `Based on product value and reason analysis, the system suggests moving this item to: ${suggestion.toUpperCase()}`;
        
        const options = document.getElementById('decision-options');
        options.innerHTML = `
            <button class="btn-auth" onclick="confirmDecision('${suggestion}')">Accept Suggestion (${suggestion})</button>
            <button class="btn-auth" style="background:#64748b;" onclick="closeModals()">Discard Selection</button>
        `;
        modal.style.display = 'flex';
    } catch (e) { console.error('Decision failed', e); }
}

async function confirmDecision(status) {
    await updateStatus(targetId, status);
    closeModals();
    loadReturns();
}

async function autoMove(id) {
    try {
        const res = await fetch(`${API_BASE}/returns/${id}/auto-move`, { method: 'POST' });
        if (res.ok) {
            showNotification('Status advanced automatically');
            loadReturns();
        } else {
            const err = await res.json();
            alert(err.message);
        }
    } catch (e) {}
}

// Analytics Charts
function initCharts() {
    const ctxD = document.getElementById('dailyChart').getContext('2d');
    const ctxR = document.getElementById('reasonChart').getContext('2d');

    const commonOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-main') } } }
    };

    dailyChart = new Chart(ctxD, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Return Trend (Daily)', data: [], borderColor: '#6366f1', borderWidth: 2, tension: 0.4, fill: true, backgroundColor: 'rgba(99,102,241,0.1)' }] },
        options: commonOptions
    });

    reasonChart = new Chart(ctxR, {
        type: 'doughnut',
        data: { 
            labels: [], 
            datasets: [{ 
                data: [], 
                backgroundColor: [
                    '#6366f1', // Indigo
                    '#10b981', // Emerald
                    '#f43f5e', // Rose
                    '#f59e0b', // Amber
                    '#0ea5e9', // Sky
                    '#d946ef'  // Fuchsia
                ],
                borderWidth: 0,
                hoverOffset: 20
            }] 
        },
        options: {
            ...commonOptions,
            cutout: '70%',
            plugins: {
                ...commonOptions.plugins,
                legend: { position: 'right', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-main'), usePointStyle: true, padding: 20 } }
            }
        }
    });
}

async function fetchAdvancedAnalytics() {
    try {
        const res = await fetch(`${API_BASE}/analytics/advanced`);
        const data = await res.json();

        document.getElementById('prediction-text').innerText = `Global returns are ${data.trend.toLowerCase()} compared to previous cycle. Most active facility is ${data.activeWarehouse._id}.`;

        // Update charts
        const resD = await fetch(`${API_BASE}/chart/daily`);
        const dataD = await resD.json();
        dailyChart.data.labels = dataD.map(i => i._id);
        dailyChart.data.datasets[0].data = dataD.map(i => i.count);
        dailyChart.update();

        reasonChart.data.labels = data.reasonDist.map(i => i._id);
        reasonChart.data.datasets[0].data = data.reasonDist.map(i => i.count);
        reasonChart.update();

        // Populate lists
        document.getElementById('top-products-list').innerHTML = data.topProducts.map((p, i) => `
            <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span>${i+1}. ${p._id}</span>
                <span style="color:var(--primary); font-weight:700;">${p.count}</span>
            </div>
        `).join('');

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const peakDay = data.peakDays[0] ? days[data.peakDays[0]._id - 1] : 'N/A';
        document.getElementById('facility-highlights').innerHTML = `
            <div style="margin-bottom:1rem;"><strong>Most Overloaded Warehouse:</strong> ${data.activeWarehouse._id} (${data.activeWarehouse.count} items)</div>
            <div><strong>Peak Return Flow Day:</strong> ${peakDay}</div>
            <div style="margin-top:1rem; font-size:0.8rem; color:var(--text-dim);">Report suggests staffing up on ${peakDay}s.</div>
        `;
    } catch (e) { console.error('Advanced analytics failed', e); }
}


// Exports
function exportReport(type) {
    window.location.href = `${API_BASE}/export/${type}`;
}

// UI Helpers
function openAddModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeModals() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }

document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    // Add manual fields if not in form
    formData.append('productName', document.getElementById('add-name').value);
    formData.append('productValue', document.getElementById('add-value').value);
    formData.append('category', document.getElementById('add-category').value);
    formData.append('warehouse', document.getElementById('add-warehouse').value);
    formData.append('returnReason', document.getElementById('add-reason').value);
    formData.append('section', document.getElementById('add-section').value);
    formData.append('rack', document.getElementById('add-rack').value);
    formData.append('manufactureDate', document.getElementById('add-mfg').value);
    formData.append('returnDate', new Date().toISOString());
    
    // File
    const imageInput = document.getElementById('add-image');
    if (imageInput.files[0]) formData.append('image', imageInput.files[0]);

    try {
        const res = await fetch(`${API_BASE}/returns/add`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        if (res.ok) {
            closeModals();
            loadDashboardData();
            showNotification('New return logged successfully');
            e.target.reset();
        }
    } catch (e) {}
});

function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const target = current === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
    location.reload(); // Refresh to update chart colors properly
}

function applyTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', saved);
}

function renderPagination(total) {
    const container = document.getElementById('pagination');
    if (total <= 1) { container.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= total; i++) {
        html += `<button class="btn-auth" style="width: 35px; background: ${i === currentPage ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; padding:0.5rem;" onclick="switchPage(${i})">${i}</button>`;
    }
    container.innerHTML = html;
}

function switchPage(p) { currentPage = p; loadReturns(); }

function logout() { localStorage.clear(); window.location.href = 'login.html'; }

function showNotification(msg) {
    // Simple custom alert would be better but keeping it simple for now
    console.log(msg);
}

function debounce(fn, t) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), t);
    };
}

async function deleteItem(id) {
    if (!confirm('Destroy record?')) return;
    await fetch(`${API_BASE}/returns/${id}`, { method: 'DELETE' });
    loadReturns();
}