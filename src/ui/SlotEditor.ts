import { BlendMode } from "@esotericsoftware/spine-pixi-v8";
import { selectedSlot$, spineController$ } from "../state/RxStores";
import { setSectionVisible } from "./sectionVisibility";
import { VisualComponent } from "../core/VisualComponent";

const HIDE = '__hide__';

// Live appearance editor for the selected slot: tint colour, alpha, blend mode
// and attachment swap/hide. Edits are applied by the controller every frame.
export class SlotEditor extends VisualComponent {
    private nameEl: HTMLElement | null = null;
    private colorEl: HTMLInputElement | null = null;
    private alphaEl: HTMLInputElement | null = null;
    private blendEl: HTMLSelectElement | null = null;
    private attachEl: HTMLSelectElement | null = null;
    private slot: string | null = null;

    private toHex(r: number, g: number, b: number) {
        const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
        return `#${h(r)}${h(g)}${h(b)}`;
    }

    private apply() {
        const c = spineController$.getValue();
        if (!c || !this.slot || !this.colorEl || !this.alphaEl) return;
        const hex = this.colorEl.value;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        c.setSlotColor(this.slot, r, g, b, parseFloat(this.alphaEl.value));
    }

    private populate(slot: string | null) {
        this.slot = slot;
        const c = spineController$.getValue();
        const state = slot && c ? c.getSlotState(slot) : null;
        const section = document.getElementById('section-slot-edit') as HTMLDetailsElement | null;
        setSectionVisible('section-slot-edit', !!state);
        if (!state || !slot) return;

        // It sits low in the panel — bring it into view so a selection isn't missed.
        if (section) { section.open = true; section.scrollIntoView({ block: 'nearest' }); }

        if (this.nameEl) this.nameEl.textContent = slot;
        if (this.colorEl) this.colorEl.value = this.toHex(state.r, state.g, state.b);
        if (this.alphaEl) this.alphaEl.value = String(state.a);
        if (this.blendEl) this.blendEl.value = String(state.blend);
        if (this.attachEl) {
            this.attachEl.innerHTML = '';
            for (const name of state.attachments) {
                const o = document.createElement('option');
                o.value = name; o.textContent = name;
                this.attachEl.appendChild(o);
            }
            const hide = document.createElement('option');
            hide.value = HIDE; hide.textContent = '— hide —';
            this.attachEl.appendChild(hide);
            this.attachEl.value = state.attachment ?? HIDE;
        }
    }

    async HandleInitUI() {
        this.nameEl = document.getElementById('slot-edit-name');
        this.colorEl = document.getElementById('slot-color') as HTMLInputElement;
        this.alphaEl = document.getElementById('slot-alpha') as HTMLInputElement;
        this.blendEl = document.getElementById('slot-blend') as HTMLSelectElement;
        this.attachEl = document.getElementById('slot-attachment') as HTMLSelectElement;

        this.colorEl?.addEventListener('input', () => this.apply());
        this.alphaEl?.addEventListener('input', () => this.apply());
        this.blendEl?.addEventListener('change', () => {
            const c = spineController$.getValue();
            if (c && this.slot && this.blendEl) c.setSlotBlend(this.slot, Number(this.blendEl.value) as BlendMode);
        });
        this.attachEl?.addEventListener('change', () => {
            const c = spineController$.getValue();
            if (c && this.slot && this.attachEl) {
                const v = this.attachEl.value;
                c.setSlotAttachment(this.slot, v === HIDE ? null : v);
            }
        });

        setSectionVisible('section-slot-edit', false);
        this.trackDataSub(selectedSlot$.subscribe(slot => this.populate(slot)));
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
