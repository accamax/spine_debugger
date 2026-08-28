import { BlendMode, Bone, NumberArrayLike, RegionAttachment, Spine, EventTimeline, Slot } from "@esotericsoftware/spine-pixi-v8";
import { Container, Graphics, Point, Rectangle, Ticker } from "pixi.js";
import { isPlaying$, pixiApp$ } from "../state/RxStores";

// Live, non-destructive edits re-applied every frame after the animation writes
// the pose (see beforeUpdateWorldTransforms). Bone edits are offsets on top of
// the animation; slot colour/attachment are absolute overrides.
type SlotEdit = { r: number; g: number; b: number; a: number } | undefined;
type BoneEdit = { rotation: number; x: number; y: number; scale: number };



export class SpineController extends Container {
    private _spine: Spine;
    private graphics: Graphics;
    private _attachmentBounds: Graphics;
    private _boundsDebugGraphics: Graphics;
    private _loop: boolean = true;
    private _isPlaying = false;

    private _drawBounds = false;
    private _drawBones = false;

    private _slotMarker: Graphics;
    private _selectedSlot: Slot | null = null;
    private _markerTmpPoint: Point = new Point();

    private _bonesDebugGraphics: Graphics;
    private _boneMarker: Graphics;
    private _selectedBone: Bone | null = null;

    // Live edits (see beforeUpdateWorldTransforms).
    private _slotColor = new Map<string, SlotEdit>();
    private _slotAttachment = new Map<string, string | null>();
    private _boneEdits = new Map<string, BoneEdit>();
    private _originalBlend = new Map<string, BlendMode>();

    get isLooping() {
        return this._loop;
    }

    public IsPlaying() {
        return this._isPlaying;
    }

    constructor(parent: Container/* , private timelinePlayer: TimelinePlayer */) {
        super();

        this.label = 'SpineRender';

        const spineParent = new Container();
        const debugParent = new Container();

        parent.addChild(spineParent);
        parent.addChild(debugParent);

        this._spine = Spine.from({
            atlas: "atlas",
            skeleton: "spineSkeleton",
        });

        spineParent.addChild(this._spine);

        // Re-apply live edits after the animation sets the pose, before world
        // transforms are computed.
        this._spine.beforeUpdateWorldTransforms = () => this.applyEdits();

        this.graphics = new Graphics();
        debugParent.addChild(this.graphics);

        this._attachmentBounds = new Graphics();
        debugParent.addChild(this._attachmentBounds);

        this._boundsDebugGraphics = new Graphics();
        debugParent.addChild(this._boundsDebugGraphics);

        // Bone overlay shares the skeleton's coordinate space, same as the
        // bounds overlay above.
        this._bonesDebugGraphics = new Graphics();
        debugParent.addChild(this._bonesDebugGraphics);

        // Slot marker lives on the pixi stage so it stays a fixed on-screen size regardless of canvas zoom.
        this._slotMarker = new Graphics()
            .circle(0, 0, 8)
            .fill({ color: 0x00e5ff })
            .stroke({ color: 0x000000, width: 2 });
        this._slotMarker.zIndex = 2000;
        this._slotMarker.visible = false;
        parent.parent?.addChild(this._slotMarker);

        // Highlights a bone picked from the Bones list — on the stage like the
        // slot marker so it stays a fixed size regardless of zoom.
        this._boneMarker = new Graphics()
            .circle(0, 0, 7)
            .fill({ color: 0xff9800 })
            .stroke({ color: 0x000000, width: 2 });
        this._boneMarker.zIndex = 2001;
        this._boneMarker.visible = false;
        parent.parent?.addChild(this._boneMarker);

        this.boundsArea = new Rectangle(this._spine.x, this._spine.y, this._spine.width, this._spine.height);

        // Play button changes
        // this.timelinePlayer.onPlayChange((isPlaying) => {
        //     this._spine.state.timeScale = isPlaying ? 1 : 0;
        // });

        // // Timeline value changes
        // this.timelinePlayer.onTimeChange((value) => {

        //     if (this.timelinePlayer.isChangingTimeManually()) {
        //         // If the time is being changed manually, we can update the spine state directly
        //         const currentAnim = this._spine.state.getCurrent(0);

        //         if (currentAnim) {
        //             currentAnim.trackTime = value;
        //             this._spine.state.update(0.016);
        //         }
        //     }
        // });

        Ticker.shared.add(this.onUpdate, this);

        // const controlPanel = new ControlPanelController();
        // controlPanel.setToggle('enableLoop', this._loop);
    }

