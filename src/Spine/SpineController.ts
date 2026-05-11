import { NumberArrayLike, RegionAttachment, Spine, EventTimeline, Slot } from "@esotericsoftware/spine-pixi-v8";
import { Container, Graphics, Point, Rectangle, Ticker } from "pixi.js";
import { isPlaying$ } from "../state/RxStores";



export class SpineController extends Container {
    private _spine: Spine;
    private graphics: Graphics;
    private _attachmentBounds: Graphics;
    private _boundsDebugGraphics: Graphics;
    private _loop: boolean = true;
    private _isPlaying = false;

    private _drawBounds = false;

    private _slotMarker: Graphics;
    private _selectedSlot: Slot | null = null;
    private _markerTmpPoint: Point = new Point();

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

        this.graphics = new Graphics();
        debugParent.addChild(this.graphics);

        this._attachmentBounds = new Graphics();
        debugParent.addChild(this._attachmentBounds);

        this._boundsDebugGraphics = new Graphics();
        debugParent.addChild(this._boundsDebugGraphics);

        // Slot marker lives on the pixi stage so it stays a fixed on-screen size regardless of canvas zoom.
        this._slotMarker = new Graphics()
            .circle(0, 0, 8)
            .fill({ color: 0x00e5ff })
            .stroke({ color: 0x000000, width: 2 });
        this._slotMarker.zIndex = 2000;
        this._slotMarker.visible = false;
        parent.parent?.addChild(this._slotMarker);

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

        this.updateSlotMarker();
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

    public getEventNames(): string[] {
        return this._spine.skeleton.data.events.map(e => e.name);
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


    public destroy() {
        this._spine.destroy();
        this._slotMarker.parent?.removeChild(this._slotMarker);
        this._slotMarker.destroy();
        this._selectedSlot = null;
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