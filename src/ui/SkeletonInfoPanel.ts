import { skeletonInfo$ } from "../state/RxStores";
import { SkeletonInfo } from "../Spine/SpineController";
import { setSectionVisible } from "./sectionVisibility";
import { VisualComponent } from "../core/VisualComponent";

// The skeleton's static metadata (export version, hash, counts) as a labelled
// list. The version/hash are the quickest way to confirm which Spine version an
// asset was exported from — the thing a mismatched runtime silently trips on.
export class SkeletonInfoPanel extends VisualComponent {
    private listEl: HTMLElement | null = null;

    private row(label: string, value: string | number): HTMLElement {
        const row = document.createElement('div');
        row.className = 'info-row';

        const dt = document.createElement('span');
        dt.className = 'info-label';
        dt.textContent = label;

        const dd = document.createElement('span');
        dd.className = 'info-value';
        dd.textContent = String(value);
        dd.title = String(value);

        row.append(dt, dd);
        return row;
    }

    private populate(info: SkeletonInfo | null) {
        setSectionVisible('section-skeleton', info !== null);
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        if (info === null) return;

        const constraints =
            info.ikConstraints +
            info.transformConstraints +
            info.pathConstraints +
            info.physicsConstraints;

        this.listEl.append(
            this.row('Spine version', info.version),
            this.row('Hash', info.hash),
            this.row('FPS', info.fps || '—'),
            this.row('Setup size', `${info.width} × ${info.height}`),
            this.row('Bones', info.bones),
            this.row('Slots', info.slots),
            this.row('Skins', info.skins),
            this.row('Animations', info.animations),
            this.row('Events', info.events),
            this.row('Constraints', constraints),
        );
    }

    async HandleInitUI() {
        this.listEl = document.getElementById('skeleton-info');
        this.trackDataSub(skeletonInfo$.subscribe(info => this.populate(info)));
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
