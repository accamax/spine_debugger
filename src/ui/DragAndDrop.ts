import Dropzone from "dropzone";

type SpineFileProcessor = (files: File[]) => void;

export function EnableDragAndDrop(editorElement: HTMLElement, cb: SpineFileProcessor) {
    const dropzone = new Dropzone(".droppable_zone", {
        url: "/",
        previewsContainer: false,
        clickable: true,
    });

    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        editorElement.addEventListener(eventName, (e) => e.preventDefault());
        editorElement.addEventListener(eventName, (e) => e.stopPropagation());
    });

    editorElement.addEventListener("dragover", (e) => {
        editorElement.classList.add("drag-over");

        if (e.dataTransfer?.types[0] === 'Files') {
            setupBorderChangeColor(editorElement, 'green');
        }
    });

    editorElement.addEventListener("dragleave", (e) => {
        setupBorderChangeColor(editorElement, 'red');
    });

    ["dragleave", "drop"].forEach(eventName => {
        editorElement.addEventListener(eventName, () => {
            editorElement.classList.remove("drag-over");
        });
    });

    dropzone.on("addedfiles", (event: Dropzone.DropzoneFile[]) => {
        const files = Array.from(event);
        if (files.length === 0) return;

        cb(files);
    });
}

export function showDropMessage(text: string) {
    const el = document.getElementById('drop_message');
    if (el) el.textContent = text;
}


function setupBorderChangeColor(element: HTMLElement, color: string) {
    element.style.borderColor = color;
}
