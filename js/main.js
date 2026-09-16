document.addEventListener("DOMContentLoaded", () => {
    // 外部ライブラリの読み込みに失敗しても、ナビゲーションなどは動作させる
    if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
    }

    initSplash();
    initCarousel();
    initScheduleMonthTabs();
    initContentUpdates();
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
