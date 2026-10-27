(() => {
    const checks = [...document.querySelectorAll('[data-check]')];
    const key = 'icircle-harutora-checks-v1';
    const note = document.getElementById('ht-storage-note');
    function storageUnavailable() { note.textContent = 'チェックはこのページを開いている間だけ保持されます。'; }
    try {
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(saved)) checks.forEach((c, i) => { c.checked = saved[i] === true; });
    } catch { storageUnavailable(); }
    function updateChecks(save = true) {
        const count = checks.filter(c => c.checked).length;
        document.getElementById('ht-check-count').textContent = `${count} / 8 完了${count === 8 ? ' ✓ 準備OK！' : ''}`;
        document.getElementById('ht-check-progress').value = count;
        if (save) try { localStorage.setItem(key, JSON.stringify(checks.map(c => c.checked))); } catch { storageUnavailable(); }
    }
    checks.forEach(c => c.addEventListener('change', () => updateChecks()));
    document.getElementById('ht-reset').addEventListener('click', () => { checks.forEach(c => { c.checked = false; }); updateChecks(); });
    updateChecks(false);

    const inputs = ['ht-views', 'ht-follows', 'ht-visits'].map(id => document.getElementById(id));
    function calculate() {
        const nums = inputs.map(input => input.value.trim() === '' || !input.validity.valid ? NaN : Number(input.value));
        const [views, follows, visits] = nums;
        const rate = (n, d) => Number.isFinite(n) && Number.isFinite(d) && d > 0 ? `${(n / d * 100).toFixed(2)}%` : '—';
        document.getElementById('ht-rate').textContent = rate(follows, views);
        document.getElementById('ht-profile-rate').textContent = rate(follows, visits);
        document.getElementById('ht-calc-note').textContent = nums.some(n => !Number.isFinite(n)) ? '各項目に0以上の整数を入力してください。' : follows > views || follows > visits ? 'フォロー数が再生数または訪問数を上回っています。集計期間と流入元がそろっているか確認してください。' : '分母が0の獲得率は「—」で表示します。同じ期間・流入元の数値で比較しよう。';
    }
    inputs.forEach(input => input.addEventListener('input', calculate)); calculate();

    const scenes = [
        {start:0,end:3,time:'0–3 SEC',text:'Excelの面倒な作業、まだ手でやってる？',cells:['A','B','C','作業','手入力','…','合計','?','…']},
        {start:3,end:7,time:'3–7 SEC',text:'実は、これだけで一瞬！',cells:['A','B','C','操作前','→','操作後','合計','→','完成 ✓']},
        {start:7,end:12,time:'7–12 SEC',text:'初心者でも、マネするだけで仕事がラクになる！',cells:['時短①','時短②','時短③','余白調整','合計入力','差分確認','✓','✓','✓']},
        {start:12,end:17,time:'12–17 SEC',text:'ほかにも簡単な時短ワザを紹介してるよ！フォローしてね！',cells:['人気投稿','人気投稿','人気投稿','時短','簡単','初心者','✓','✓','✓']}
    ];
    const buttons = [...document.querySelectorAll('[data-scene]')];
    const play = document.getElementById('ht-play');
    const elapsed = document.getElementById('ht-elapsed');
    const progress = document.getElementById('ht-play-progress');
    let frame = null, active = -1, position = 0, started = 0;
    function show(index) {
        if (active === index) return;
        active = index; const s = scenes[index];
        document.getElementById('ht-scene-time').textContent = s.time;
        document.getElementById('ht-scene-text').textContent = s.text;
        [...document.querySelectorAll('#ht-scene-visual span')].forEach((cell, i) => { cell.textContent = s.cells[i]; });
        buttons.forEach((button,i) => button.setAttribute('aria-pressed', String(i === index)));
    }
    function stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; play.textContent = '▶ 17秒プレビューを再生'; }
    function updateTime() { elapsed.textContent = `${Math.floor(position)} / 17秒`; progress.value = position; }
    buttons.forEach((button,i) => button.addEventListener('click', () => { stop(); position = scenes[i].start; show(i); updateTime(); }));
    function tick(now) {
        position = Math.min((now - started) / 1000, 17);
        show(position < 3 ? 0 : position < 7 ? 1 : position < 12 ? 2 : 3); updateTime();
        if (position >= 17) { stop(); play.textContent = '↻ もう一度再生'; return; }
        frame = requestAnimationFrame(tick);
    }
    play.addEventListener('click', () => {
        if (frame !== null) { stop(); return; }
        if (position >= 17) position = 0;
        started = performance.now() - position * 1000;
        play.textContent = 'Ⅱ 一時停止'; frame = requestAnimationFrame(tick);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }); show(0);

    const chapterLinks = [...document.querySelectorAll('.ht-toc a[href^="#"]')].slice(0,5);
    const chapters = [...document.querySelectorAll('.ht-chapter')];
    let scrollQueued = false;
    function updateScroll() {
        const total = document.documentElement.scrollHeight - innerHeight;
        document.getElementById('ht-reading-bar').style.width = `${total > 0 ? Math.min(scrollY / total * 100, 100) : 100}%`;
        let current = 0; chapters.forEach((section,i) => { if (section.getBoundingClientRect().top <= 180) current = i; });
        chapterLinks.forEach((link,i) => { link.classList.toggle('active', i === current); if (i === current) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); });
        scrollQueued = false;
    }
    addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, {passive:true});
    addEventListener('resize', updateScroll); updateScroll();
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('ht-in'); observer.unobserve(entry.target); } }); }, {threshold:0.08});
        document.querySelectorAll('.ht-chapter-head,.ht-tool,.ht-demo').forEach(el => observer.observe(el));
    }
})();
