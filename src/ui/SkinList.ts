import { selectedSkin$, skinsList$ } from "../state/RxStores";
import { VisualComponent } from "../core/VisualComponent";

// Lists the skeleton's skins and switches the active one on click. Unlike the
// slot list this is single-select — a skeleton always has exactly one skin
// applied, so clicking picks it rather than toggling.
export class SkinList extends VisualComponent {
    private listEl: HTMLUListElement | null = null;

    private populate(names: string[]) {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        if (names.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty';
            li.textContent = '(no skins)';
            this.listEl.appendChild(li);
            return;
        }

        const selected = selectedSkin$.getValue();
        for (const name of names) {
            const li = document.createElement('li');
            li.textContent = name;
            li.dataset.name = name;
            if (name === selected) li.classList.add('selected');
            li.addEventListener('click', () => {
                if (selectedSkin$.getValue() !== name) selectedSkin$.next(name);
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
        this.listEl = document.getElementById('skins-list') as HTMLUListElement;
        this.trackDataSub(skinsList$.subscribe(names => this.populate(names)));
        this.trackDataSub(selectedSkin$.subscribe(name => this.updateSelection(name)));
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
