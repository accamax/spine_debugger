import { selectedBone$, spineController$ } from "../state/RxStores";
import { setSectionVisible } from "./sectionVisibility";
import { VisualComponent } from "../core/VisualComponent";

// Live posing for the selected bone: rotation / x / y offsets on top of the
// animation, plus a uniform scale multiplier. Reset clears the bone's edit.
export class BoneEditor extends VisualComponent {
    private nameEl: HTMLElement | null = null;
    private rotEl: HTMLInputElement | null = null;
    private xEl: HTMLInputElement | null = null;
    private yEl: HTMLInputElement | null = null;
    private scaleEl: HTMLInputElement | null = null;
    private bone: string | null = null;

    private apply() {
        const c = spineController$.getValue();
        if (!c || !this.bone || !this.rotEl || !this.xEl || !this.yEl || !this.scaleEl) return;
        c.setBoneEdit(this.bone, {
            rotation: parseFloat(this.rotEl.value),
            x: parseFloat(this.xEl.value),
            y: parseFloat(this.yEl.value),
            scale: parseFloat(this.scaleEl.value),
        });
    }

    private seed(edit: { rotation: number; x: number; y: number; scale: number }) {
        if (this.rotEl) this.rotEl.value = String(edit.rotation);
        if (this.xEl) this.xEl.value = String(edit.x);
        if (this.yEl) this.yEl.value = String(edit.y);
        if (this.scaleEl) this.scaleEl.value = String(edit.scale);
    }

    private populate(bone: string | null) {
        this.bone = bone;
        const c = spineController$.getValue();
        const section = document.getElementById('section-bone-edit') as HTMLDetailsElement | null;
        setSectionVisible('section-bone-edit', !!(bone && c));
        if (!bone || !c) return;
        // Bring it into view so a selection isn't missed.
        if (section) { section.open = true; section.scrollIntoView({ block: 'nearest' }); }
        if (this.nameEl) this.nameEl.textContent = bone;
        this.seed(c.getBoneEdit(bone));
    }

    async HandleInitUI() {
        this.nameEl = document.getElementById('bone-edit-name');
        this.rotEl = document.getElementById('bone-rotation') as HTMLInputElement;
        this.xEl = document.getElementById('bone-x') as HTMLInputElement;
        this.yEl = document.getElementById('bone-y') as HTMLInputElement;
        this.scaleEl = document.getElementById('bone-scale') as HTMLInputElement;

        [this.rotEl, this.xEl, this.yEl, this.scaleEl].forEach(el =>
            el?.addEventListener('input', () => this.apply()));

        document.getElementById('bone-reset')?.addEventListener('click', () => {
            const c = spineController$.getValue();
            if (c && this.bone) c.resetBone(this.bone);
            this.seed({ rotation: 0, x: 0, y: 0, scale: 1 });
        });

        setSectionVisible('section-bone-edit', false);
        this.trackDataSub(selectedBone$.subscribe(bone => this.populate(bone)));
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
