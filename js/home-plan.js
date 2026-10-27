// ホームの月間案内。日本時間の対象月だけ表示し、未登録の月は共通案内に戻す。
export function japanMonth(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit'
    }).formatToParts(date);
    return `${parts.find(part => part.type === 'year').value}-${parts.find(part => part.type === 'month').value}`;
}

export function isSafeHomeLink(href) {
    return typeof href === 'string' && (
        /^https:\/\/[^\s]+$/.test(href) ||
        /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.html(?:[?#][^\s]*)?$/.test(href)
    );
}

export const defaultWeeklyPlan = {
    intro: '今月の案内が未登録のときも、自分の課題に合わせて学びを進められます。できるところから始めましょう。',
    steps: [
        { title: '今の課題を1つ決める', description: '運用の流れを見直し、今取り組みたいことを選びましょう。', label: 'ロードマップを見る', url: 'guides/roadmap.html' },
        { title: '必要な教材で学ぶ', description: '下の「悩みから探す」や教材一覧から、課題に合う内容を確認。', label: '教材を探す', url: 'knowledge.html' },
        { title: '投稿で試して振り返る', description: '学んだ工夫を1つ試し、気づきと次の行動を記録しましょう。', label: '振り返り資料を探す', url: 'resources.html' }
    ]
};

export function isValidWeeklyPlan(plan) {
    return typeof plan?.intro === 'string' && !!plan.intro.trim() &&
        Array.isArray(plan.steps) && plan.steps.length === 3 &&
        plan.steps.every(step => ['title', 'description', 'label'].every(key =>
            typeof step?.[key] === 'string' && !!step[key].trim()) && isSafeHomeLink(step.url));
}

export function getHomePlan(assignments, date = new Date()) {
    const period = japanMonth(date);
    const isCurrent = assignments?.period === period;
    return {
        period,
        assignment: isCurrent ? assignments : null,
        weeklyPlan: isCurrent && isValidWeeklyPlan(assignments.weeklyPlan)
            ? assignments.weeklyPlan : defaultWeeklyPlan
    };
}
