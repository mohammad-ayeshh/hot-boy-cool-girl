// The Feel Lab settings drawer: generated from the settings list (src/game/settings.ts).
import { DEFS, KEYS, defaults, describeChanges, type Group, type Key, type Settings } from '../game/settings';

export interface PanelHooks {
  onChange(key: Key): void;
  onBulk(): void;
}

const GROUP_ICONS: Record<Group, string> = {
  Movement: '🏃',
  Helpers: '🤝',
  Controls: '👍',
  Character: '🔥',
  Camera: '🎥',
  'Light & flash': '💡',
  World: '🌊',
  Time: '⏱️',
  Rewards: '💎',
  'Sound & haptics': '🔊',
  Debug: '🔧',
};

export class Panel {
  readonly el: HTMLElement;
  private readonly readout: HTMLElement;
  private readonly inputs = new Map<Key, HTMLInputElement>();
  private readonly outputs = new Map<Key, HTMLElement>();

  constructor(parent: HTMLElement, private readonly settings: Settings, private readonly hooks: PanelHooks) {
    this.el = document.createElement('aside');
    this.el.className = 'lab-panel hidden';
    this.el.innerHTML = `
      <header>
        <h2>Feel Lab</h2>
        <button class="icon" data-act="close" aria-label="Close">✕</button>
      </header>
      <div class="lab-actions">
        <button data-act="off">All effects off</button>
        <button data-act="on">All effects on</button>
        <button data-act="reset">Defaults</button>
        <button data-act="copy" class="primary">Copy my values</button>
      </div>
      <div class="lab-copied hidden"></div>
      <div class="lab-readout"></div>`;
    this.readout = this.el.querySelector('.lab-readout')!;

    const groups = new Map<Group, HTMLElement>();
    for (const k of KEYS) {
      const def = DEFS[k];
      let body = groups.get(def.group);
      if (!body) {
        const details = document.createElement('details');
        details.open = def.group === 'Movement' || def.group === 'Helpers';
        details.innerHTML = `<summary>${GROUP_ICONS[def.group]} ${def.group}</summary><div class="lab-group"></div>`;
        this.el.appendChild(details);
        body = details.querySelector('.lab-group') as HTMLElement;
        groups.set(def.group, body);
      }
      const row = document.createElement('label');
      row.className = `lab-row ${def.kind}`;
      if (def.hint) row.title = def.hint;
      const input = document.createElement('input');
      if (def.kind === 'toggle') {
        input.type = 'checkbox';
        row.innerHTML = `<span class="lab-label">${def.label}${def.hint ? `<small>${def.hint}</small>` : ''}</span>`;
        row.appendChild(input);
        input.addEventListener('change', () => this.set(k, input.checked));
      } else {
        input.type = 'range';
        input.min = String(def.min);
        input.max = String(def.max);
        input.step = String(def.step);
        const out = document.createElement('output');
        row.innerHTML = `<span class="lab-label">${def.label}${def.hint ? `<small>${def.hint}</small>` : ''}</span>`;
        row.appendChild(out);
        row.appendChild(input);
        this.outputs.set(k, out);
        input.addEventListener('input', () => this.set(k, Number(input.value)));
      }
      this.inputs.set(k, input);
      body.appendChild(row);
    }

    this.el.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'close') this.toggle(false);
      else if (act === 'off' || act === 'on') {
        for (const k of KEYS) if ((DEFS[k] as { effect?: boolean }).effect) (this.settings as Record<Key, unknown>)[k] = act === 'on';
        this.syncAll();
        this.hooks.onBulk();
      } else if (act === 'reset') {
        Object.assign(this.settings, defaults());
        this.syncAll();
        this.hooks.onBulk();
      } else if (act === 'copy') void this.copy();
    });
    // Keep game touches from leaking through the panel.
    this.el.addEventListener('pointerdown', (e) => e.stopPropagation());
    parent.appendChild(this.el);
    this.syncAll();
  }

  get open(): boolean {
    return !this.el.classList.contains('hidden');
  }

  toggle(open = !this.open): void {
    this.el.classList.toggle('hidden', !open);
  }

  setReadout(html: string): void {
    this.readout.innerHTML = html;
  }

  private set(k: Key, v: number | boolean): void {
    (this.settings as Record<Key, number | boolean>)[k] = v;
    this.sync(k);
    this.hooks.onChange(k);
  }

  private sync(k: Key): void {
    const input = this.inputs.get(k)!;
    const v = this.settings[k];
    const def = DEFS[k];
    if (typeof v === 'boolean') input.checked = v;
    else {
      input.value = String(v);
      const out = this.outputs.get(k)!;
      const decimals = def.kind === 'slider' ? Math.max(0, -Math.floor(Math.log10(def.step) + 1e-9)) : 0;
      out.textContent = `${v.toFixed(decimals)}${def.kind === 'slider' && def.unit ? ' ' + def.unit : ''}`;
      out.classList.toggle('changed', v !== def.value);
    }
    input.closest('.lab-row')?.classList.toggle('changed', v !== def.value);
  }

  private syncAll(): void {
    for (const k of KEYS) this.sync(k);
  }

  private async copy(): Promise<void> {
    const text = `Hot Boy & Cool Girl: Feel Lab values\n${describeChanges(this.settings)}`;
    const box = this.el.querySelector('.lab-copied') as HTMLElement;
    try {
      await navigator.clipboard.writeText(text);
      box.textContent = '✅ Copied! Paste it into the chat with Claude.';
    } catch {
      // Clipboard blocked: show the text so it can be selected by hand.
      box.innerHTML = '';
      const ta = document.createElement('textarea');
      ta.readOnly = true;
      ta.value = text;
      box.appendChild(ta);
      ta.select();
    }
    box.classList.remove('hidden');
  }
}