    onUpdate(ticker?: Ticker): void {
        // if (!this.timelinePlayer.getIsPlaying()) return;

        // const currentEntry = this._spine.state.getCurrent(0);
        // if (currentEntry) {
        //     const currentTime = currentEntry.getAnimationTime();
        //     this.timelinePlayer.setTime(currentTime);
        // }

        if (this._drawBounds) {
            this.drawBoundsForAttachment();
        }

        if (this._drawBones) {
            this.drawBones();
        }

        this.updateSlotMarker();
        this.updateBoneMarker();
    }

    private updateBoneMarker() {
        if (!this._selectedBone) {
            if (this._boneMarker.visible) this._boneMarker.visible = false;
            return;
        }

        this._markerTmpPoint.set(this._selectedBone.worldX, this._selectedBone.worldY);
        const global = this._spine.toGlobal(this._markerTmpPoint, this._markerTmpPoint);
        this._boneMarker.position.copyFrom(global);
        this._boneMarker.visible = true;
    }

    private updateSlotMarker() {
        if (!this._selectedSlot) {
            if (this._slotMarker.visible) this._slotMarker.visible = false;
            return;
        }

        this._markerTmpPoint.set(this._selectedSlot.bone.worldX, this._selectedSlot.bone.worldY);
        const global = this._spine.toGlobal(this._markerTmpPoint, this._markerTmpPoint);
        this._slotMarker.position.copyFrom(global);
        this._slotMarker.visible = true;
    }

    public getSlotNames(): string[] {
        return this._spine.skeleton.data.slots.map(s => s.name);
    }

    public getSkinNames(): string[] {
        return this._spine.skeleton.data.skins.map(s => s.name);
    }

    public getBoneNames(): string[] {
        return this._spine.skeleton.data.bones.map(b => b.name);
    }

    public setSelectedBone(name: string | null): void {
        if (name === null) {
            this._selectedBone = null;
            return;
        }
        const bone = this._spine.skeleton.findBone(name);
        if (!bone) {
            console.warn(`Bone not found on skeleton: ${name}`);
            this._selectedBone = null;
            return;
        }
        this._selectedBone = bone;
    }

    public getCurrentSkinName(): string | null {
        return (
            this._spine.skeleton.skin?.name ??
            this._spine.skeleton.data.defaultSkin?.name ??
            null
        );
    }

    // Swap the active skin. Attachments missing from it still fall back to the
    // default skin. Slots must be reset to setup pose or the old skin's
    // attachments linger.
    public setSkin(name: string | null) {
        if (!name) return;
        const skeleton = this._spine.skeleton;
        skeleton.setSkinByName(name);
        skeleton.setSlotsToSetupPose();
    }

    public getEventNames(): string[] {
        return this._spine.skeleton.data.events.map(e => e.name);
    }

    // Event definitions with their default params and audio settings, read off
    // SkeletonData at load time (independent of any animation).
    public getEventDefinitions(): SpineEventDef[] {
        return this._spine.skeleton.data.events.map(e => ({
            name: e.name,
            intValue: e.intValue,
            floatValue: e.floatValue,
            stringValue: e.stringValue,
            audioPath: e.audioPath,
            volume: e.volume,
            balance: e.balance,
        }));
    }

    public setSelectedSlot(name: string | null): void {
        if (name === null) {
            this._selectedSlot = null;
            return;
        }
        const slot = this._spine.skeleton.findSlot(name);
        if (!slot) {
            console.warn(`Slot not found on skeleton: ${name}`);
            this._selectedSlot = null;
            return;
        }
        this._selectedSlot = slot;
    }

    public setPlay(playing: boolean) {
        this._isPlaying = playing;
        this._spine.state.timeScale = playing ? 1 : 0;
    }

    public play(animName: string) {
        const trackEntry = this._spine.state.setAnimation(0, animName, this._loop);
        const duration = trackEntry.animationEnd - trackEntry.animationStart;
        this._isPlaying = true;

        isPlaying$.next(this._isPlaying);

        // this.timelinePlayer.setDuration(duration);
        // this.timelinePlayer.setTime(0);
    }

    public getCurrentDurationOfAnimation() {
        const currentEntry = this._spine.state.getCurrent(0);
        return currentEntry?.getAnimationTime() || 0.0;
    }

    public getTotalDurationOfAnimation() {
        const currentEntry = this._spine.state.getCurrent(0);
        return currentEntry ? currentEntry.animationEnd - currentEntry.animationStart : 0;
    }

    public setTime(time: number) {
        const currentEntry = this._spine.state.getCurrent(0);
        if (currentEntry) {
            currentEntry.trackTime = time;
        }
    }

    public toggleLoop(loop: boolean) {
        this._loop = loop;
        const currentEntry = this._spine.state.getCurrent(0);
        if (currentEntry) {
            currentEntry.loop = loop;
        }

    }

