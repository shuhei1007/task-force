document.addEventListener('DOMContentLoaded', async () => {
    const input = document.getElementById('site-search-input');
    if (!input) return;

    const results = document.getElementById('site-search-results');
    const status = document.getElementById('site-search-status');
    const empty = document.getElementById('site-search-empty');
    const clear = document.getElementById('site-search-clear');
    const filters = Array.from(document.querySelectorAll('.site-search-filter'));
    const typeLabels = { knowledge: 'ノウハウ', prompt: 'プロンプト', radio: 'ラジオ', live: 'ライブ', member: 'メンバー' };
    let items = [];
    let activeType = 'all';

    function normalize(value) {
        return String(value || '').normalize('NFKC').toLocaleLowerCase('ja');
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
    }

    function isNew(date) {
        if (!date) return false;
        const days = (new Date() - new Date(`${date}T00:00:00`)) / 86400000;
        return days >= 0 && days <= 14;
    }

    function formatDate(date) {
        if (!date) return '';
        const [, month, day] = date.split('-');
        return `${Number(month)}月${Number(day)}日更新`;
    }

    function render() {
        const query = normalize(input.value.trim());
        const terms = query.split(/\s+/).filter(Boolean);
        const filtered = items
            .filter((item) => activeType === 'all' || item.type === activeType)
            .map((item) => {
                const title = normalize(item.title);
                const haystack = normalize([item.title, item.excerpt, item.tags?.join(' '), item.keywords].join(' '));
                if (!terms.every((term) => haystack.includes(term))) return null;
                const score = terms.reduce((total, term) => total + (title.includes(term) ? 10 : 1), 0);
                return { item, score };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score || String(b.item.updated).localeCompare(String(a.item.updated)));

        results.innerHTML = filtered.map(({ item }) => `
            <a class="search-result-card" href="${escapeHtml(item.url)}">
                <div class="search-result-top">
                    <span class="search-type-badge">${typeLabels[item.type]}</span>
                    ${isNew(item.updated) ? '<span class="new-label">NEW</span>' : ''}
                    <time class="search-result-date" datetime="${escapeHtml(item.updated || '')}">${formatDate(item.updated)}</time>
                </div>
                <h2>${escapeHtml(item.title)}</h2>
                <p class="search-result-description">${escapeHtml(item.excerpt || '')}</p>
                <p class="search-result-tags">${(item.tags || []).map((tag) => `#${escapeHtml(tag)}`).join(' ')}</p>
                <span class="search-result-arrow" aria-hidden="true">→</span>
            </a>`).join('');

        clear.hidden = !input.value;
        empty.hidden = filtered.length !== 0;
        status.textContent = query
            ? `${filtered.length}件見つかりました`
            : `全${filtered.length}件のコンテンツを新しい順に表示しています`;

        const url = new URL(window.location.href);
        if (input.value.trim()) url.searchParams.set('q', input.value.trim());
        else url.searchParams.delete('q');
        history.replaceState(null, '', url);
    }

    try {
        const response = await fetch('data/search-index.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        items = await response.json();
        input.value = new URLSearchParams(window.location.search).get('q') || '';
        render();
    } catch (_error) {
        status.textContent = '検索データを読み込めませんでした。ページを再読み込みしてください。';
        empty.hidden = false;
    }

    input.addEventListener('input', render);
    clear.addEventListener('click', () => {
        input.value = '';
        input.focus();
        render();
    });
    filters.forEach((button) => button.addEventListener('click', () => {
        activeType = button.dataset.type;
        filters.forEach((item) => {
            const selected = item === button;
            item.classList.toggle('active', selected);
            item.setAttribute('aria-pressed', String(selected));
        });
        render();
    }));
});
