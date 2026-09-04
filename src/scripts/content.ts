export function initCascade() {
  const blocks = document.querySelectorAll<HTMLElement>('[data-cascade] > *');
  if (!blocks.length) return;
  let i = 0;
  for (const block of blocks) {
    if (block.classList.contains('md-cascade')) continue;
    block.classList.add('md-cascade');
    block.style.transitionDelay = `${Math.min(i * 35, 500)}ms`;
    i++;
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      for (const block of blocks) block.classList.add('md-cascade--in');
      setTimeout(() => {
        for (const block of blocks) block.style.transitionDelay = '';
      }, 1100);
    }),
  );
}

export function initCodeCopy() {
  for (const pre of document.querySelectorAll('pre.astro-code')) {
    if (pre.querySelector('.code-copy')) continue;
    const btn = document.createElement('button');
    btn.className = 'code-copy';
    btn.type = 'button';
    btn.setAttribute('aria-label', '複製程式碼');
    const icon = document.createElement('span');
    icon.className = 'code-copy__icon';
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);
    btn.addEventListener('click', async () => {
      try {
        // the button sits inside pre, so copy from code to leave it out
        await navigator.clipboard.writeText(pre.querySelector('code')?.textContent ?? '');
        btn.classList.add('code-copy--done');
      } catch {
        btn.classList.add('code-copy--fail'); // not https, or permission denied
      }
      setTimeout(() => btn.classList.remove('code-copy--done', 'code-copy--fail'), 1400);
    });
    pre.appendChild(btn);
  }
}

export function initYt() {
  for (const a of document.querySelectorAll('a.yt[data-yt-id]')) {
    a.addEventListener('click', (e) => {
      // hand modifier clicks back to the browser; the element is replaced, so no once
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const id = (a as HTMLElement).dataset.ytId;
      const iframe = document.createElement('iframe');
      iframe.className = 'yt__iframe';
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title = a.querySelector('.yt__title')?.textContent ?? 'YouTube';
      a.replaceWith(iframe);
    });
  }
}

// Taipei metro line colors live in tokens.css; the edge label text is the line name
const MRT_LINES: Record<string, string> = {
  板南線: '--mrt-bl',
  淡水信義線: '--mrt-r',
  松山新店線: '--mrt-g',
  中和新蘆線: '--mrt-o',
  文湖線: '--mrt-br',
  環狀線: '--mrt-y',
};

// mermaid rules are scoped by svg id and outrank any stylesheet, so the palette rides in
// through themeCSS, which lands inside that scope; themeVariables would reject oklch() tokens
const MERMAID_CSS = `
  .node rect, .node path, .node polygon, .node circle { fill: var(--paper); stroke: var(--line-strong); stroke-width: 2px; }
  .node rect { rx: 8px; ry: 8px; }
  .node .nodeLabel { color: var(--ink); font-weight: 650; }
  .flowchart-link { stroke: var(--line-strong); }
  .marker { fill: var(--line-strong); stroke: var(--line-strong); }
  .edgeLabel, .edgeLabel p, .labelBkg { background: var(--surface); }
  .edgeLabel p { font-size: var(--text-tiny); font-weight: 700; letter-spacing: 0.03em; }
  .dest rect, .dest path { fill: var(--ink); stroke: var(--ink); }
  .dest .nodeLabel { color: var(--paper); font-weight: 750; }
`;

export async function initMermaid() {
  if (!document.querySelector('pre.mermaid')) return;
  try {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      fontFamily: 'inherit',
      themeCSS: MERMAID_CSS,
      flowchart: { curve: 'basis', nodeSpacing: 34, rankSpacing: 92, padding: 12 },
    });
    await mermaid.run({ querySelector: 'pre.mermaid', suppressErrors: false });
    paintMrtLines();
  } catch (err) {
    console.error('[mermaid] render failed:', err);
    // the placeholder hides the source until mermaid swaps in the svg, so hand it back
    // here: without this the block stays an empty box whenever rendering falls over
    for (const pre of document.querySelectorAll('pre.mermaid:not([data-processed])')) {
      pre.setAttribute('data-mermaid-failed', '');
    }
  }
}

function paintMrtLines() {
  for (const svg of document.querySelectorAll('pre.mermaid svg')) {
    // one label group per edge in edge order, empty ones included, so index pairs the two;
    // a count mismatch means mermaid changed that and the pairing would color the wrong edge
    const paths = svg.querySelectorAll<SVGPathElement>('.edgePaths > path');
    const labels = svg.querySelectorAll<SVGGElement>('.edgeLabels > g');
    if (paths.length !== labels.length) continue;
    paths.forEach((path, i) => {
      const varName = MRT_LINES[labels[i].textContent?.trim() ?? ''];
      if (!varName) return;
      const color = `var(${varName})`;
      path.style.stroke = color; // inline: the color varies per edge, themeCSS above is static
      path.style.strokeWidth = '5px';
      const chip = labels[i].querySelector<HTMLElement>('p');
      if (chip) chip.style.color = color;
    });
  }
}