    public getAnimationNames() {
        return this._spine.skeleton.data.animations.map(anim => anim.name);
    }

    // Static, per-skeleton metadata read straight off the loaded SkeletonData —
    // handy for confirming the export version and seeing the shape at a glance.
    public getSkeletonInfo(): SkeletonInfo {
        const data = this._spine.skeleton.data;
        return {
            version: data.version || "—",
            hash: data.hash || "—",
            fps: data.fps ?? 0,
            width: Math.round(data.width),
            height: Math.round(data.height),
            bones: data.bones.length,
            slots: data.slots.length,
            skins: data.skins.length,
            animations: data.animations.length,
            events: data.events.length,
            ikConstraints: data.ikConstraints.length,
            transformConstraints: data.transformConstraints.length,
            pathConstraints: data.pathConstraints.length,
            physicsConstraints: data.physicsConstraints.length,
        };
    }

    public getCurrentAnimationEvents() {
        const trackEntry = this._spine.state.getCurrent(0);
        const animationName = trackEntry!.animation!.name;
        const anim = this._spine.skeleton.data.animations.find(a => a.name === animationName);
        if (!anim) return [];

        const events:CustomSpineEventData[] = [];

        for (const timeline of anim.timelines) {
            if (timeline instanceof EventTimeline) {
                const eventTimeline: any = timeline;
                for (let i = 0; i < eventTimeline.events.length; i++) {
                    const event = eventTimeline.events[i];
                    const eventData = new CustomSpineEventData(
                        event.data.name,
                        event.time,
                        event.intValue,
                        event.floatValue,
                        event.stringValue
                    );
                    events.push(eventData);
                }
            }
        }

        return events;
    }


    // ---- live edits ----

    private applyEdits() {
        const sk = this._spine.skeleton;

        for (const [name, c] of this._slotColor) {
            if (!c) continue;
            const slot = sk.findSlot(name);
            if (slot) slot.color.set(c.r, c.g, c.b, c.a);
        }
        for (const [name, attachment] of this._slotAttachment) {
            const slot = sk.findSlot(name);
            if (!slot) continue;
            slot.setAttachment(attachment ? sk.getAttachment(slot.data.index, attachment) : null);
        }
        for (const [name, e] of this._boneEdits) {
            const bone = sk.findBone(name);
            if (!bone) continue;
            bone.rotation += e.rotation;
            bone.x += e.x;
            bone.y += e.y;
            bone.scaleX *= e.scale;
            bone.scaleY *= e.scale;
        }
    }

    // Setup-pose values, used to seed the editor controls.
    public getSlotState(name: string): {
        r: number; g: number; b: number; a: number;
        blend: BlendMode; attachment: string | null; attachments: string[];
    } | null {
        const slot = this._spine.skeleton.findSlot(name);
        if (!slot) return null;
        const idx = slot.data.index;
        const out: { name: string }[] = [];
        const sk = this._spine.skeleton;
        if (sk.skin) sk.skin.getAttachmentsForSlot(idx, out as any);
        if (sk.data.defaultSkin && sk.data.defaultSkin !== sk.skin) {
            sk.data.defaultSkin.getAttachmentsForSlot(idx, out as any);
        }
        const c = slot.data.color;
        return {
            r: c.r, g: c.g, b: c.b, a: c.a,
            blend: slot.data.blendMode,
            attachment: slot.data.attachmentName ?? null,
            attachments: [...new Set(out.map(e => e.name))],
        };
    }

    public setSlotColor(name: string, r: number, g: number, b: number, a: number) {
        this._slotColor.set(name, { r, g, b, a });
    }

    public setSlotBlend(name: string, mode: BlendMode) {
        const slot = this._spine.skeleton.findSlot(name);
        if (!slot) return;
        if (!this._originalBlend.has(name)) this._originalBlend.set(name, slot.data.blendMode);
        slot.data.blendMode = mode;
    }

    // attachment name to swap to, or null to hide.
    public setSlotAttachment(name: string, attachment: string | null) {
        this._slotAttachment.set(name, attachment);
    }

    public getBoneEdit(name: string): BoneEdit {
        return this._boneEdits.get(name) ?? { rotation: 0, x: 0, y: 0, scale: 1 };
    }

    public setBoneEdit(name: string, edit: BoneEdit) {
        this._boneEdits.set(name, edit);
    }

    public resetBone(name: string) {
        this._boneEdits.delete(name);
    }

    public clearEdits() {
        this._slotColor.clear();
        this._slotAttachment.clear();
        this._boneEdits.clear();
        for (const [name, mode] of this._originalBlend) {
            const slot = this._spine.skeleton.findSlot(name);
            if (slot) slot.data.blendMode = mode;
        }
        this._originalBlend.clear();
        // Drop any lingering colour/attachment the edits left on the pose.
        this._spine.skeleton.setSlotsToSetupPose();
    }

