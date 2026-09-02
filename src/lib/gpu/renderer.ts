import { FLOOR_Y, type SpatialStation } from "@/lib/stations";
import { requestGpuDevice } from "@/lib/gpu/detect";
import {
  clamp,
  createMat4,
  fromScaling,
  fromTranslation,
  identity,
  lerpVec3,
  lookAt,
  multiply,
  perspectiveZO,
  transformPoint,
  type Vec3,
} from "@/lib/gpu/math";
import { paintFallback, paintFloor, paintNoteSlab } from "@/lib/gpu/note-texture";
import { VOLUME_SHADER } from "@/lib/gpu/shaders";

const UNIFORM_STRIDE = 256;
const MAX_OBJECTS = 16;
const LOOK_DISTANCE = 2.65;

export type ScreenQuad = {
  x: number;
  y: number;
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
};

export type DriveUniforms = {
  mouse: [number, number];
  velocity: [number, number];
  scroll: number;
  time: number;
};

export type ViewState = {
  dolly: number;
  yaw: number;
  pitch: number;
  focused: number;
  onePlane: boolean;
  hiddenId: string | null;
};

type GpuObject = {
  id: string;
  stationIndex: number;
  kind: number;
  grain: number;
  radius: number;
  aspect: number;
  opacity: number;
  reflection: boolean;
  position: Vec3;
  size: [number, number];
  bindGroup: GPUBindGroup;
};

function stationId(station: SpatialStation): string {
  return station.kind === "film" ? `film:${station.youtubeId}` : `note:${station.slug}`;
}

function posterUrl(youtubeId: string): string {
  return `/api/poster/${youtubeId}`;
}

function pointInQuad(
  x: number,
  y: number,
  points: Array<{ x: number; y: number }>,
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-6) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

