// registered once at module level; handlers look the element up by id
let deptCloseTimer: number | undefined;
function closeDeptMenu() {
  const menu = document.getElementById('dept-menu');
  if (!menu || menu.hidden) return;
  menu.classList.remove('dept-picker__menu--open');
  document.getElementById('dept-btn')?.setAttribute('aria-expanded', 'false');
  deptCloseTimer = window.setTimeout(() => (menu.hidden = true), 170);
}
function openDeptMenu() {
  const menu = document.getElementById('dept-menu');
  if (!menu) return;
  clearTimeout(deptCloseTimer);
  menu.hidden = false;
  requestAnimationFrame(() => menu.classList.add('dept-picker__menu--open'));
  document.getElementById('dept-btn')?.setAttribute('aria-expanded', 'true');
}
document.addEventListener('click', (e) => {
  const menu = document.getElementById('dept-menu');
  if (menu && !menu.hidden && !menu.contains(e.target as Node)) closeDeptMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDeptMenu();
});

// the persisted header must not carry an open menu into the next page
document.addEventListener('astro:before-swap', () => {
  closeDeptMenu();
  const menu = document.getElementById('dept-menu');
  if (menu) menu.hidden = true; // hide before the snapshot, without waiting for the fade
});

export function initDeptPicker() {
  const deptBtn = document.getElementById('dept-btn');
  const deptMenu = document.getElementById('dept-menu');
  const deptLabel = document.getElementById('dept-btn-label');
  if (!deptBtn || !deptMenu || !deptLabel) return;
  if (deptBtn.dataset.bound) return; // the header persists across navigation
  deptBtn.dataset.bound = '1';

  const options = [...deptMenu.querySelectorAll<HTMLElement>('[role="option"]')];
  const sync = () => {
    const code = localStorage.getItem('dept') ?? 'all';
    for (const opt of options) {
      const selected = opt.dataset.code === code;
      opt.setAttribute('aria-selected', String(selected));
      if (selected) deptLabel.textContent = opt.textContent?.trim() ?? '全部';
    }
  };
  deptBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deptBtn.getAttribute('aria-expanded') === 'true' ? closeDeptMenu() : openDeptMenu();
  });
  deptBtn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openDeptMenu();
      options[0]?.focus();
    }
  });
  deptMenu.addEventListener('keydown', (e) => {
    const i = options.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      options[Math.min(i + 1, options.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      options[Math.max(i - 1, 0)]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.click();
      deptBtn.focus();
    } else if (e.key === 'Escape') {
      closeDeptMenu();
      deptBtn.focus();
    }
  });
  for (const opt of options) {
    opt.addEventListener('click', () => {
      const code = opt.dataset.code ?? 'all';
      localStorage.setItem('dept', code);
      document.documentElement.dataset.dept = code;
      sync();
      closeDeptMenu();
    });
  }
  sync();
}

export function initDeptHint() {
  const hint = document.getElementById('dept-hint');
  const btn = document.getElementById('dept-btn');
  if (!hint || !btn || hint.dataset.bound) return; // header persists across navigation
  hint.dataset.bound = '1';
  if (localStorage.getItem('dept') || localStorage.getItem('deptHintDone')) return;

  const dismissal = new AbortController();
  const dismiss = () => {
    dismissal.abort(); // one teardown for every path that closes the hint
    localStorage.setItem('deptHintDone', '1');
    hint.classList.remove('dept-hint--show');
    setTimeout(() => (hint.hidden = true), 200);
  };
  const { signal } = dismissal;
  document.getElementById('dept-hint-close')?.addEventListener('click', dismiss, { signal });
  btn.addEventListener('click', dismiss, { signal });
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') dismiss();
    },
    { signal },
  );

  setTimeout(() => {
    hint.hidden = false;
    requestAnimationFrame(() => hint.classList.add('dept-hint--show'));
  }, 1400);
}
