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

export async function initMermaid() {
  if (!document.querySelector('pre.mermaid')) return;
  try {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({ startOnLoad: false, theme: 'neutral', fontFamily: 'inherit' });
    await mermaid.run({ querySelector: 'pre.mermaid', suppressErrors: false });
  } catch (err) {
    console.error('[mermaid] render failed:', err);
  }
}
