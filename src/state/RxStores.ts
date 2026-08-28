// RxStores.ts
import { Application } from 'pixi.js';
import { BehaviorSubject } from 'rxjs';
import { CustomSpineEventData, SkeletonInfo, SpineEventDef } from '../Spine/SpineController';


type SpineMetaData = {
    drawCalls: number;
    vertexCount: number;
    triangleCount: number;
}

// Current animation time (seconds)
export const animationTime$ = new BehaviorSubject<number>(0);

// Available animations for the loaded Spine
export const animationList$ = new BehaviorSubject<string[]>([]);

// Currently selected animation
export const selectedAnimation$ = new BehaviorSubject<string | null>(null);

export const spineMetaData$ = new BehaviorSubject<SpineMetaData | null>(null);

export const pixiApp$ = new BehaviorSubject<Application | null>(null);

export const isPlaying$ = new BehaviorSubject<boolean>(false);

export const totalAnimDuration$ = new BehaviorSubject<number>(0);
export const animationTime$$ = new BehaviorSubject<number>(0);

export const drawBoundsOnSpine$ = new BehaviorSubject<boolean>(false);
export const drawBonesOnSpine$ = new BehaviorSubject<boolean>(false);
export const enableLoopOnSpine$ = new BehaviorSubject<boolean>(false);

export const eventsList$ = new BehaviorSubject<CustomSpineEventData[]>([]);

export const slotsList$ = new BehaviorSubject<string[]>([]);
export const eventDefsList$ = new BehaviorSubject<SpineEventDef[]>([]);
export const selectedSlot$ = new BehaviorSubject<string | null>(null);

// Static per-skeleton metadata (version, hash, counts) for the loaded Spine.
export const skeletonInfo$ = new BehaviorSubject<SkeletonInfo | null>(null);

// Available skins and the currently applied one.
export const skinsList$ = new BehaviorSubject<string[]>([]);
export const selectedSkin$ = new BehaviorSubject<string | null>(null);

// Available bones and the one highlighted from the list.
export const bonesList$ = new BehaviorSubject<string[]>([]);
export const selectedBone$ = new BehaviorSubject<string | null>(null);