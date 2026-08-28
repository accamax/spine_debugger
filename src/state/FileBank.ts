// Retains the raw files that make up a loaded spine so the file-inspector tabs
// can show them: the skeleton (json text, or a flag for binary .skel), the atlas
// text, and each atlas page image with its packed region rectangles.

export type AtlasRegionRect = {
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rotated: boolean;
};

export type AtlasPageView = {
    image: string;
    width: number;
    height: number;
    url: string | null;
    regions: AtlasRegionRect[];
};

export type SpineFiles = {
    skeleton: { name: string; text: string | null; binary: boolean } | null;
    atlasName: string | null;
    atlasText: string | null;
    pages: AtlasPageView[];
};

const IMAGE_RE = /\.(png|webp|jpe?g)$/i;

const ints = (csv: string) => csv.split(',').map(n => parseInt(n.trim(), 10));

// Parse pages and regions out of atlas text. Property lines contain a colon;
// bare lines are names (the first after a blank line is a page image, the rest
// are regions). For a rotated region the packed rectangle on the page is the
// region's dimensions swapped.
function parseAtlasPages(text: string): AtlasPageView[] {
    const pages: AtlasPageView[] = [];
    let page: AtlasPageView | null = null;
    let regionName: string | null = null;
    let props: Record<string, string> = {};
    let expectPageName = true;

    const flushRegion = () => {
        if (page && regionName !== null) {
            let x = 0, y = 0, w = 0, h = 0;
            if (props.bounds) [x, y, w, h] = ints(props.bounds);
            else {
                if (props.xy) [x, y] = ints(props.xy);
                if (props.size) [w, h] = ints(props.size);
            }
            const rotated = props.rotate === 'true' || props.rotate === '90' || props.rotate === '270';
            page.regions.push({ name: regionName, x, y, w: rotated ? h : w, h: rotated ? w : h, rotated });
        }
        regionName = null;
        props = {};
    };

    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (line === '') { flushRegion(); expectPageName = true; continue; }

        const ci = line.indexOf(':');
        if (ci !== -1) {
            const key = line.slice(0, ci).trim();
            const val = line.slice(ci + 1).trim();
            if (regionName !== null) props[key] = val;
            else if (page && key === 'size') [page.width, page.height] = ints(val);
            continue;
        }

        if (expectPageName) {
            flushRegion();
            page = { image: line, width: 0, height: 0, url: null, regions: [] };
            pages.push(page);
            expectPageName = false;
        } else {
            flushRegion();
            regionName = line;
        }
    }
    flushRegion();
    return pages;
}

class FileBank {
    private data: SpineFiles = { skeleton: null, atlasName: null, atlasText: null, pages: [] };

    async set(files: File[]) {
        this.clear();

        const atlasFile = files.find(f => /\.atlas$/i.test(f.name));
        const jsonFile = files.find(f => /\.json$/i.test(f.name));
        const skelFile = files.find(f => /\.skel$/i.test(f.name));
        const images = files.filter(f => IMAGE_RE.test(f.name));

        if (jsonFile) {
            this.data.skeleton = { name: jsonFile.name, text: await jsonFile.text(), binary: false };
        } else if (skelFile) {
            this.data.skeleton = { name: skelFile.name, text: null, binary: true };
        }

        if (atlasFile) {
            this.data.atlasName = atlasFile.name;
            this.data.atlasText = await atlasFile.text();
            const pages = parseAtlasPages(this.data.atlasText);
            for (const p of pages) {
                const img = images.find(f => f.name.toLowerCase() === p.image.toLowerCase());
                if (img) p.url = URL.createObjectURL(img);
            }
            this.data.pages = pages;
        }
    }

    get(): SpineFiles {
        return this.data;
    }

    clear() {
        for (const p of this.data.pages) if (p.url) URL.revokeObjectURL(p.url);
        this.data = { skeleton: null, atlasName: null, atlasText: null, pages: [] };
    }
}

export const fileBank = new FileBank();
