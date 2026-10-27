import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getHomePlan, japanMonth, defaultWeeklyPlan, isSafeHomeLink } from '../js/home-plan.js';

const assignments = JSON.parse(fs.readFileSync(new URL('../data/assignments.json', import.meta.url)));

test('日本時間の月初に切り替わり、翌月・翌年に古い目標を表示しない', () => {
    assert.equal(japanMonth(new Date('2026-10-31T14:59:59Z')), '2026-10');
    assert.equal(japanMonth(new Date('2026-10-31T15:00:00Z')), '2026-11');
    assert.equal(getHomePlan(assignments, new Date('2026-10-31T14:59:59Z')).assignment.monthlyGoal, '競合調査');
    for (const date of ['2026-10-31T15:00:00Z', '2027-10-01T00:00:00Z']) {
        const plan = getHomePlan(assignments, new Date(date));
        assert.equal(plan.assignment, null);
        assert.deepEqual(plan.weeklyPlan, defaultWeeklyPlan);
    }
});

test('次月の設定だけで、目標と3ステップがまとめて切り替わる', () => {
    const next = structuredClone(assignments);
    next.period = '2026-11';
    next.monthlyGoal = 'プロフィール改善';
    next.weeklyPlan.steps[0].url = 'guides/account-profile.html';
    const selected = getHomePlan(next, new Date('2026-11-01T00:00:00Z'));
    assert.equal(selected.assignment.monthlyGoal, 'プロフィール改善');
    assert.equal(selected.weeklyPlan.steps[0].url, 'guides/account-profile.html');
});

test('設定が未取得・不完全・危険なURLの場合も利用できる案内に戻る', () => {
    for (const value of [null, {}, { ...assignments, weeklyPlan: { steps: [] } }, {
        ...assignments, weeklyPlan: { ...assignments.weeklyPlan, steps: assignments.weeklyPlan.steps.map(step => ({ ...step, url: 'javascript:alert(1)' })) }
    }]) {
        assert.deepEqual(getHomePlan(value, new Date('2026-10-01T00:00:00Z')).weeklyPlan, defaultWeeklyPlan);
    }
    for (const url of ['javascript:alert(1)', '//example.com', 'data:text/html,test', '../outside.html']) {
        assert.equal(isSafeHomeLink(url), false);
    }
});

test('ホームにある内部リンクと設定した3ステップのリンク先が存在する', () => {
    const root = new URL('../', import.meta.url);
    const html = fs.readFileSync(new URL('news.html', root), 'utf8');
    const links = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    links.push(...assignments.weeklyPlan.steps.map(step => step.url));
    for (const url of links.filter(url => !/^(https?:|#)/.test(url))) {
        assert.ok(fs.existsSync(new URL(url.split(/[?#]/)[0], root)), url);
    }
    assert.equal((html.match(/class="concern-card"/g) || []).length, 4);
});

test('取得失敗時にも共通案内を描画し、取得した文言はHTMLとして解釈しない', async () => {
    const originalDocument = globalThis.document;
    const originalFetch = globalThis.fetch;
    const ids = ['monthly-focus-list', 'monthly-kicker', 'monthly-note', 'monthly-resource-link', 'weekly-actions-intro', 'weekly-action-steps'];
    const elements = Object.fromEntries(ids.map(id => [id, {}]));
    globalThis.document = { addEventListener() {}, getElementById: id => elements[id] || null };
    try {
        const { initAssignments } = await import('../js/dashboard.js');
        for (const response of [() => { throw new Error('offline'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => { throw new Error('invalid json'); } })]) {
            globalThis.fetch = response;
            await initAssignments();
            assert.ok(elements['weekly-action-steps'].innerHTML.includes('guides/roadmap.html'));
            assert.ok(elements['monthly-focus-list'].innerHTML.includes('案内を準備中です'));
        }
        const current = structuredClone(assignments);
        current.period = japanMonth();
        current.weeklyPlan.steps[0].title = '<img src=x onerror=alert(1)>';
        globalThis.fetch = async () => ({ ok: true, json: async () => current });
        await initAssignments();
        assert.ok(elements['weekly-action-steps'].innerHTML.includes('&lt;img'));
        assert.ok(!elements['weekly-action-steps'].innerHTML.includes('<img'));
        assert.ok(elements['weekly-action-steps'].innerHTML.includes('target="_blank" rel="noopener noreferrer"'));
    } finally {
        globalThis.document = originalDocument;
        globalThis.fetch = originalFetch;
    }
});
