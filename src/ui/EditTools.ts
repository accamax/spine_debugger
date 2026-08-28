import { selectedSlot$, selectedBone$, spineController$ } from "../state/RxStores";
import { VisualComponent } from "../core/VisualComponent";

// Global edit actions: save the current frame as a PNG, and clear all live edits.
export class EditTools extends VisualComponent {
    async HandleInitUI() {
        document.getElementById('save-png')?.addEventListener('click', () => {
            spineController$.getValue()?.savePng();
        });

        document.getElementById('reset-edits')?.addEventListener('click', () => {
            spineController$.getValue()?.clearEdits();
            // Re-seed the open editors from setup pose.
            selectedSlot$.next(selectedSlot$.getValue());
            selectedBone$.next(selectedBone$.getValue());
        });
    }

    async HandleEmptyDisplay() { }
    async HandleLoadSpine() { }
    async HandleActiveDisplay() { }
    async HandleReplaceSpine() { }
    async HandleClearSpine() { }
}
