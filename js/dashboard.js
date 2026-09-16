document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('next-event');
    if (!container) return;

    const events = [
        { date: '2026-09-18', title: 'あつくん質問ライブ', detail: 'テーマ：アカウント設計' },
        { date: '2026-09-21', title: 'えれな添削ライブ', detail: '添削ライブ' },
        { date: '2026-09-22', title: 'いつき質問ライブ', detail: 'oVice開催' },
        { date: '2026-09-24', title: 'りこぴん めざ5道場', detail: 'オンライン開催' },
        { date: '2026-09-25', title: 'コミュニティライブ', detail: '文化祭・最新情報を公開' },
        { date: '2026-09-26', title: '年払い限定 ZOOM交流会', detail: 'オンライン交流会' },
        { date: '2026-09-28', title: 'あつくん添削ライブ', detail: '添削ライブ' },
        { date: '2026-09-29', title: 'りこぴん質問ライブ', detail: 'テーマ：投稿' }
    ];
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
        <div class="next-event-details"><h3>${next.title}</h3><p>${next.detail}</p></div>`;
});
