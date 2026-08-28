import { bonesList$, selectedBone$ } from "../state/RxStores";
import { setSectionVisible } from "./sectionVisibility";
import { VisualComponent } from "../core/VisualComponent";

// Lists the skeleton's bones; clicking one highlights it in the viewport (and
// clicking again clears it). Pairs with the Draw Bones overlay.
export class BoneList extends VisualComponent {
    private listEl: HTMLUListElement | null = null;

    private populate(names: string[]) {
        setSectionVisible('section-bones', names.length > 0);
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        if (names.length === 0) return;

        const selected = selectedBone$.getValue();
        for (const name of names) {
            const li = document.createElement('li');
            li.textContent = name;
            li.dataset.name = name;
            if (name === selected) li.classList.add('selected');
            li.addEventListener('click', () => {
                const current = selectedBone$.getValue();
                selectedBone$.next(current === name ? null : name);
            });
            this.listEl.appendChild(li);
        }
    }

    private updateSelection(name: string | null) {
        if (!this.listEl) return;
        this.listEl.querySelectorAll<HTMLLIElement>('li').forEach(li => {
            li.classList.toggle('selected', li.dataset.name === name);
        });
    }

    async HandleInitUI() {
        this.listEl = document.getElementById('bones-list') as HTMLUListElement;
        this.trackDataSub(bonesList$.subscribe(names => this.populate(names)));
        this.trackDataSub(selectedBone$.subscribe(name => this.updateSelection(name)));
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
