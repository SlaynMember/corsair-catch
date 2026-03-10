export class UIManager {
  private overlay: HTMLElement;
  private panels = new Map<string, HTMLElement>();

  constructor() {
    this.overlay = document.getElementById('ui-overlay')!;
  }

  show(id: string, html: string): HTMLElement {
    let panel = this.panels.get(id);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = `ui-${id}`;
      this.overlay.appendChild(panel);
      this.panels.set(id, panel);
    }
    panel.innerHTML = html;
    panel.style.display = '';
    return panel;
  }

  hide(id: string): void {
    const panel = this.panels.get(id);
    if (panel) panel.style.display = 'none';
  }

  remove(id: string): void {
    const panel = this.panels.get(id);
    if (panel) {
      panel.remove();
      this.panels.delete(id);
    }
  }

  getPanel(id: string): HTMLElement | undefined {
    return this.panels.get(id);
  }

  clearAll(): void {
    for (const [id] of this.panels) {
      this.remove(id);
    }
  }

  onClick(id: string, selector: string, callback: () => void): void {
    const panel = this.panels.get(id);
    if (!panel) return;
    const el = panel.querySelector(selector);
    if (el) el.addEventListener('click', callback);
  }

  onClickAll(id: string, selector: string, callback: (index: number) => void): void {
    const panel = this.panels.get(id);
    if (!panel) return;
    const els = panel.querySelectorAll(selector);
    els.forEach((el, i) => el.addEventListener('click', () => callback(i)));
  }
}