export class SpatialRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = "bgra8unorm";
  private pipeline: GPURenderPipeline | null = null;
  private sampler: GPUSampler | null = null;
  private vertexBuffer: GPUBuffer | null = null;
  private indexBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private depthTexture: GPUTexture | null = null;
  private objects: GpuObject[] = [];
  private textures = new Map<string, GPUTexture>();
  private stations: SpatialStation[] = [];
  private viewProj = createMat4();
  private drive: DriveUniforms = {
    mouse: [0.5, 0.5],
    velocity: [0, 0],
    scroll: 0,
    time: 0,
  };
  private view: ViewState = {
    dolly: 0,
    yaw: 0,
    pitch: 0,
    focused: 0,
    onePlane: false,
    hiddenId: null,
  };
  private disposed = false;

  async init(canvas: HTMLCanvasElement): Promise<boolean> {
    const gpu = await requestGpuDevice();
    if (!gpu || this.disposed) {
      return false;
    }

    const context = canvas.getContext("webgpu");
    if (!context) {
      gpu.device.destroy();
      return false;
    }

    this.canvas = canvas;
    this.device = gpu.device;
    this.context = context;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.configureContext();
    this.createResources();
    this.resize();
    return true;
  }

  async setStations(stations: SpatialStation[]): Promise<void> {
    const device = this.device;
    if (!device || !this.pipeline || !this.sampler || !this.uniformBuffer) {
      return;
    }

    this.stations = stations;
    this.destroyObjects();

    const floorSource = paintFloor();
    const fallbackSource = paintFallback();
    const floorTexture = this.uploadSource("floor", floorSource);
    const fallbackTexture = this.uploadSource("fallback", fallbackSource);

    const objects: GpuObject[] = [];
    const floorGroup = this.bind(floorTexture);
    objects.push({
      id: "floor",
      stationIndex: -1,
      kind: 2,
      grain: 0.04,
      radius: 0,
      aspect: 1,
      opacity: 1,
      reflection: false,
      position: [0, FLOOR_Y, -8],
      size: [48, 48],
      bindGroup: floorGroup,
    });

    for (const station of stations) {
      const id = stationId(station);
      let texture = fallbackTexture;
      try {
        if (station.kind === "film") {
          texture = await this.loadImage(id, posterUrl(station.youtubeId));
        } else {
          texture = this.uploadSource(id, await paintNoteSlab(station));
        }
      } catch {
        texture = fallbackTexture;
      }

      const bindGroup = this.bind(texture);
      objects.push({
        id,
        stationIndex: station.index,
        kind: station.kind === "film" ? 0 : 1,
        grain: station.kind === "film" ? 0.18 : 0.1,
        radius: 0.035,
        aspect: station.size[0] / station.size[1],
        opacity: 1,
        reflection: false,
        position: [...station.position],
        size: station.size,
        bindGroup,
      });
      objects.push({
        id: `${id}:mirror`,
        stationIndex: station.index,
        kind: 3,
        grain: 0.08,
        radius: 0.035,
        aspect: station.size[0] / station.size[1],
        opacity: 0.22,
        reflection: true,
        position: [
          station.position[0],
          FLOOR_Y - (station.position[1] - FLOOR_Y),
          station.position[2],
        ],
        size: [station.size[0], -station.size[1]],
        bindGroup,
      });
    }

    this.objects = objects;
  }

  setDrive(drive: DriveUniforms): void {
    this.drive = drive;
  }

  setView(view: ViewState): void {
    this.view = view;
  }

  resize(): void {
    const canvas = this.canvas;
    const device = this.device;
    const context = this.context;
    if (!canvas || !device || !context) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width === width && canvas.height === height && this.depthTexture) {
      return;
    }

    canvas.width = width;
    canvas.height = height;
    this.configureContext();
    this.depthTexture?.destroy();
    this.depthTexture = device.createTexture({
      size: [width, height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  frame(): void {
    const device = this.device;
    const context = this.context;
    const pipeline = this.pipeline;
    const depth = this.depthTexture;
    const uniformBuffer = this.uniformBuffer;
    const vertexBuffer = this.vertexBuffer;
    const indexBuffer = this.indexBuffer;
    if (!device || !context || !pipeline || !depth || !uniformBuffer || !vertexBuffer || !indexBuffer) {
      return;
    }

    this.resize();
    this.writeCamera();

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.0196, g: 0.0196, b: 0.0275, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: depth.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint16");

    const draws = this.visibleObjects();
    draws.forEach((object, slot) => {
      if (slot >= MAX_OBJECTS) {
        return;
      }
      this.writeObject(slot, object);
      pass.setBindGroup(0, object.bindGroup, [slot * UNIFORM_STRIDE]);
      pass.drawIndexed(6);
    });

    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  pick(cssX: number, cssY: number): number | null {
    const hits = this.stations
      .map((station) => ({ station, quad: this.project(station.index) }))
      .filter((entry): entry is { station: SpatialStation; quad: ScreenQuad } => {
        return Boolean(entry.quad) && this.isStationVisible(entry.station);
      });

    hits.sort((a, b) => a.station.position[2] - b.station.position[2]);
    for (let i = hits.length - 1; i >= 0; i -= 1) {
      const hit = hits[i];
      if (pointInQuad(cssX, cssY, hit.quad.points)) {
        return hit.station.index;
      }
    }
    return null;
  }

  project(index: number): ScreenQuad | null {
    const canvas = this.canvas;
    const station = this.stations[index];
    if (!canvas || !station) {
      return null;
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const hw = station.size[0] / 2;
    const hh = station.size[1] / 2;
    const corners: Vec3[] = [
      [station.position[0] - hw, station.position[1] - hh, station.position[2]],
      [station.position[0] + hw, station.position[1] - hh, station.position[2]],
      [station.position[0] + hw, station.position[1] + hh, station.position[2]],
      [station.position[0] - hw, station.position[1] + hh, station.position[2]],
    ];

    const points = corners.map((corner) => {
      const clip: Vec3 = [0, 0, 0];
      transformPoint(clip, this.viewProj, corner);
      return {
        x: (clip[0] * 0.5 + 0.5) * width,
        y: (1 - (clip[1] * 0.5 + 0.5)) * height,
      };
    });

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      points,
    };
  }

  dispose(): void {
    this.disposed = true;
    this.destroyObjects();
    this.depthTexture?.destroy();
    this.vertexBuffer?.destroy();
    this.indexBuffer?.destroy();
    this.uniformBuffer?.destroy();
    this.device?.destroy();
    this.device = null;
    this.context = null;
    this.canvas = null;
  }

  private configureContext(): void {
    if (!this.context || !this.device || !this.canvas) {
      return;
    }
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "opaque",
      colorSpace: "srgb",
    });
  }

  private createResources(): void {
    const device = this.device;
    if (!device) {
      return;
    }

    const shaderModule = device.createShaderModule({ code: VOLUME_SHADER });
    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
            hasDynamicOffset: true,
            minBindingSize: 176,
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
      ],
    });

    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 20,
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 12, format: "float32x2" },
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });

    const vertices = new Float32Array([
      -0.5, -0.5, 0, 0, 1,
      0.5, -0.5, 0, 1, 1,
      0.5, 0.5, 0, 1, 0,
      -0.5, 0.5, 0, 0, 0,
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    this.vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.indexBuffer = device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
    device.queue.writeBuffer(this.indexBuffer, 0, indices);

    this.uniformBuffer = device.createBuffer({
      size: UNIFORM_STRIDE * MAX_OBJECTS,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
  }

  private bind(texture: GPUTexture): GPUBindGroup {
    const device = this.device;
    const pipeline = this.pipeline;
    const sampler = this.sampler;
    const uniformBuffer = this.uniformBuffer;
    if (!device || !pipeline || !sampler || !uniformBuffer) {
      throw new Error("Renderer is not ready");
    }

    return device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
            offset: 0,
            size: UNIFORM_STRIDE,
          },
        },
        { binding: 1, resource: texture.createView() },
        { binding: 2, resource: sampler },
      ],
    });
  }

  private uploadSource(id: string, source: HTMLCanvasElement | ImageBitmap): GPUTexture {
    const device = this.device;
    if (!device) {
      throw new Error("Renderer is not ready");
    }

    this.textures.get(id)?.destroy();
    const width = source.width;
    const height = source.height;
    const texture = device.createTexture({
      size: [width, height],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source },
      { texture },
      [width, height],
    );
    this.textures.set(id, texture);
    return texture;
  }

  private async loadImage(id: string, url: string): Promise<GPUTexture> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Poster failed: ${url}`);
    }
    const bitmap = await createImageBitmap(await response.blob());
    try {
      return this.uploadSource(id, bitmap);
    } finally {
      bitmap.close();
    }
  }

  private writeCamera(): void {
    const canvas = this.canvas;
    if (!canvas) {
      return;
    }

    const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    const pose = this.interpolatedPose();
    const eye: Vec3 = [
      pose[0] + Math.sin(this.view.yaw) * LOOK_DISTANCE * 0.42,
      pose[1] + Math.sin(this.view.pitch) * LOOK_DISTANCE * 0.36,
      pose[2] + LOOK_DISTANCE,
    ];
    const target: Vec3 = [pose[0], pose[1], pose[2]];
    const proj = perspectiveZO(createMat4(), Math.PI / 5.2, aspect, 0.1, 60);
    const view = lookAt(createMat4(), eye, target, [0, 1, 0]);
    multiply(this.viewProj, proj, view);
  }

  private interpolatedPose(): Vec3 {
    const last = Math.max(this.stations.length - 1, 0);
    const dolly = clamp(this.view.dolly, 0, last);
    const i0 = Math.floor(dolly);
    const i1 = Math.min(last, i0 + 1);
    const t = dolly - i0;
    const a = this.stations[i0]?.position ?? [0, 0.3, -4];
    const b = this.stations[i1]?.position ?? a;
    return lerpVec3([0, 0, 0], a, b, t);
  }

  private visibleObjects(): GpuObject[] {
    const hidden = this.view.hiddenId;
    const focused = this.view.focused;
    return this.objects
      .filter((object) => {
        if (object.kind === 2) {
          return true;
        }
        if (hidden && (object.id === hidden || object.id === `${hidden}:mirror`)) {
          return false;
        }
        if (this.view.onePlane && object.stationIndex !== focused && object.kind !== 2) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.kind === 2) {
          return -1;
        }
        if (b.kind === 2) {
          return 1;
        }
        if (a.reflection !== b.reflection) {
          return a.reflection ? -1 : 1;
        }
        return a.position[2] - b.position[2];
      });
  }

  private isStationVisible(station: SpatialStation): boolean {
    if (this.view.onePlane && station.index !== this.view.focused) {
      return false;
    }
    const id = stationId(station);
    return this.view.hiddenId !== id;
  }

  private writeObject(slot: number, object: GpuObject): void {
    const device = this.device;
    const uniformBuffer = this.uniformBuffer;
    if (!device || !uniformBuffer) {
      return;
    }

    const model = createMat4();
    const scale = fromScaling(createMat4(), object.size[0], object.size[1], 1);
    const translation = fromTranslation(
      createMat4(),
      object.position[0],
      object.position[1],
      object.position[2],
    );
    if (object.kind === 2) {
      const rotate = identity(createMat4());
      rotate[5] = 0;
      rotate[6] = -1;
      rotate[9] = 1;
      rotate[10] = 0;
      const rotated = multiply(createMat4(), rotate, scale);
      multiply(model, translation, rotated);
    } else {
      multiply(model, translation, scale);
    }

    const highlight = object.stationIndex === this.view.focused ? 1 : 0.55;
    const data = new Float32Array(UNIFORM_STRIDE / 4);
    data.set(this.viewProj, 0);
    data.set(model, 16);
    data[32] = this.drive.mouse[0];
    data[33] = this.drive.mouse[1];
    data[34] = this.drive.velocity[0];
    data[35] = this.drive.velocity[1];
    data[36] = this.drive.scroll;
    data[37] = this.drive.time;
    data[38] = object.grain;
    data[39] = object.opacity;
    data[40] = object.aspect;
    data[41] = object.radius;
    data[42] = object.kind;
    data[43] = object.kind === 2 ? 0 : highlight;

    device.queue.writeBuffer(
      uniformBuffer,
      slot * UNIFORM_STRIDE,
      data.buffer,
      data.byteOffset,
      UNIFORM_STRIDE,
    );
  }

  private destroyObjects(): void {
    this.objects = [];
    for (const texture of this.textures.values()) {
      texture.destroy();
    }
    this.textures.clear();
  }
}

export function stationKey(station: SpatialStation): string {
  return stationId(station);
}

export function snapDolly(value: number, count: number): number {
  return clamp(Math.round(value), 0, Math.max(count - 1, 0));
}
