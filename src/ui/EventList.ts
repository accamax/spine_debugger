import { eventNamesList$ } from "../state/RxStores";
import { VisualComponent } from "../core/VisualComponent";

export class EventList extends VisualComponent {
    private listEl: HTMLUListElement | null = null;

    private populate(names: string[]) {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        if (names.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty';
            li.textContent = '(no events)';
            this.listEl.appendChild(li);
            return;
        }

        for (const name of names) {
            const li = document.createElement('li');
            li.textContent = name;
            this.listEl.appendChild(li);
        }
    }

    async HandleInitUI() {
        this.listEl = document.getElementById('events-list') as HTMLUListElement;
        this.trackDataSub(eventNamesList$.subscribe(names => this.populate(names)));
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
