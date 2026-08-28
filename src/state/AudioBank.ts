// Holds object URLs for any audio files loaded alongside a skeleton so event
// sounds can be played back. Spine event `audioPath`s are relative to the
// skeleton's audio root, but the files handed to us are bare names — so we key
// by basename, and also by basename-without-extension for exports whose
// audioPath omits the extension.
class AudioBank {
    private byName = new Map<string, string>();

    private static base(path: string): string {
        const name = path.split(/[\\/]/).pop() ?? path;
        return name.toLowerCase();
    }

    private static stripExt(name: string): string {
        return name.replace(/\.[^.]+$/, "");
    }

    /** Replace the bank with the audio files from a freshly loaded set. */
    set(files: File[]) {
        this.clear();
        for (const f of files) {
            if (!/\.(ogg|mp3|wav|m4a|aac)$/i.test(f.name)) continue;
            const url = URL.createObjectURL(f);
            const base = AudioBank.base(f.name);
            this.byName.set(base, url);
            this.byName.set(AudioBank.stripExt(base), url);
        }
    }

    /** Object URL for an event's audioPath, or undefined if it wasn't loaded. */
    get(audioPath: string): string | undefined {
        const base = AudioBank.base(audioPath);
        return this.byName.get(base) ?? this.byName.get(AudioBank.stripExt(base));
    }

    has(audioPath: string): boolean {
        return this.get(audioPath) !== undefined;
    }

    clear() {
        for (const url of new Set(this.byName.values())) URL.revokeObjectURL(url);
        this.byName.clear();
    }
}

export const audioBank = new AudioBank();
