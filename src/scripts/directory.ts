import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';

function revealCurrentItem(container: HTMLElement, focus: boolean, center: boolean) {
  const current = container.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
  if (!current) {
    if (focus) container.querySelector<HTMLButtonElement>('.navdrawer__close')?.focus();
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const currentRect = current.getBoundingClientRect();
  const outsideView = currentRect.top < containerRect.top || currentRect.bottom > containerRect.bottom;
  if (center || outsideView) {
    const top =
      container.scrollTop +
      currentRect.top -
      containerRect.top -
      (container.clientHeight - currentRect.height) / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }
  if (focus) current.focus({ preventScroll: true });
}

const desktopDirectory = matchMedia('(min-width: 1024px)');
let desktopDirectoryOpen = true;
let desktopDirectoryScrollTop: number | undefined;

function syncDirectoryState() {
  const drawer = document.getElementById('site-nav');
  const toggle = document.getElementById('directory-toggle');
  const onDesktop = desktopDirectory.matches;

  document.body.classList.toggle('directory-collapsed', onDesktop && !desktopDirectoryOpen);
  if (onDesktop && drawer?.matches(':popover-open')) drawer.hidePopover();

  const expanded = onDesktop ? desktopDirectoryOpen : drawer?.matches(':popover-open') === true;
  toggle?.setAttribute('aria-expanded', String(expanded));
}

function syncDesktopCurrentItem() {
  const directory = document.querySelector<HTMLElement>('.site-directory');
  if (!directory) return;

  for (const link of directory.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    if (link.origin === location.origin && link.pathname === location.pathname) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

function revealDesktopCurrentItem() {
  const directory = document.querySelector<HTMLElement>('.site-directory');
  if (directory && desktopDirectoryOpen && getComputedStyle(directory).display !== 'none') {
    // The persistent rail keeps the current item visible without stealing content focus.
    revealCurrentItem(directory, false, false);
  }
}

desktopDirectory.addEventListener('change', () => {
  syncDirectoryState();
  if (desktopDirectory.matches) requestAnimationFrame(revealDesktopCurrentItem);
});
document.addEventListener('astro:before-swap', (e) => {
  const directory = document.querySelector<HTMLElement>('.site-directory');
  const nextDirectory = (e as TransitionBeforeSwapEvent).newDocument.querySelector('.site-directory');
  desktopDirectoryScrollTop = directory && nextDirectory ? directory.scrollTop : undefined;
});
document.addEventListener('astro:after-swap', () => {
  syncDirectoryState();
  syncDesktopCurrentItem();

  const directory = document.querySelector<HTMLElement>('.site-directory');
  if (directory && desktopDirectoryScrollTop !== undefined) {
    directory.scrollTop = desktopDirectoryScrollTop;
  }
  desktopDirectoryScrollTop = undefined;
});

export function initDirectoryPosition() {
  const toggle = document.getElementById('directory-toggle');
  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = '1';
    toggle.addEventListener('click', () => {
      const drawer = document.getElementById('site-nav');
      if (desktopDirectory.matches) {
        desktopDirectoryOpen = !desktopDirectoryOpen;
        syncDirectoryState();
        if (desktopDirectoryOpen) requestAnimationFrame(revealDesktopCurrentItem);
      } else {
        drawer?.matches(':popover-open') ? drawer.hidePopover() : drawer?.showPopover();
        syncDirectoryState();
      }
    });
  }

  syncDirectoryState();
  revealDesktopCurrentItem();

  const drawer = document.getElementById('site-nav');
  if (!drawer || drawer.dataset.bound) return;
  drawer.dataset.bound = '1';
  drawer.addEventListener('toggle', () => {
    syncDirectoryState();
    if (!drawer.matches(':popover-open')) return;
    requestAnimationFrame(() => {
      // The temporary drawer transfers context and keyboard control to the current item.
      revealCurrentItem(drawer, true, true);
    });
  });
}
