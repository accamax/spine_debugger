// Show or hide a side-panel <details> section by id, so sections with nothing to
// show (no skins, no events, empty state) drop out of the panel entirely.
export function setSectionVisible(id: string, visible: boolean) {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? "" : "none";
}
