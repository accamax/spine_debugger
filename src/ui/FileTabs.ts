import { skeletonInfo$ } from "../state/RxStores";
import { fileBank, AtlasPageView } from "../state/FileBank";
import { setSectionVisible } from "./sectionVisibility";
import { VisualComponent } from "../core/VisualComponent";

const TABS = ['viewer', 'json', 'atlas', 'images'] as const;
type Tab = typeof TABS[number];

// Tabs behind the main viewer for inspecting the raw files that make up a spine:
// the pretty-printed skeleton JSON, the atlas text, and each atlas page image
// with its packed regions overlaid.
export class FileTabs extends VisualComponent {
    private buttons: HTMLButtonElement[] = [];

    private switchTo(tab: Tab) {
        this.buttons.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        TABS.forEach(v => {
            const el = document.querySelector<HTMLElement>(`[data-view="${v}"]`);
            if (el) el.hidden = v !== tab;
        });
        // The stats and playback controls belong to the viewer only.
        const isViewer = tab === 'viewer';
        const stats = document.getElementById('stats');
        const controls = document.querySelector<HTMLElement>('.bottom_controls');
        if (stats) stats.style.display = isViewer ? '' : 'none';
        if (controls) controls.style.display = isViewer ? '' : 'none';
    }

    private renderPage(page: AtlasPageView): HTMLElement {
        const fig = document.createElement('figure');
        fig.className = 'atlas-page';

        const cap = document.createElement('figcaption');
        cap.className = 'atlas-page__cap';
        cap.textContent = `${page.image} · ${page.width}×${page.height} · ${page.regions.length} regions`;
        fig.appendChild(cap);

        const box = document.createElement('div');
        box.className = 'atlas-page__box';

        if (page.url) {
            const img = document.createElement('img');
            img.className = 'atlas-page__img';
            img.src = page.url;
            box.appendChild(img);

            if (page.width && page.height) {
                const overlay = document.createElement('div');
                overlay.className = 'atlas-page__regions';
                for (const r of page.regions) {
                    const d = document.createElement('div');
                    d.className = 'atlas-region';
                    d.style.left = (r.x / page.width * 100) + '%';
                    d.style.top = (r.y / page.height * 100) + '%';
                    d.style.width = (r.w / page.width * 100) + '%';
                    d.style.height = (r.h / page.height * 100) + '%';
                    d.title = `${r.name} · ${r.x},${r.y} · ${r.w}×${r.h}${r.rotated ? ' · rotated' : ''}`;
                    const label = document.createElement('span');
                    label.className = 'atlas-region__label';
                    label.textContent = r.name;
                    d.appendChild(label);
                    overlay.appendChild(d);
                }
                box.appendChild(overlay);
            }
        } else {
            const missing = document.createElement('div');
            missing.className = 'atlas-page__missing';
            missing.textContent = `image not provided: ${page.image}`;
            box.appendChild(missing);
        }

        fig.appendChild(box);
        return fig;
    }

    private populate() {
        const f = fileBank.get();

        const jsonEl = document.getElementById('file-json');
        if (jsonEl) {
            if (!f.skeleton) {
                jsonEl.textContent = '(no skeleton)';
            } else if (f.skeleton.binary) {
                jsonEl.textContent = `${f.skeleton.name}\n\nBinary .skel skeleton — not viewable as text.`;
            } else {
                try {
                    jsonEl.textContent = JSON.stringify(JSON.parse(f.skeleton.text!), null, 2);
                } catch {
                    jsonEl.textContent = f.skeleton.text!;
                }
            }
        }

        const atlasEl = document.getElementById('file-atlas');
        if (atlasEl) atlasEl.textContent = f.atlasText ?? '(no atlas)';

        const imagesEl = document.getElementById('file-images');
        if (imagesEl) {
            imagesEl.innerHTML = '';
            if (f.pages.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty';
                empty.textContent = '(no images)';
                imagesEl.appendChild(empty);
            } else {
                for (const p of f.pages) imagesEl.appendChild(this.renderPage(p));
            }
        }
    }

    async HandleInitUI() {
        this.buttons = [...document.querySelectorAll<HTMLButtonElement>('#view-tabs .tab')];
        this.buttons.forEach(b => b.addEventListener('click', () => this.switchTo(b.dataset.tab as Tab)));
        setSectionVisible('view-tabs', false);

        this.trackDataSub(skeletonInfo$.subscribe(info => {
            if (info) {
                this.populate();
                setSectionVisible('view-tabs', true);
            } else {
                this.switchTo('viewer');
                setSectionVisible('view-tabs', false);
            }
        }));
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