    public savePng() {
        const app = pixiApp$.getValue();
        if (app) app.renderer.extract.download({ target: this._spine, filename: 'spine.png' });
    }

    public destroy() {
        this._spine.destroy();
        this._slotMarker.parent?.removeChild(this._slotMarker);
        this._slotMarker.destroy();
        this._selectedSlot = null;
        this._boneMarker.parent?.removeChild(this._boneMarker);
        this._boneMarker.destroy();
        this._selectedBone = null;
        // this.timelinePlayer.dispose();
        Ticker.shared.remove(this.onUpdate, this);
        this._isPlaying = false;
        isPlaying$.next(this._isPlaying);
    }

    public drawRect() {
        const rect = this.boundsArea;
        this.graphics.clear();

        this.graphics
            .rect(rect.x, rect.y, rect.width, rect.height)
            .stroke({ color: 0x008000, pixelLine: true });

        this.graphics.x = -this._spine.width / 2;
        this.graphics.y = -this._spine.height;
    }

    public toggleDrawBounds(active: boolean) {
        this._drawBounds = active;

        if (active === false) {
            this.clearDrawBoundsForAttachment();
        }
    }


    public drawBoundsForAttachment() {
        this._boundsDebugGraphics.clear();

        this._spine.skeleton.slots.forEach((slot) => {
            const attachment = slot.getAttachment();
            if (attachment instanceof RegionAttachment) {
                const regionAttachment = attachment as RegionAttachment;

                const vertices = new Float32Array(8);
                regionAttachment.computeWorldVertices(slot, vertices, 0, 2);

                this._boundsDebugGraphics.stroke({
                    color: 0x0000ff,
                    width: 1,
                });

                this._boundsDebugGraphics.moveTo(vertices[0], vertices[1]);
                for (let i = 2; i < vertices.length; i += 2) {
                    this._boundsDebugGraphics.lineTo(vertices[i], vertices[i + 1]);
                }
                this._boundsDebugGraphics.closePath();
            }
        });
    }

    public clearDrawBoundsForAttachment() {
        this._boundsDebugGraphics.clear();
        this.graphics.clear();
    }

    public toggleDrawBones(active: boolean) {
        this._drawBones = active;
        if (!active) this._bonesDebugGraphics.clear();
    }

    // Draw each bone as a line from its origin along its length, with a joint dot
    // at every origin. Bone world transforms live in the same space as the
    // attachment bounds, so this overlay lines up with the rendered skeleton.
    public drawBones() {
        const g = this._bonesDebugGraphics;
        g.clear();

        const bones = this._spine.skeleton.bones;

        for (const bone of bones) {
            const len = bone.data.length;
            if (len > 0) {
                g.moveTo(bone.worldX, bone.worldY)
                    .lineTo(bone.worldX + bone.a * len, bone.worldY + bone.c * len)
                    .stroke({ color: 0xff9800, pixelLine: true });
            }
        }

        // Joints on top of the lines.
        for (const bone of bones) {
            g.circle(bone.worldX, bone.worldY, 3).fill({ color: 0xffc107 });
        }
    }

    public getVertsCount() {
        let count = 0;
        this._spine.skeleton.slots.forEach(slot => {
            const attachment = slot.getAttachment();

            if (attachment instanceof RegionAttachment) {
                const regionAttachment = attachment as RegionAttachment;
                const vertCount = this.getVertCounFromUv(regionAttachment.uvs);
                count += vertCount;
            } else {
                // console.log("Unknown attachment type");
            }
        });
        return count;
    }

    getVertCounFromUv(uv: NumberArrayLike) {
        return uv.length / 2;
    }
}



export type SpineEventDef = {
    name: string;
    intValue: number;
    floatValue: number;
    stringValue: string | null;
    audioPath: string | null;
    volume: number;
    balance: number;
};

export type SkeletonInfo = {
    version: string;
    hash: string;
    fps: number;
    width: number;
    height: number;
    bones: number;
    slots: number;
    skins: number;
    animations: number;
    events: number;
    ikConstraints: number;
    transformConstraints: number;
    pathConstraints: number;
    physicsConstraints: number;
};

export class CustomSpineEventData {
    name: string;
    time: number;
    intValue: number
    floatValue: number;
    stringValue: string;
    constructor(name: string, time: number, intValue: number, floatValue: number, stringValue: string) {
        this.name = name;
        this.time = time;
        this.intValue = intValue;
        this.floatValue = floatValue;
        this.stringValue = stringValue;
    }
}