import { clock, effect, frame, frameLoop, init, surface } from "vgpu";
import type { Frame, FrameLoopHandle } from "vgpu";
import volumeShader from "@/lib/gpu/volume.wgsl";

export type DriveUniforms = {
  mouse: [number, number];
  velocity: [number, number];
  scroll: number;
  time: number;
};

type StartVolumeOptions = {
  frozen: boolean;
  onReady?: (ok: boolean) => void;
};

export function startVolume(
  canvas: HTMLCanvasElement,
  readDrive: () => DriveUniforms,
  options: StartVolumeOptions,
): () => void {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;

  void (async () => {
    try {
      gpu = await init();
    } catch {
      if (!disposed) {
        options.onReady?.(false);
      }
      return;
    }
    if (disposed) {
      gpu.dispose();
      return;
    }

    const canvasSurface = surface(gpu, canvas, { dpr: [1, 2] });
    const volume = effect(gpu, volumeShader, {
      label: "volume",
      set: { drive: readDrive() },
    });

    const paint = (currentFrame: Frame) => {
      const drive = readDrive();
      volume.set({
        drive: options.frozen ? { ...drive, time: 0 } : drive,
      });
      currentFrame.pass(canvasSurface, volume);
    };

    if (options.frozen) {
      frame(gpu, paint);
    } else {
      clock(gpu);
      loop = frameLoop(gpu, paint);
    }
    options.onReady?.(true);
  })();

  return () => {
    disposed = true;
    loop?.stop();
    gpu?.dispose();
  };
}
