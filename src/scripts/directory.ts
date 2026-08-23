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

export function initDirectoryPosition() {
  const directory = document.querySelector<HTMLElement>('.site-directory');
  if (directory && getComputedStyle(directory).display !== 'none') {
    // The persistent rail keeps the current item visible without stealing content focus.
    revealCurrentItem(directory, false, false);
  }

  const drawer = document.getElementById('site-nav');
  if (!drawer || drawer.dataset.bound) return;
  drawer.dataset.bound = '1';
  drawer.addEventListener('toggle', () => {
    if (!drawer.matches(':popover-open')) return;
    requestAnimationFrame(() => {
      // The temporary drawer transfers context and keyboard control to the current item.
      revealCurrentItem(drawer, true, true);
    });
  });
}
