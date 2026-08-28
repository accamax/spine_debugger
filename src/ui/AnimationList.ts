import { animationList$, selectedAnimation$ } from "../state/RxStores";
import { setSectionVisible } from "./sectionVisibility";
import { VisualComponent } from "../core/VisualComponent";



export class AnimationList extends VisualComponent {



    private populateAnimationsList(animNames: string[]) {
        setSectionVisible('section-animations', animNames.length > 0);
        const list = document.getElementById('animations-list')!;
        list.innerHTML = ""; // clear previous items

        if (animNames.length === 0) return;

        animNames.forEach(animName => {
            const li = document.createElement('li');
            li.textContent = animName;
            li.addEventListener('click', () => selectedAnimation$.next(animName));
            list.appendChild(li);
        });
    }

    async HandleInitUI() {
        this.trackDataSub(
            animationList$.subscribe(anims => {
                this.populateAnimationsList(anims)
            })
        );
    }

    async HandleEmptyDisplay(): Promise<void> {

    }

    async HandleLoadSpine(): Promise<void> {

        // const animNames = ['test_anim_1', 'test_anim_2'];

        // this.populateAnimationsList(animNames, (animName) => {

        // });
    }

    async HandleActiveDisplay(): Promise<void> {

    }

    async HandleReplaceSpine(): Promise<void> {

    }

    async HandleClearSpine(): Promise<void> {

    }
}