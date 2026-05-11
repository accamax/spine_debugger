import { Assets, UnresolvedAsset } from 'pixi.js';
import { SpineTexture, TextureAtlas } from '@esotericsoftware/spine-pixi-v8';

export class SpineLoader {

    constructor() { }

    async loadSpineAssets(files: File[]): Promise<void> {
        const jsonFile = files.find(f => f.name.toLowerCase().endsWith('.json'));
        const atlasFile = files.find(f => f.name.toLowerCase().endsWith('.atlas'));

        if (!jsonFile) throw new Error('No .json skeleton file provided.');
        if (!atlasFile) throw new Error('No .atlas file provided.');

        const imageFiles = files.filter(f => f !== jsonFile && f !== atlasFile);

        const atlasText = await atlasFile.text();
        const textureAtlas = new TextureAtlas(atlasText);

        const imagesByName = new Map<string, File>();
        for (const f of imageFiles) {
            imagesByName.set(f.name.toLowerCase(), f);
        }

        const pageToFile = new Map<string, File>();
        const missing: string[] = [];
        for (const page of textureAtlas.pages) {
            const file = imagesByName.get(page.name.toLowerCase());
            if (file) {
                pageToFile.set(page.name, file);
            } else {
                missing.push(page.name);
            }
        }

        if (missing.length > 0) {
            throw new Error(
                `Atlas references texture file(s) not provided: ${missing.join(', ')}.`
            );
        }

        const blobUrls: string[] = [];
        const jsonURL = URL.createObjectURL(jsonFile);
        blobUrls.push(jsonURL);

        try {
            const loadAssets: UnresolvedAsset[] = [
                {
                    alias: 'spineSkeleton',
                    src: jsonURL,
                    parser: 'loadJson',
                },
            ];

            for (const [pageName, imageFile] of pageToFile) {
                const url = URL.createObjectURL(imageFile);
                blobUrls.push(url);
                loadAssets.push({
                    alias: pageName,
                    src: url,
                    parser: 'loadTextures',
                });
            }

            await Assets.load(loadAssets, this.onSpineProgress);

            for (const page of textureAtlas.pages) {
                const texture = Assets.get(page.name);
                page.setTexture(SpineTexture.from(texture.source));
            }

            Assets.cache.set('atlas', textureAtlas);
        } finally {
            for (const url of blobUrls) {
                URL.revokeObjectURL(url);
            }
        }
    }


    private onSpineProgress(v: any) {
        console.log("Spine load progress: ", v);
    }
}
