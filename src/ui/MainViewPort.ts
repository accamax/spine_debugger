import { Application, Container, Graphics, Point, Rectangle, Ticker } from "pixi.js";
import {  ToolState } from "../core/LifeCycle";
import { EnableDragAndDrop, showDropMessage } from "./DragAndDrop";
import { EnableExternalHandoff } from "./ExternalHandoff";
import { SpineLoader } from "../loaders/SpineLoader";
import { EnableLoadDefaultSpineButton, toggleDisableDefaultButton } from "../loaders/LoadDefaultAsset";
import { SpineController } from "../Spine/SpineController";
import { VisualComponent } from "../core/VisualComponent";
import { animationList$, animationTime$, animationTime$$, drawBoundsOnSpine$, enableLoopOnSpine$, eventNamesList$, eventsList$, isPlaying$, pixiApp$, selectedAnimation$, selectedSlot$, slotsList$, spineMetaData$, totalAnimDuration$ } from "../state/RxStores";




export class MainViewPort extends VisualComponent {
    private pixiApp: Application;

    constructor(application: Application) {
        super();
        this.pixiApp = application;
    }


    private _spineController!: SpineController;

    async HandleInitUI(): Promise<void> {

    }

    async HandleEmptyDisplay(): Promise<void> {
        EnableLoadDefaultSpineButton(() => {
            this.changeState(ToolState.LOAD_SPINE);
        });

        const canvasContainer = document.getElementById('canvas_editor')!;

        // Both entry points — a local drop and a set handed over from the vault
        // — load the same way.
        const load = async (files: File[]) => {
            const spineLoader = new SpineLoader();

            try {
                await spineLoader.loadSpineAssets(files);
                this.changeState(ToolState.LOAD_SPINE);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error("Failed to load assets", error);
                showDropMessage(message);
            }
        };

        EnableDragAndDrop(canvasContainer, load);
        EnableExternalHandoff(load);
    }

    async HandleLoadSpine(): Promise<void> {

        toggleDisableDefaultButton(true);

        const canvasContainer = document.getElementById('canvas_editor')!;

        canvasContainer.appendChild(this.pixiApp.canvas);

        const spineRenderContainer = new SpineRenderContainer();
        this.pixiApp.stage.addChild(spineRenderContainer);


        EnableCanvasControls(canvasContainer, spineRenderContainer);

        spineRenderContainer.x = this.pixiApp.screen.width / 2;
        spineRenderContainer.y = this.pixiApp.screen.height / 2;

        spineRenderContainer.boundsArea = new Rectangle(0, 0, this.pixiApp.screen.width, this.pixiApp.screen.height);

        this._spineController = new SpineController(spineRenderContainer);


        document.getElementById('drop_message')?.remove();

        const animations = this._spineController.getAnimationNames();

        animationList$.next(animations);
        slotsList$.next(this._spineController.getSlotNames());
        eventNamesList$.next(this._spineController.getEventNames());
        selectedSlot$.next(null);

        enableLoopOnSpine$.next(true);

        this.changeState(ToolState.ACTIVE_DISPLAY);
    }

    async HandleActiveDisplay(): Promise<void> {
        selectedAnimation$.subscribe(animName => {
            if (animName !== null) {
                this._spineController.play(animName);

                const totalDuration = this._spineController.getTotalDurationOfAnimation();
                const currentDuration = this._spineController.getCurrentDurationOfAnimation();

                totalAnimDuration$.next(totalDuration);
                animationTime$$.next(currentDuration);

                const eventsData = this._spineController.getCurrentAnimationEvents();
                eventsList$.next(eventsData);   
            }
        });


        let drawCount = 0;
        const renderer = pixiApp$.getValue()?.renderer as any;
        const drawElements = renderer.gl.drawElements;
        renderer.gl.drawElements = (...args: any[]) => {
            drawElements.call(renderer.gl, ...args);
            drawCount++;
        };

        Ticker.shared.add(() => {
            if (this._spineController.IsPlaying() && selectedAnimation$.getValue() !== null) {
                const currentDuration = this._spineController.getCurrentDurationOfAnimation();
                animationTime$$.next(currentDuration);
            };

            const vertexCount = this._spineController.getVertsCount();
            const triangleCount = vertexCount / 2;
            spineMetaData$.next({
                drawCalls: drawCount,
                vertexCount: this._spineController.getVertsCount(),
                triangleCount: triangleCount,
            });


            drawCount = 0;
        });


        animationTime$.subscribe(currentDuration => {
            this._spineController.setTime(currentDuration);
        });

        isPlaying$.subscribe(isPlaying => {
            this._spineController.setPlay(isPlaying);
        });

        drawBoundsOnSpine$.subscribe(shouldDraw => {
            this._spineController.toggleDrawBounds(shouldDraw);
        });

        enableLoopOnSpine$.subscribe(shouldLoop => {
            this._spineController.toggleLoop(shouldLoop);
        });

        selectedSlot$.subscribe(slotName => {
            this._spineController.setSelectedSlot(slotName);
        });
    }

    async HandleReplaceSpine(): Promise<void> {

    }

    async HandleClearSpine(): Promise<void> {

    }
}


class SpineRenderContainer extends Container {
    private zoomLevel: number;
    private graphics: Graphics;

    constructor() {
        super();
        const defaultZoomLevel = 1;
        this.zoomLevel = defaultZoomLevel;

        this.graphics = new Graphics();
        this.graphics.zIndex = 1000;
        this.addChild(this.graphics);
    }

    handleZoom(zoomFactor: number) {
        this.zoomLevel *= zoomFactor;
        this.scale.set(this.zoomLevel);
    }

    handleMove(deltaX: number, deltaY: number) {
        this.x += deltaX;
        this.y += deltaY;
    }

    public drawBounds() {
        this.graphics.clear();
        const boundsArea = this.boundsArea;

        this.graphics
            .rect(boundsArea.left, boundsArea.top, boundsArea.width, boundsArea.height)
            .stroke({ color: 0x008000, pixelLine: true });
    }
}



function EnableCanvasControls(canvasContainer: HTMLElement, spineRenderContainer: SpineRenderContainer) {
    let isDragging = false;
    let dragStart = new Point();

    canvasContainer.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomFactor = 1.1; // Adjust this factor for faster/slower zooming
        if (event.deltaY < 0) {
            spineRenderContainer.handleZoom(zoomFactor);
        } else {
            spineRenderContainer.handleZoom(1 / zoomFactor);
        }
    });

    canvasContainer.addEventListener('mousedown', (event) => {
        const leftMouseButton = 0;
        if (event.button === leftMouseButton) {
            isDragging = true;
            const rect = canvasContainer.getBoundingClientRect();
            dragStart.set(event.clientX - rect.left, event.clientY - rect.top);
        }
    });

    canvasContainer.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const rect = canvasContainer.getBoundingClientRect();
            const currentMousePosition = new Point(
                event.clientX - rect.left,
                event.clientY - rect.top
            );

            const deltaX = currentMousePosition.x - dragStart.x;
            const deltaY = currentMousePosition.y - dragStart.y;

            spineRenderContainer.handleMove(deltaX, deltaY);
            dragStart = currentMousePosition;
        }
    });

    canvasContainer.addEventListener('mouseup', (event) => {
        if (event.button === 0) {
            isDragging = false;
        }
    });

    canvasContainer.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}