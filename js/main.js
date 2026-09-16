const ICIRCLE_EVENTS = [
    { date: '2026-09-18', title: 'あつくん質問ライブ', detail: 'テーマ：アカウント設計' },
    { date: '2026-09-21', title: 'えれな添削ライブ', detail: '添削ライブ' },
    { date: '2026-09-22', title: 'いつき質問ライブ', detail: 'oVice開催' },
    { date: '2026-09-24', title: 'りこぴん めざ5道場', detail: 'オンライン開催' },
    { date: '2026-09-25', title: 'コミュニティライブ', detail: '文化祭・最新情報を公開' },
    { date: '2026-09-26', title: '年払い限定 ZOOM交流会', detail: 'オンライン交流会' },
    { date: '2026-09-28', title: 'あつくん添削ライブ', detail: '添削ライブ' },
    { date: '2026-09-29', title: 'りこぴん質問ライブ', detail: 'テーマ：投稿' }
];

window.ICIRCLE_EVENTS = ICIRCLE_EVENTS;
window.ICircleCalendar = {
    googleUrl(event) {
        const start = event.date.replaceAll('-', '');
        const endDate = new Date(`${event.date}T00:00:00`);
        endDate.setDate(endDate.getDate() + 1);
        const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.title,
            dates: `${start}/${end}`,
            details: `${event.detail}\n9期生強化チームポータルサイトから追加`
        });
        return `https://calendar.google.com/calendar/render?${params}`;
    },
    downloadIcs(event) {
        const escapeIcs = (value) => value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
        const start = event.date.replaceAll('-', '');
        const endDate = new Date(`${event.date}T00:00:00`);
        endDate.setDate(endDate.getDate() + 1);
        const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const content = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//InstaCircle//Portal//JA',
            'BEGIN:VEVENT', `UID:${event.date}-${encodeURIComponent(event.title)}@icircle-portal`,
            `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`,
            `SUMMARY:${escapeIcs(event.title)}`, `DESCRIPTION:${escapeIcs(event.detail)}`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\r\n');
        const blobUrl = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${event.date}-${event.title.replace(/[\\/:*?"<>|]/g, '-')}.ics`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // 外部ライブラリの読み込みに失敗しても、ナビゲーションなどは動作させる
    if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
    }

    initSplash();
    initCarousel();
    initScheduleMonthTabs();
    initContentUpdates();
    initKnowledgeReading();
    initScheduleCalendar();
    initRequestForm();
    animatePageContent();

    // Splash Screen Animation
    function initSplash() {
        const splashContainer = document.querySelector('.splash-container');
        if (!splashContainer) return;

        // アニメーションはCSSだけで開始し、外部ライブラリの読み込みを待たない
        splashContainer.classList.add('splash-ready');
    }
    
    function initCarousel() {
        const track = document.getElementById("members-track");
        if (!track) return;
        
        const slides = Array.from(track.querySelectorAll(".carousel-slide"));
        const thumbnails = Array.from(document.querySelectorAll(".thumb-btn"));
        const prevBtn = document.querySelector(".prev-btn");
        const nextBtn = document.querySelector(".next-btn");
        
        if (slides.length === 0) return;
        
        let currentIndex = 0;
        const totalSlides = slides.length;
        
        function updateCarousel(index) {
            // Bounds
            if (index < 0) index = 0;
            if (index >= totalSlides) index = totalSlides - 1;
            currentIndex = index;
            
            // Transform track
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // Update active states
            slides.forEach((slide, i) => {
                slide.classList.toggle("active-slide", i === currentIndex);
            });
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle("active", i === currentIndex);
            });
            
            // Disable/Enable buttons
            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex === totalSlides - 1;
        }
        
        // Thumbnail clicks
        thumbnails.forEach((thumb) => {
            thumb.addEventListener("click", () => {
                const index = parseInt(thumb.getAttribute("data-index"), 10);
                updateCarousel(index);
            });
        });
        
        // Prev/Next clicks
        if (prevBtn) {
            prevBtn.addEventListener("click", () => {
                updateCarousel(currentIndex - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener("click", () => {
                updateCarousel(currentIndex + 1);
            });
        }
        
        // 検索結果のアンカーから該当メンバーを直接表示する
        slides.forEach((slide, index) => { slide.id = `member-${index + 1}`; });
        const memberMatch = window.location.hash.match(/^#member-(\d+)$/);
        const initialIndex = memberMatch ? Math.min(Number(memberMatch[1]) - 1, totalSlides - 1) : 0;

        // Initial setup (no GSAP re-trigger — avoids flicker)
        updateCarousel(Math.max(initialIndex, 0));
    }

    function initScheduleMonthTabs() {
        const tabs = Array.from(document.querySelectorAll(".month-tab"));
        const img = document.getElementById("icircle-schedule-img");
        if (!tabs.length || !img) return;

        const monthLabels = { "08": "8月", "09": "9月" };

        function showMonth(month) {
            const src = img.getAttribute(`data-src-${month}`);
            if (!src) return;
            img.src = src;
            img.alt = `iサークル ${monthLabels[month] || month}の予定`;
            tabs.forEach((tab) => {
                const active = tab.getAttribute("data-month") === month;
                tab.classList.toggle("active", active);
                tab.setAttribute("aria-selected", active ? "true" : "false");
            });
        }

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                showMonth(tab.getAttribute("data-month"));
            });
        });

        // Default to current month when available
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
        if (img.getAttribute(`data-src-${currentMonth}`)) {
            showMonth(currentMonth);
        }
    }

    function initContentUpdates() {
        const currentPage = window.location.pathname.split('/').pop();
        const dates = {
            'live_meetup_2026_09_nagoya.html': '2026-09-16',
            'live_review_2026_09.html': '2026-09-07',
            'live_kai9_exchange.html': '2026-09-07',
            'info_2026_09.html': '2026-09-01',
            'radio_2026_09.html': '2026-09-15',
            'radio_2026_08.html': '2026-08-31'
        };

        if (currentPage === 'live.html' || currentPage === 'radio.html') {
            document.querySelectorAll('.card').forEach((card) => {
                const link = card.querySelector('.card-link');
                const content = card.querySelector('.card-content');
                if (!link || !content || content.querySelector('.knowledge-update-meta')) return;
                const href = link.getAttribute('href').split('?')[0];
                const updated = dates[href] || '2026-08-25';
                const age = (new Date() - new Date(`${updated}T00:00:00`)) / 86400000;
                const meta = document.createElement('div');
                meta.className = 'knowledge-update-meta';
                const [, month, day] = updated.split('-');
                meta.innerHTML = `${age >= 0 && age <= 14 ? '<span class="new-label">NEW</span>' : ''}<time datetime="${updated}">${Number(month)}月${Number(day)}日更新</time>`;
                content.insertBefore(meta, link);
            });
        }

        // ラジオ検索結果から日別カードへ直接ジャンプできるようにする
        document.querySelectorAll('.radio-day').forEach((day) => {
            const pageTitle = document.querySelector('.article-header h1')?.textContent || '';
            const year = pageTitle.match(/(\d{4})年/)?.[1] || '2026';
            const dateLabel = day.querySelector('.radio-day-meta')?.textContent.trim();
            const [month, date] = (dateLabel || '').split('/');
            if (month && date) {
                const isoDate = `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
                day.id = `radio-${isoDate}`;
                const age = (new Date() - new Date(`${isoDate}T00:00:00`)) / 86400000;
                const title = day.querySelector('.radio-day-title');
                if (title && age >= 0 && age <= 7 && !title.querySelector('.radio-new-label')) {
                    title.insertAdjacentHTML('beforeend', '<span class="radio-new-label">NEW</span>');
                }
            }
        });
        const anchoredRadio = document.querySelector(window.location.hash?.startsWith('#radio-') ? window.location.hash : ':not(*)');
        if (anchoredRadio) {
            anchoredRadio.open = true;
            requestAnimationFrame(() => anchoredRadio.scrollIntoView({ block: 'start' }));
        }

        if (currentPage === 'prompts.html') initPromptFavorites();
    }

    function initKnowledgeReading() {
        const article = document.querySelector('.article-content');
        const articleHeader = document.querySelector('.article-header');
        if (!article || !articleHeader) return;

        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const fileName = pathParts.at(-1) || '';
        const isGuide = pathParts.lastIndexOf('guides') >= 0;
        const isKnowledgeInfo = /^info_\d{4}_\d{2}\.html$/.test(fileName);
        if (!isGuide && !isKnowledgeInfo) return;

        const storageUrl = isGuide ? `guides/${fileName}` : fileName;
        const title = articleHeader.querySelector('h1')?.textContent.trim() || document.title;
        const historyKey = 'icircle-knowledge-history';
        const readKey = 'icircle-knowledge-read';
        const readArray = (key) => {
            try {
                const value = JSON.parse(localStorage.getItem(key) || '[]');
                return Array.isArray(value) ? value : [];
            } catch (_error) {
                return [];
            }
        };
        const readItems = new Set(readArray(readKey));

        const historyItems = readArray(historyKey).filter((item) => item && item.url !== storageUrl);
        historyItems.unshift({ url: storageUrl, title, visitedAt: new Date().toISOString() });
        try { localStorage.setItem(historyKey, JSON.stringify(historyItems.slice(0, 20))); } catch (_error) {}

        const statusBar = document.createElement('div');
        statusBar.className = 'reading-status-bar';
        const status = document.createElement('span');
        status.className = 'read-status-badge';
        status.setAttribute('role', 'status');
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'reading-status-toggle';
        statusBar.append(status, toggle);
        articleHeader.insertAdjacentElement('afterend', statusBar);

        function updateStatus() {
            const isRead = readItems.has(storageUrl);
            status.textContent = isRead ? '✓ 読了済み' : '未読';
            status.classList.toggle('is-read', isRead);
            toggle.textContent = isRead ? '未読に戻す' : '読了済みにする';
            toggle.setAttribute('aria-label', `「${title}」を${isRead ? '未読に戻す' : '読了済みにする'}`);
        }

        function saveRead(isRead) {
            if (isRead) readItems.add(storageUrl);
            else readItems.delete(storageUrl);
            try { localStorage.setItem(readKey, JSON.stringify([...readItems])); } catch (_error) {}
            updateStatus();
        }

        toggle.addEventListener('click', () => saveRead(!readItems.has(storageUrl)));
        updateStatus();

        const headings = Array.from(article.querySelectorAll('h2')).filter((heading) => {
            return !heading.closest('.article-toc') && heading.textContent.trim();
        });
        if (headings.length >= 2) {
            const toc = document.createElement('nav');
            toc.className = 'article-toc';
            toc.setAttribute('aria-label', 'この記事の目次');
            const details = document.createElement('details');
            details.open = true;
            const summary = document.createElement('summary');
            summary.innerHTML = '<span>目次</span><small>項目を押すと移動します</small>';
            const list = document.createElement('ol');

            headings.forEach((heading, index) => {
                if (!heading.id) heading.id = `section-${index + 1}`;
                heading.classList.add('article-anchor-heading');
                const item = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${heading.id}`;
                link.textContent = heading.textContent.trim();
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    const parentDetails = heading.closest('details');
                    if (parentDetails) parentDetails.open = true;
                    history.replaceState(null, '', `#${heading.id}`);
                    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                item.appendChild(link);
                list.appendChild(item);
            });
            details.append(summary, list);
            toc.appendChild(details);
            statusBar.insertAdjacentElement('afterend', toc);
        }

        const sentinel = document.createElement('div');
        sentinel.className = 'reading-complete-sentinel';
        sentinel.setAttribute('aria-hidden', 'true');
        article.appendChild(sentinel);
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    saveRead(true);
                    observer.disconnect();
                }
            }, { threshold: 1 });
            observer.observe(sentinel);
        }
    }

    function createCalendarActions(event) {
        const google = document.createElement('a');
        google.className = 'calendar-button calendar-button-google';
        google.href = window.ICircleCalendar.googleUrl(event);
        google.target = '_blank';
        google.rel = 'noopener noreferrer';
        google.textContent = 'Googleカレンダーに追加';
        const device = document.createElement('button');
        device.type = 'button';
        device.className = 'calendar-button';
        device.textContent = '端末のカレンダーに追加';
        device.addEventListener('click', () => window.ICircleCalendar.downloadIcs(event));
        return [google, device];
    }

    function initScheduleCalendar() {
        const body = document.querySelector('.schedule-table tbody');
        if (!body) return;
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        ICIRCLE_EVENTS.forEach((event) => {
            const date = new Date(`${event.date}T00:00:00`);
            const row = document.createElement('tr');
            const dateCell = document.createElement('td');
            dateCell.className = 'date-cell';
            dateCell.textContent = `${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
            const detailCell = document.createElement('td');
            const title = document.createElement('strong');
            title.textContent = event.title;
            const detail = document.createElement('small');
            detail.textContent = event.detail;
            detailCell.append(title, detail);
            const actionCell = document.createElement('td');
            actionCell.className = 'calendar-actions-cell';
            actionCell.append(...createCalendarActions(event));
            row.append(dateCell, detailCell, actionCell);
            body.appendChild(row);
        });
    }

    function initRequestForm() {
        const requestPage = document.querySelector('[data-google-form-url]');
        if (!requestPage) return;
        const formUrl = requestPage.dataset.googleFormUrl?.trim();
        const link = document.getElementById('request-form-link');
        const note = document.getElementById('request-form-note');
        if (!link) return;
        if (formUrl) {
            link.href = formUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.removeAttribute('aria-disabled');
            link.classList.remove('is-disabled');
            if (note) note.textContent = 'フォームは別タブで開きます。';
        } else {
            link.addEventListener('click', (event) => event.preventDefault());
        }
    }

    function initPromptFavorites() {
        const storageKey = 'icircle-prompt-favorites';
        let favorites;
        try { favorites = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
        catch (_error) { favorites = new Set(); }

        const sections = Array.from(document.querySelectorAll('.prompt-section'));
        const intro = document.querySelector('.page-container > p');
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'prompt-favorites-toggle';
        toggle.textContent = '★ 保存済みだけ表示';
        toggle.setAttribute('aria-pressed', 'false');
        if (intro) intro.insertAdjacentElement('afterend', toggle);

        let savedOnly = false;
        sections.forEach((section) => {
            const header = section.querySelector('.prompt-header');
            const promptId = section.querySelector('.prompt-box')?.id;
            const title = section.querySelector('h2')?.textContent.trim() || 'プロンプト';
            if (!header || !promptId) return;

            section.id = `section-${promptId}`;
            const actions = document.createElement('div');
            actions.className = 'prompt-header-actions';
            const existingCopy = header.querySelector('.copy-btn');
            const save = document.createElement('button');
            save.type = 'button';
            save.className = 'prompt-save-btn';
            save.dataset.promptId = promptId;
            actions.append(save, existingCopy);
            header.appendChild(actions);

            const meta = document.createElement('div');
            meta.className = 'prompt-update-meta';
            meta.innerHTML = '<time datetime="2026-08-25">8月25日更新</time>';
            header.insertAdjacentElement('afterend', meta);

            function updateSaveButton() {
                const selected = favorites.has(promptId);
                save.textContent = selected ? '★ 保存済み' : '☆ 保存';
                save.classList.toggle('active', selected);
                save.setAttribute('aria-pressed', String(selected));
                save.setAttribute('aria-label', `「${title}」を${selected ? '保存から削除' : '保存'}`);
            }
            save.addEventListener('click', () => {
                if (favorites.has(promptId)) favorites.delete(promptId);
                else favorites.add(promptId);
                try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch (_error) {}
                updateSaveButton();
                if (savedOnly) section.hidden = !favorites.has(promptId);
            });
            updateSaveButton();
        });

        toggle.addEventListener('click', () => {
            savedOnly = !savedOnly;
            toggle.classList.toggle('active', savedOnly);
            toggle.setAttribute('aria-pressed', String(savedOnly));
            toggle.textContent = savedOnly ? 'すべてのプロンプトを表示' : '★ 保存済みだけ表示';
            sections.forEach((section) => {
                const promptId = section.querySelector('.prompt-box')?.id;
                section.hidden = savedOnly && !favorites.has(promptId);
            });
        });
    }

    function animatePageContent() {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        // No entrance motion: nested .gs-reveal + .gs-item y-animation
        // looked like the page "shaking/sinking" when opening monthly info pages.
        const revealEl = appContainer.querySelector(".gs-reveal");
        const listItems = Array.from(appContainer.querySelectorAll(".gs-item")).filter((el) => {
            const slide = el.closest(".carousel-slide");
            return !slide || slide.classList.contains("active-slide");
        });

        if (!window.gsap) return;
        if (revealEl) window.gsap.set(revealEl, { clearProps: "opacity,transform" });
        if (listItems.length > 0) window.gsap.set(listItems, { clearProps: "opacity,transform" });
        appContainer.querySelectorAll(".carousel-slide:not(.active-slide) .gs-item").forEach((el) => {
            window.gsap.set(el, { clearProps: "opacity,transform" });
        });
    }
});

// Sidebar Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // デスクトップの検索導線
    const topbar = document.querySelector('.topbar');
    if (topbar && !topbar.querySelector('.topbar-search-link')) {
        const searchLink = document.createElement('a');
        searchLink.href = 'search.html';
        searchLink.className = 'topbar-search-link';
        searchLink.setAttribute('aria-label', 'サイト内検索を開く');
        searchLink.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><span>検索</span>';
        topbar.appendChild(searchLink);
    }
    
    if(menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('open');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    // Accordion Logic
    const accordionBtns = document.querySelectorAll('.accordion-btn');
    accordionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const content = btn.nextElementSibling;
            if(content && content.classList.contains('accordion-content')) {
                content.classList.toggle('open');
            }
        });
    });

    // Auto-set active menu item based on URL
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const firstMenuGroup = document.querySelector('.menu .accordion-content');
    if (firstMenuGroup && !firstMenuGroup.querySelector('a[href="search.html"]')) {
        const searchMenuItem = document.createElement('a');
        searchMenuItem.href = 'search.html';
        searchMenuItem.className = 'menu-item';
        searchMenuItem.dataset.page = 'search';
        searchMenuItem.textContent = 'サイト内検索';
        firstMenuGroup.querySelector('a[href="news.html"]')?.insertAdjacentElement('afterend', searchMenuItem);
    }
    const menuGroups = document.querySelectorAll('.menu .accordion-content');
    const otherMenuGroup = menuGroups.length > 1 ? menuGroups[1] : null;
    if (otherMenuGroup && !otherMenuGroup.querySelector('[data-page="contact"]')) {
        const requestLink = document.createElement('a');
        requestLink.href = window.location.pathname.includes('/guides/') ? '../contact.html' : 'contact.html';
        requestLink.className = 'menu-item';
        requestLink.dataset.page = 'contact';
        requestLink.textContent = '情報追加・修正依頼';
        otherMenuGroup.appendChild(requestLink);
    }
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === 'news.html') item.textContent = 'ホーム';
        if (currentPath === href || (currentPath === 'index.html' && href === 'news.html')) {
            item.classList.add('active');
            // Do NOT automatically open the parent accordion, per user request.
        } else {
            item.classList.remove('active');
        }
    });

    // スマホの主要画面は下部メニューから1タップで移動
    if (currentPath !== 'index.html' && !document.querySelector('.mobile-bottom-nav')) {
        const nav = document.createElement('nav');
        nav.className = 'mobile-bottom-nav';
        nav.setAttribute('aria-label', 'スマホ用メニュー');
        nav.innerHTML = `
            <a href="news.html" data-nav="news"><span aria-hidden="true">⌂</span><small>ホーム</small></a>
            <a href="search.html" data-nav="search"><span aria-hidden="true">⌕</span><small>検索</small></a>
            <a href="schedule.html" data-nav="schedule"><span aria-hidden="true">▣</span><small>予定</small></a>
            <a href="resources.html" data-nav="resources"><span aria-hidden="true">▤</span><small>資料</small></a>
            <button type="button" class="mobile-menu-button"><span aria-hidden="true">☰</span><small>メニュー</small></button>`;
        const activeKey = currentPath.replace('.html', '');
        nav.querySelector(`[data-nav="${activeKey}"]`)?.classList.add('active');
        nav.querySelector('.mobile-menu-button').addEventListener('click', () => {
            sidebar?.classList.add('open');
            overlay?.classList.add('open');
        });
        document.body.appendChild(nav);
    }

    // Info pages opened from ノウハウ一覧: back link goes to knowledge.html
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'knowledge') {
        const backLink = document.querySelector('.back-link');
        if (backLink) {
            backLink.href = 'knowledge.html';
            backLink.textContent = '← ノウハウ一覧に戻る';
        }
        menuItems.forEach((item) => {
            const href = item.getAttribute('href');
            item.classList.toggle('active', href === 'knowledge.html');
        });
    }

    // Radio day cards: keep open while reading (body clicks must not toggle)
    document.querySelectorAll('.radio-day').forEach((day) => {
        const body = day.querySelector('.radio-day-body');
        if (!body) return;
        body.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        body.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
    });
});

// Prompt Copy Logic
document.addEventListener('DOMContentLoaded', () => {
    const copyBtns = document.querySelectorAll('.copy-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if(targetEl) {
                try {
                    await navigator.clipboard.writeText(targetEl.textContent.trim());
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '✅ コピーしました！';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.classList.remove('copied');
                    }, 2000);
                } catch(err) {
                    console.error('Copy failed', err);
                    alert('コピーに失敗しました。');
                }
            }
        });
    });
});
