import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const originalExec = document.execCommand;

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
    document.execCommand = originalExec;
    vi.restoreAllMocks();
  });

  function setClipboard(value: unknown): void {
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
  }

  it('utilise navigator.clipboard quand il est disponible (contexte sécurisé)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    document.execCommand = vi.fn();

    expect(await copyToClipboard('http://x/d/tok')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('http://x/d/tok');
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('retombe sur execCommand quand navigator.clipboard est absent (http sur le réseau local)', async () => {
    setClipboard(undefined);
    document.execCommand = vi.fn().mockReturnValue(true);

    expect(await copyToClipboard('http://x/d/tok')).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('retombe sur execCommand quand writeText est refusé', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    document.execCommand = vi.fn().mockReturnValue(true);

    expect(await copyToClipboard('abc')).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('renvoie false quand aucune méthode ne fonctionne', async () => {
    setClipboard(undefined);
    document.execCommand = vi.fn().mockReturnValue(false);

    expect(await copyToClipboard('abc')).toBe(false);
  });

  it('ne laisse aucun champ temporaire dans le DOM et rend le focus', async () => {
    setClipboard(undefined);
    document.execCommand = vi.fn().mockReturnValue(true);
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    await copyToClipboard('abc');

    expect(document.querySelector('textarea')).toBeNull();
    expect(document.activeElement).toBe(button);
    button.remove();
  });
});
