import { selectedSlot$, slotsList$ } from "../state/RxStores";
import { VisualComponent } from "../core/VisualComponent";

export class SlotList extends VisualComponent {
    private listEl: HTMLUListElement | null = null;

    private populate(names: string[]) {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        if (names.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty';
            li.textContent = '(no slots)';
            this.listEl.appendChild(li);
            return;
        }

        const selected = selectedSlot$.getValue();
        for (const name of names) {
            const li = document.createElement('li');
            li.textContent = name;
            li.dataset.name = name;
            if (name === selected) li.classList.add('selected');
            li.addEventListener('click', () => {
                const current = selectedSlot$.getValue();
                selectedSlot$.next(current === name ? null : name);
            });
            this.listEl.appendChild(li);
        }
    }

    private updateSelection(name: string | null) {
        if (!this.listEl) return;
        const items = this.listEl.querySelectorAll<HTMLLIElement>('li');
        items.forEach(li => {
            if (li.dataset.name === name) li.classList.add('selected');
            else li.classList.remove('selected');
        });
    }

    async HandleInitUI() {
        this.listEl = document.getElementById('slots-list') as HTMLUListElement;
        this.trackDataSub(slotsList$.subscribe(names => this.populate(names)));
        this.trackDataSub(selectedSlot$.subscribe(name => this.updateSelection(name)));
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
