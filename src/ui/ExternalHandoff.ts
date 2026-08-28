type SpineFileProcessor = (files: File[]) => void;

// Origins allowed to hand us a spine set. The Accamax vault is private
// (Cloudflare Access, no CORS), so rather than give us URLs to fetch it opens
// this tool in a tab and postMessages the already-fetched File objects across.
const ALLOWED_ORIGIN =
    /^https:\/\/vault\.accamax\.com$|^http:\/\/localhost(:\d+)?$|^http:\/\/127\.0\.0\.1(:\d+)?$/;

// Listen for a spine set handed over from an allowed opener and load it the same
// way a drag-and-drop would. Announces readiness to the opener so it knows when
// it's safe to post.
export function EnableExternalHandoff(cb: SpineFileProcessor) {
    window.addEventListener("message", (e: MessageEvent) => {
        if (!ALLOWED_ORIGIN.test(e.origin)) return;
        if (!e.data || e.data.type !== "spine-debugger-load") return;

        const files = e.data.files;
        if (Array.isArray(files) && files.length > 0) {
            cb(files as File[]);
        }
    });

    // A contentless "I'm listening" ping to whoever opened us — the opener waits
    // for this before sending the files, which avoids a load-timing race.
    if (window.opener) {
        window.opener.postMessage({ type: "spine-debugger-ready" }, "*");
    }
}
