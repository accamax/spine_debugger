import { Assets } from "pixi.js";

// The bundled demo skeleton's files, so the inspector tabs (which work off the
// raw File[]) can show the default asset too, not just dropped ones.
const DEFAULT_SPINE_URLS = [
    './assets/spineboy.atlas',
    './assets/spineboy-ess.json',
    './assets/spineboy.png',
];

export async function fetchDefaultSpineFiles(): Promise<File[]> {
    return Promise.all(DEFAULT_SPINE_URLS.map(async (url) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new File([blob], url.split('/').pop()!, { type: blob.type });
    }));
}

export function EnableLoadDefaultSpineButton(cb: CallableFunction) {
    const button = document.getElementById('default_spine_button');

    button?.addEventListener('click', () => {
        LoadDefaultAnimaton().then(v => {
            cb();
        });
    });
}

export function toggleDisableDefaultButton(disable: boolean) {
    const button = document.getElementById('default_spine_button') as HTMLElement;
    if (disable) {
        console.log("Hiding default spine button");
        button.style.display = 'none';
    } else {
        button.style.display = '';
    }
}

function LoadDefaultAnimaton() {

    const onLoad = Assets.load([
        {
            alias: 'atlas',
            src: './assets/spineboy.atlas',
        },
        {
            alias: 'spineSkeleton',
            src: './assets/spineboy-ess.json',
        },
        {
            alias: 'spineImage',
            src: './assets/spineboy.png',
        },
    ]);


    onLoad.then((results) => {
        // console.log("Loaded default animation", results);
    });

    return onLoad;
}