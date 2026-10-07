/**
 * Copie `text` dans le presse-papiers. Renvoie `true` si la copie a réussi.
 *
 * `navigator.clipboard` n'existe que dans un contexte sécurisé (https ou localhost) : sur
 * `http://<ip du PC>` (test d'un mobile sur le Wi-Fi local) il est absent. On retombe alors sur
 * `document.execCommand('copy')`, qui ne fait qu'écrire (jamais lire) et exige un geste utilisateur.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // permission refusée : on tente le repli
    }
  }
  return copyWithExecCommand(text);
}

function copyWithExecCommand(text: string): boolean {
  const previouslyFocused = document.activeElement as HTMLElement | null;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.setAttribute('aria-hidden', 'true');
  // Hors écran, sans provoquer de défilement ni de zoom sur mobile (police ≥ 16 px).
  field.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;font-size:16px';
  document.body.appendChild(field);
  try {
    field.focus();
    field.select();
    field.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    field.remove();
    previouslyFocused?.focus();
  }
}
