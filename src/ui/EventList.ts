import { eventDefsList$ } from "../state/RxStores";
import { SpineEventDef } from "../Spine/SpineController";
import { audioBank } from "../state/AudioBank";
import { setSectionVisible } from "./sectionVisibility";
import { VisualComponent } from "../core/VisualComponent";

export class EventList extends VisualComponent {
    private listEl: HTMLUListElement | null = null;

    private chip(text: string): HTMLElement {
        const span = document.createElement('span');
        span.className = 'event-param';
        span.textContent = text;
        return span;
    }

    private renderEvent(def: SpineEventDef): HTMLElement {
        const li = document.createElement('li');
        li.className = 'event-item';

        const name = document.createElement('div');
        name.className = 'event-name';
        name.textContent = def.name;
        li.appendChild(name);

        // Only surface params that were actually set — an event with all
        // defaults just shows its name.
        const params = document.createElement('div');
        params.className = 'event-params';
        if (def.intValue !== 0) params.appendChild(this.chip(`int ${def.intValue}`));
        if (def.floatValue !== 0) params.appendChild(this.chip(`float ${def.floatValue}`));
        if (def.stringValue) params.appendChild(this.chip(`"${def.stringValue}"`));
        if (params.childElementCount > 0) li.appendChild(params);

        if (def.audioPath) {
            const audio = document.createElement('div');
            audio.className = 'event-audio';

            const play = document.createElement('button');
            play.className = 'event-play';
            play.type = 'button';
            play.textContent = '▶';
            const url = audioBank.get(def.audioPath);
            if (url) {
                play.title = `Play ${def.audioPath}`;
                play.addEventListener('click', () => {
                    const a = new Audio(url);
                    a.volume = Math.max(0, Math.min(1, def.volume || 1));
                    a.play().catch(() => { /* autoplay/user-gesture guards */ });
                });
            } else {
                play.disabled = true;
                play.title = 'Audio file not loaded — include it with the drop';
            }
            audio.appendChild(play);

            const path = document.createElement('span');
            path.className = 'event-audio-path';
            path.textContent = def.audioPath;
            path.title = def.audioPath;
            audio.appendChild(path);

            li.appendChild(audio);
        }

        return li;
    }

    private populate(defs: SpineEventDef[]) {
        setSectionVisible('section-events', defs.length > 0);
        if (!this.listEl) return;
        this.listEl.innerHTML = '';
        for (const def of defs) {
            this.listEl.appendChild(this.renderEvent(def));
        }
    }

    async HandleInitUI() {
        this.listEl = document.getElementById('events-list') as HTMLUListElement;
        this.trackDataSub(eventDefsList$.subscribe(defs => this.populate(defs)));
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
