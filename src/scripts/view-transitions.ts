import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';

// swap wipes custom attributes off <html> and the is:inline script does not re-run
document.addEventListener('astro:after-swap', () => {
  document.documentElement.dataset.dept = localStorage.getItem('dept') || 'all';
});

// smooth scrolling only around an in-page anchor click; anything else, history
// restoration included, lands instantly
let smoothScrollTimer: number | undefined;
document.addEventListener('click', (e) => {
  const link = (e.target as Element | null)?.closest?.('a[href*="#"]');
  if (!(link instanceof HTMLAnchorElement) || !link.hash) return;
  if (link.origin !== location.origin || link.pathname !== location.pathname) return;
  document.documentElement.classList.add('scroll-smooth');
  clearTimeout(smoothScrollTimer);
  smoothScrollTimer = window.setTimeout(
    () => document.documentElement.classList.remove('scroll-smooth'),
    1200,
  );
});

// the page leaves hit-testing during a transition and clicks land on <html>
let activeViewTransition: TransitionBeforeSwapEvent['viewTransition'] | undefined;
document.addEventListener('astro:before-swap', (e) => {
  const vt = (e as TransitionBeforeSwapEvent).viewTransition;
  activeViewTransition = vt;
  vt?.finished
    .catch(() => {
      /* an interrupted transition rejects finished */
    })
    .finally(() => {
      if (activeViewTransition === vt) activeViewTransition = undefined;
      for (const el of document.querySelectorAll('.vt-hover')) el.classList.remove('vt-hover');
      document.documentElement.style.cursor = '';
    });
});

// :hover and the cursor stop resolving mid transition; mirror both from the last position
let lastMouseX = -1;
let lastMouseY = -1;
function mirrorHeaderHover() {
  const targets = document.querySelectorAll<HTMLElement>(
    '.site-header .nav-pill, .site-header .brand, .dept-picker__btn, .site-header .icon-btn',
  );
  let overAny = false;
  for (const el of targets) {
    const r = el.getBoundingClientRect();
    const over =
      lastMouseX >= r.left &&
      lastMouseX <= r.right &&
      lastMouseY >= r.top &&
      lastMouseY <= r.bottom;
    el.classList.toggle('vt-hover', over);
    overAny = overAny || over;
  }
  document.documentElement.style.cursor = overAny ? 'pointer' : '';
}
document.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  if (activeViewTransition) mirrorHeaderHover();
});
// a still mouse fires no mousemove, so mirror at both ends of the swap
// the exit animation starts on click; the loader waits for the fetch and the exit
document.addEventListener('astro:before-preparation', (e) => {
  mirrorHeaderHover();
  const ev = e as Event & { loader: () => Promise<void> };
  const loader = ev.loader;
  ev.loader = async () => {
    document.documentElement.classList.add('is-leaving');
    const exits = document.querySelector('main')?.getAnimations() ?? [];
    await Promise.all([loader(), Promise.allSettled(exits.map((a) => a.finished))]);
  };
});
document.addEventListener('astro:after-swap', () => {
  if (activeViewTransition) mirrorHeaderHover();
});
document.addEventListener('click', async (e) => {
  if (e.target !== document.documentElement || !activeViewTransition) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // modifier intent cannot be forwarded
  const vt = activeViewTransition;
  vt.skipTransition();
  try {
    await vt.finished;
  } catch {
    /* an interrupted transition rejects finished; the hit test still runs */
  }
  document
    .elementFromPoint(e.clientX, e.clientY)
    ?.closest<HTMLAnchorElement>('a[href]')
    ?.click();
});

// swallow links to the current page so navigation and the transition do not re-run;
// capture runs before the ClientRouter listener, which then lets the click through
document.addEventListener(
  'click',
  (e) => {
    const link = (e.target as Element | null)?.closest?.('a[href]');
    if (!(link instanceof HTMLAnchorElement) || link.origin !== location.origin) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target) return;
    if (link.pathname === location.pathname && link.search === location.search && !link.hash) {
      e.preventDefault();
    }
  },
  true,
);

// close the drawer on click: a top-layer element covers the exit animation, and swap is too late
document.addEventListener('astro:before-preparation', () => {
  const drawer = document.getElementById('site-nav');
  if (drawer?.matches(':popover-open')) drawer.hidePopover();
});
