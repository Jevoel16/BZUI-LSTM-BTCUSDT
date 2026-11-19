// Three-button theme picker: System follows the device, Light and Dark are saved.
const KEY = 'bzui-theme';

/** Anything but 'light' or 'dark' means System. */
export const parseTheme = (saved) => (saved === 'light' || saved === 'dark' ? saved : 'system');

export function initThemePicker(group) {
  const media = matchMedia('(prefers-color-scheme: dark)');
  let choice = 'system';
  try { choice = parseTheme(localStorage.getItem(KEY)); } catch { /* storage unavailable */ }

  // bzUI only styles [data-theme="dark"], so System still sets the attribute from the device setting.
  const apply = () => {
    document.documentElement.dataset.theme = choice === 'system' ? (media.matches ? 'dark' : 'light') : choice;
    for (const btn of group.querySelectorAll('button')) btn.setAttribute('aria-pressed', String(btn.value === choice));
  };

  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    choice = parseTheme(btn.value);
    try {
      if (choice === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, choice);
    } catch { /* storage unavailable */ }
    apply();
  });
  media.addEventListener('change', () => choice === 'system' && apply());
  apply();
}
