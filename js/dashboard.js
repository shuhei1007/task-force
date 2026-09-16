document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('next-event');
    if (!container) return;

    const events = window.ICIRCLE_EVENTS || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = events.find((event) => new Date(`${event.date}T23:59:59`) >= today);

    if (!next) {
        container.innerHTML = '<div class="next-event-details"><h3>次回予定は準備中です</h3><p>最新情報はスケジュールページをご確認ください。</p></div>';
        return;
    }

    const date = new Date(`${next.date}T00:00:00`);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    container.innerHTML = `
        <div class="next-event-date"><strong>${date.getDate()}</strong><span>${date.getMonth() + 1}月・${weekdays[date.getDay()]}曜日</span></div>
        <div class="next-event-details"><h3>${next.title}</h3><p>${next.detail}</p><div class="next-event-actions"><a class="calendar-button calendar-button-light" href="${window.ICircleCalendar.googleUrl(next)}" target="_blank" rel="noopener noreferrer">Googleカレンダーに追加</a><button class="calendar-button calendar-button-light" type="button">端末のカレンダーに追加</button></div></div>`;
    container.querySelector('button')?.addEventListener('click', () => window.ICircleCalendar.downloadIcs(next));
});

document.addEventListener('DOMContentLoaded', () => {
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
});
