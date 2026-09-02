export function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.gpu);
}

export async function requestGpuDevice(): Promise<{
  adapter: GPUAdapter;
  device: GPUDevice;
} | null> {
  if (!hasWebGPU() || !navigator.gpu) {
    return null;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return null;
    }
    const device = await adapter.requestDevice();
    return { adapter, device };
  } catch {
    return null;
  }
}
