import { VisualComponent } from "../core/VisualComponent";
import { drawBonesOnSpine$, drawBoundsOnSpine$, enableLoopOnSpine$ } from "../state/RxStores";

export class AnimationOptions extends VisualComponent {
    private inputs: Record<string, HTMLInputElement> = {};

    async HandleInitUI(): Promise<void> {
        // Grab all checkboxes with data-key
        const checkboxes = document.querySelectorAll<HTMLInputElement>(
            'input[type="checkbox"][data-key]'
        );

        checkboxes.forEach(checkbox => {
            const key = checkbox.getAttribute('data-key');
            if (!key) return;

            this.inputs[key] = checkbox;

            // Listen for user changes → update reactive store
            checkbox.addEventListener('change', () => {
                const checked = checkbox.checked;
                if (key === "drawBounds") {
                    drawBoundsOnSpine$.next(checked);
                } else if (key === "drawBones") {
                    drawBonesOnSpine$.next(checked);
                } else if (key === "enableLoop") {
                    enableLoopOnSpine$.next(checked);
                }
            });

            // Reset checkbox visually
            checkbox.checked = false;
        });

        // Reset stores
        drawBoundsOnSpine$.next(false);
        drawBonesOnSpine$.next(false);
        enableLoopOnSpine$.next(true);

        drawBoundsOnSpine$.subscribe(enabled => {
            const input = this.inputs["drawBounds"];
            if (input && input.checked !== enabled) input.checked = enabled;
        })

        drawBonesOnSpine$.subscribe(enabled => {
            const input = this.inputs["drawBones"];
            if (input && input.checked !== enabled) input.checked = enabled;
        })

        enableLoopOnSpine$.subscribe(enabled => {
            const input = this.inputs["enableLoop"];
            if (input && input.checked !== enabled) input.checked = enabled;
        })

    }

    // Lifecycle handlers: reset checkboxes visually
    private resetCheckboxes() {
        Object.values(this.inputs).forEach(input => input.checked = false);
        drawBoundsOnSpine$.next(false);
        drawBonesOnSpine$.next(false);
        enableLoopOnSpine$.next(false);
    }

    async HandleEmptyDisplay(): Promise<void> {
        this.resetCheckboxes();
    }

    async HandleClearSpine(): Promise<void> {
        this.resetCheckboxes();
    }

    async HandleLoadSpine(): Promise<void> { }
    async HandleActiveDisplay(): Promise<void> { }
    async HandleReplaceSpine(): Promise<void> { }
}
