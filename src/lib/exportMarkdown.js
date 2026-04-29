// Client-side Markdown export of an event's polls.
// Free, zero dependencies; downloads .md file via blob.

const TYPE_LABELS = {
  poll: 'Анкета',
  quiz: 'Квиз',
  wordcloud: 'Облак со зборови',
  open: 'Отворено прашање',
  rating: 'Оценување',
  ranking: 'Рангирање',
};

const escapeMd = (s) => String(s ?? '').replace(/[\\`*_{}\[\]()#+\-!>|]/g, (m) => `\\${m}`);

export function buildEventMarkdown(event, polls) {
  const lines = [];
  const title = event?.title || 'Настан';
  const code = event?.code || '';
  const created = event?.created_at ? new Date(event.created_at).toLocaleString('mk-MK') : '';

  lines.push(`# ${escapeMd(title)}`);
  if (code) lines.push(`> **Код:** \`${code}\``);
  if (created) lines.push(`> **Креиран:** ${created}`);
  lines.push('');
  lines.push(`Извезено од [MKD Slidea](https://slidea.mismath.net) на ${new Date().toLocaleString('mk-MK')}.`);
  lines.push('');
  lines.push('---');
  lines.push('');

  (polls || []).forEach((p, idx) => {
    const typeLabel = TYPE_LABELS[p.type] || p.type || 'Активност';
    lines.push(`## ${idx + 1}. ${escapeMd(p.question || 'Без прашање')}`);
    lines.push('');
    lines.push(`**Тип:** ${typeLabel}${p.is_quiz ? ' (квиз)' : ''}`);
    lines.push('');

    const opts = (p.options || []).filter((o) => o.is_approved !== false);
    const totalVotes = opts.reduce((a, o) => a + (o.votes || 0), 0);

    if (opts.length === 0) {
      lines.push('_Нема опции (отворен формат)._');
      lines.push('');
    } else {
      opts.forEach((o) => {
        const votes = o.votes || 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const correctMark = o.is_correct ? ' ✅' : '';
        lines.push(`- **${escapeMd(o.text || '')}**${correctMark} — ${votes} (${pct}%)`);
      });
      lines.push('');
      lines.push(`_Вкупно гласови: ${totalVotes}_`);
      lines.push('');
    }

    if (p.is_quiz) {
      const correctOpt = opts.find((o) => o.is_correct);
      if (correctOpt && totalVotes > 0) {
        const acc = Math.round(((correctOpt.votes || 0) / totalVotes) * 100);
        lines.push(`> 🎯 **Точност:** ${acc}%`);
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
  });

  if (!polls || polls.length === 0) {
    lines.push('_Нема активности за извоз._');
  }

  return lines.join('\n');
}

export function downloadMarkdown(event, polls) {
  const md = buildEventMarkdown(event, polls);
  const safeName = (event?.title || event?.code || 'slidea')
    .replace(/[^a-zA-Z0-9\u0400-\u04FF\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'slidea';
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
