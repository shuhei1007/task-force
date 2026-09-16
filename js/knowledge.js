document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('knowledge-search');
    if (!searchInput) return;

    const cards = Array.from(document.querySelectorAll('.page-container .card'));
    const filterButtons = Array.from(document.querySelectorAll('.knowledge-filter'));
    const clearButton = document.getElementById('knowledge-search-clear');
    const resetButton = document.getElementById('knowledge-reset');
    const result = document.getElementById('knowledge-result');
    const empty = document.getElementById('knowledge-empty');
    const favoriteStorageKey = 'icircle-knowledge-favorites';
    const today = new Date();

    const updateDates = {
        'info_2026_07.html': '2026-07-31',
        'info_2026_08.html': '2026-08-21',
        'info_2026_09.html': '2026-09-01',
        'guides/youtube-reels-5tips.html': '2026-09-16',
        'guides/worldview-guide.html': '2026-09-07',
        'guides/comment-dm-automation.html': '2026-09-07'
    };
    const addedItems = new Set([
        'guides/youtube-reels-5tips.html',
        'guides/comment-dm-automation.html'
    ]);

    let activeFilter = 'all';
    let favorites = readFavorites();

    function readFavorites() {
        try {
            const saved = JSON.parse(localStorage.getItem(favoriteStorageKey) || '[]');
            return new Set(Array.isArray(saved) ? saved : []);
        } catch (_error) {
            return new Set();
        }
    }

    function saveFavorites() {
        try {
            localStorage.setItem(favoriteStorageKey, JSON.stringify(Array.from(favorites)));
        } catch (_error) {
            // プライベートブラウズ等で保存できなくても、その場では操作を継続する
        }
    }

    function normalize(value) {
        return value.normalize('NFKC').toLocaleLowerCase('ja');
    }

    function getGroup(card) {
        const grid = card.closest('.grid');
        let heading = grid ? grid.previousElementSibling : null;
        while (heading && !heading.matches('.section-heading, .chapter-title')) {
            heading = heading.previousElementSibling;
        }
        const label = heading ? heading.textContent : '';
        if (label.includes('初級')) return 'beginner';
        if (label.includes('中級')) return 'intermediate';
        if (label.includes('マネタイズ')) return 'monetize';
        if (label.includes('外部インフルエンサー')) return 'influencer';
        if (label.includes('情報共有')) return 'info';
        if (label.includes('YouTube')) return 'youtube';
        return 'other';
    }

    function getTags(card) {
        const source = normalize(card.textContent);
        const tags = [];
        if (source.includes('リール') || source.includes('ショート動画')) tags.push('reel');
        if (source.includes('フィード')) tags.push('feed');
        if (source.includes('競合') || source.includes('リサーチ')) tags.push('competitor');
        if (source.includes('アカウント設計') || source.includes('コンセプト') || source.includes('プロフィール')) tags.push('account');
        if (source.includes('撮影') || source.includes('カメラ') || source.includes('機材')) tags.push('shooting');
        if (source.includes('法律') || source.includes('法務') || source.includes('著作権') || source.includes('薬機法')) tags.push('legal');
        return tags;
    }

    function isNew(dateString) {
        const updated = new Date(`${dateString}T00:00:00`);
        const elapsedDays = (today - updated) / 86400000;
        return elapsedDays >= 0 && elapsedDays <= 14;
    }

    cards.forEach((card) => {
        const link = card.querySelector('.card-link');
        const content = card.querySelector('.card-content');
        if (!link || !content) return;

        const href = link.getAttribute('href').split('?')[0];
        const updated = updateDates[href] || '2026-08-25';
        const title = card.querySelector('.card-title')?.textContent.trim() || href;

        card.dataset.href = href;
        card.dataset.group = getGroup(card);
        card.dataset.tags = getTags(card).join(' ');
        card.dataset.search = normalize(card.textContent);

        const favoriteButton = document.createElement('button');
        favoriteButton.type = 'button';
        favoriteButton.className = 'favorite-button';
        favoriteButton.innerHTML = '<span aria-hidden="true">☆</span>';
        favoriteButton.dataset.href = href;
        favoriteButton.setAttribute('aria-label', `「${title}」をお気に入りに追加`);
        favoriteButton.setAttribute('aria-pressed', 'false');
        card.appendChild(favoriteButton);

        const meta = document.createElement('div');
        meta.className = 'knowledge-update-meta';
        const [, month, day] = updated.split('-');
        const action = addedItems.has(href) ? '追加' : '更新';
        meta.innerHTML = `${isNew(updated) ? '<span class="new-label">NEW</span>' : ''}<time datetime="${updated}">${Number(month)}月${Number(day)}日${action}</time>`;
        content.insertBefore(meta, link);

        favoriteButton.addEventListener('click', () => {
            if (favorites.has(href)) favorites.delete(href);
            else favorites.add(href);
            saveFavorites();
            updateFavoriteButtons();
            if (activeFilter === 'favorites') applyFilters();
        });
    });

    function updateFavoriteButtons() {
        document.querySelectorAll('.favorite-button').forEach((button) => {
            const selected = favorites.has(button.dataset.href);
            const title = button.closest('.card')?.querySelector('.card-title')?.textContent.trim() || 'このノウハウ';
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
            button.setAttribute('aria-label', selected
                ? `「${title}」をお気に入りから削除`
                : `「${title}」をお気に入りに追加`);
            button.querySelector('span').textContent = selected ? '★' : '☆';
        });
    }

    function updateSectionVisibility() {
        const grids = Array.from(document.querySelectorAll('.page-container .grid'));
        grids.forEach((grid) => {
            const hasVisibleCard = Array.from(grid.querySelectorAll('.card')).some((card) => !card.hidden);
            grid.hidden = !hasVisibleCard;
        });

        document.querySelectorAll('.chapter-title').forEach((heading) => {
            const grid = heading.nextElementSibling;
            heading.hidden = !grid || grid.hidden;
        });

        document.querySelectorAll('.section-heading').forEach((heading) => {
            let sibling = heading.nextElementSibling;
            let hasVisibleCard = false;
            while (sibling && !sibling.matches('.section-heading')) {
                if (sibling.matches('.grid') && !sibling.hidden) hasVisibleCard = true;
                sibling = sibling.nextElementSibling;
            }
            heading.hidden = !hasVisibleCard;
        });
    }

    function applyFilters() {
        const query = normalize(searchInput.value.trim());
        let visibleCount = 0;

        cards.forEach((card) => {
            const matchesSearch = !query || card.dataset.search.includes(query);
            const matchesFilter = activeFilter === 'all'
                || (activeFilter === 'favorites'
                    ? favorites.has(card.dataset.href)
                    : activeFilter.startsWith('tag:')
                        ? card.dataset.tags.split(' ').includes(activeFilter.slice(4))
                        : card.dataset.group === activeFilter);
            const visible = matchesSearch && matchesFilter;
            card.hidden = !visible;
            if (visible) visibleCount += 1;
        });

        clearButton.hidden = !searchInput.value;
        empty.hidden = visibleCount !== 0;
        result.textContent = `${visibleCount}件のノウハウを表示中`;
        updateSectionVisibility();
    }

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeFilter = button.dataset.filter;
            filterButtons.forEach((item) => {
                const selected = item === button;
                item.classList.toggle('active', selected);
                item.setAttribute('aria-pressed', String(selected));
            });
            applyFilters();
        });
    });

    searchInput.addEventListener('input', applyFilters);
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        applyFilters();
    });
    resetButton.addEventListener('click', () => {
        searchInput.value = '';
        activeFilter = 'all';
        filterButtons.forEach((button) => {
            const selected = button.dataset.filter === 'all';
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
        applyFilters();
        searchInput.focus();
    });

    updateFavoriteButtons();
    applyFilters();
});
