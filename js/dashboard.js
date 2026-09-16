/**
 * Dashboard Dynamic Loader
 * data/*.json から情報を非同期取得し、ホーム画面（ダッシュボード）を自動描画します。
 */

// ヘルパー：HTMLエスケープ
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 1. 次回の予定（schedule.json または window.ICIRCLE_EVENTS）
async function initNextEvent() {
    const container = document.getElementById('next-event');
    if (!container) return;

    let events = window.ICIRCLE_EVENTS || [];
    try {
        const res = await fetch('data/schedule.json');
        if (res.ok) {
            events = await res.json();
            window.ICIRCLE_EVENTS = events;
        }
    } catch (_err) {
        // fetchが失敗した場合はフォールバック
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = events.find((event) => new Date(`${event.date}T23:59:59`) >= today);

    if (!next) {
        container.innerHTML = '<div class="next-event-details"><h3>次回予定は準備中です</h3><p>最新情報はスケジュールページをご確認ください。</p></div>';
        return;
    }

    const date = new Date(`${next.date}T00:00:00`);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const timeInfo = next.time ? ` <span class="event-time" style="font-size:0.9rem; color:#64748b;">${escapeHtml(next.time)}</span>` : '';
    
    container.innerHTML = `
        <div class="next-event-date"><strong>${date.getDate()}</strong><span>${date.getMonth() + 1}月・${weekdays[date.getDay()]}曜日</span></div>
        <div class="next-event-details">
            <h3>${escapeHtml(next.title)}${timeInfo}</h3>
            <p>${escapeHtml(next.detail)}</p>
            <div class="next-event-actions">
                <a class="calendar-button calendar-button-light" href="${window.ICircleCalendar?.googleUrl(next) || '#'}" target="_blank" rel="noopener noreferrer">Googleカレンダーに追加</a>
                <button class="calendar-button calendar-button-light" type="button">端末のカレンダーに追加</button>
            </div>
        </div>`;
    container.querySelector('button')?.addEventListener('click', () => window.ICircleCalendar?.downloadIcs(next));
}

// 2. 今月の目標・今週の担当（assignments.json）
async function initAssignments() {
    const list = document.getElementById('monthly-focus-list');
    if (!list) return;

    try {
        const res = await fetch('data/assignments.json');
        if (!res.ok) return;
        const data = await res.json();

        if (data.monthLabel) {
            const kicker = document.getElementById('monthly-kicker');
            if (kicker) kicker.textContent = data.monthLabel;
        }

        const dutyClass = data.isDutyRegistered ? '' : ' class="unregistered"';
        list.innerHTML = `
            <div><dt>今月の行動目標</dt><dd>${escapeHtml(data.monthlyGoal || '未設定')}</dd></div>
            <div><dt>今週の担当</dt><dd${dutyClass}>${escapeHtml(data.weeklyDuty || '未登録')}</dd></div>
        `;

        if (data.note) {
            const note = document.getElementById('monthly-note');
            if (note) note.textContent = data.note;
        }
        if (data.resourceLink) {
            const link = document.getElementById('monthly-resource-link');
            if (link) link.href = data.resourceLink;
        }
    } catch (_err) {}
}

// 3. 最新のお知らせ（news.json）
async function initLatestNews() {
    const list = document.getElementById('latest-news-list');
    if (!list) return;

    try {
        const res = await fetch('data/news.json');
        if (!res.ok) return;
        const newsItems = await res.json();
        if (!Array.isArray(newsItems) || !newsItems.length) return;

        list.innerHTML = newsItems.slice(0, 4).map(item => {
            const dateStr = escapeHtml(item.date ? item.date.replace(/-/g, '.') : '');
            const badgeClass = escapeHtml(item.badgeClass || 'badge-update');
            const typeLabel = escapeHtml(item.typeLabel || item.type || 'INFO');
            const title = escapeHtml(item.title);
            const isNew = item.isNew ? '<span class="new-label" style="background:#ef4444; color:#fff; font-size:0.7rem; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:bold;">NEW</span>' : '';

            if (item.url) {
                return `
                    <li class="news-item">
                        <a href="${escapeHtml(item.url)}" class="news-link">
                            <div class="news-meta">
                                <time datetime="${escapeHtml(item.date)}">${dateStr}</time>
                                <span class="badge ${badgeClass}">${typeLabel}</span>
                                ${isNew}
                            </div>
                            <h3 class="news-title">${title}</h3>
                        </a>
                    </li>
                `;
            } else {
                return `
                    <li class="news-item">
                        <div class="news-static">
                            <div class="news-meta">
                                <time datetime="${escapeHtml(item.date)}">${dateStr}</time>
                                <span class="badge ${badgeClass}">${typeLabel}</span>
                                ${isNew}
                            </div>
                            <h3 class="news-title">${title}</h3>
                        </div>
                    </li>
                `;
            }
        }).join('');
    } catch (_err) {}
}

// 4. 最近追加されたノウハウ（knowledge.json）
async function initLatestKnowledge() {
    const grid = document.getElementById('latest-knowledge-grid');
    if (!grid) return;

    try {
        const res = await fetch('data/knowledge.json');
        if (!res.ok) return;
        const items = await res.json();
        if (!Array.isArray(items) || !items.length) return;

        grid.innerHTML = items.slice(0, 3).map(item => {
            const isNew = item.isNew ? '<span class="new-label">NEW</span>' : '';
            const displayDate = escapeHtml(item.displayDate || item.date || '');
            const badgeClass = escapeHtml(item.badgeClass || 'badge-purple');
            const category = escapeHtml(item.category || 'ノウハウ');
            const title = escapeHtml(item.title);
            const url = escapeHtml(item.url);

            return `
                <article class="recent-knowledge-card">
                    <div class="knowledge-update-meta">
                        ${isNew}
                        <time datetime="${escapeHtml(item.date)}">${displayDate}</time>
                    </div>
                    <span class="category badge-custom ${badgeClass}">${category}</span>
                    <h3>${title}</h3>
                    <a href="${url}">詳しく見る →</a>
                </article>
            `;
        }).join('');
    } catch (_err) {}
}

// 5. 最近見たノウハウ（閲覧履歴 / localStorage）
function initRecentlyViewed() {
    const container = document.getElementById('recently-viewed-list');
    if (!container) return;

    let recentItems = [];
    let readItems = new Set();
    try {
        const savedHistory = JSON.parse(localStorage.getItem('icircle-knowledge-history') || '[]');
        const savedRead = JSON.parse(localStorage.getItem('icircle-knowledge-read') || '[]');
        recentItems = Array.isArray(savedHistory) ? savedHistory.slice(0, 3) : [];
        readItems = new Set(Array.isArray(savedRead) ? savedRead : []);
    } catch (_error) {}

    container.replaceChildren();
    if (!recentItems.length) {
        const empty = document.createElement('p');
        empty.className = 'recently-viewed-empty';
        empty.textContent = 'ノウハウを読むと、ここからすぐ続きを開けます。';
        container.appendChild(empty);
        return;
    }

    recentItems.forEach((item) => {
        if (!item?.url || !item?.title) return;
        const card = document.createElement('article');
        card.className = 'recent-knowledge-card recently-viewed-card';
        const status = document.createElement('span');
        status.className = `read-status-badge${readItems.has(item.url) ? ' is-read' : ''}`;
        status.textContent = readItems.has(item.url) ? '✓ 読了済み' : '未読';
        const title = document.createElement('h3');
        title.textContent = item.title;
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = readItems.has(item.url) ? 'もう一度読む →' : '続きを読む →';
        card.append(status, title, link);
        container.appendChild(card);
    });
}

// 6. よく使う資料（resources.json）
async function initQuickLinks() {
    const list = document.getElementById('quick-links-list');
    if (!list) return;

    try {
        const res = await fetch('data/resources.json');
        if (!res.ok) return;
        const items = await res.json();
        if (!Array.isArray(items) || !items.length) return;

        list.innerHTML = items.slice(0, 3).map(item => `
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
                <span>${escapeHtml(item.icon || '📄')}</span>
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${escapeHtml(item.description)}</small>
                </div>
                <b>↗</b>
            </a>
        `).join('');
    } catch (_err) {}
}

// 7. 新しいプロンプト（prompts.json）
async function initRecentPrompts() {
    const list = document.getElementById('recent-prompts-list');
    if (!list) return;

    try {
        const res = await fetch('data/prompts.json');
        if (!res.ok) return;
        const items = await res.json();
        if (!Array.isArray(items) || !items.length) return;

        list.innerHTML = items.slice(0, 2).map(item => `
            <a href="prompts.html#${escapeHtml(item.id)}">
                <span class="dashboard-item-icon">${escapeHtml(item.icon || '✨')}</span>
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${escapeHtml(item.updated ? item.updated.replace(/-/g, '/') + '更新' : '')}</small>
                </div>
                <span>→</span>
            </a>
        `).join('');
    } catch (_err) {}
}

// DOMContentLoaded時に各ローダーを実行
document.addEventListener('DOMContentLoaded', () => {
    initNextEvent();
    initAssignments();
    initLatestNews();
    initLatestKnowledge();
    initRecentlyViewed();
    initQuickLinks();
    initRecentPrompts();
});
