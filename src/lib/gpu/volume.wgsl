import { hash2 } from "@vgpu/wgsl-std/hash";

struct Drive {
  mouse: vec2f,
  velocity: vec2f,
  scroll: f32,
  time: f32,
}

@group(0) @binding(0) var<uniform> drive: Drive;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let amber = vec3f(0.768, 0.627, 0.416);
  var rgb = vec3f(0.110, 0.086, 0.071);

  let look = (drive.mouse - vec2f(0.5)) * 0.07;
  let floor_y = 0.64 + look.y + drive.scroll * 0.012;
  let floor_uv = (uv - vec2f(0.5 + look.x, 0.94)) * vec2f(1.55, 2.35);
  let floor_fade = 1.0 - smoothstep(0.2, 1.05, length(floor_uv));
  let floor_mask = smoothstep(floor_y - 0.03, floor_y + 0.2, uv.y);
  rgb = mix(rgb, vec3f(0.145, 0.114, 0.090) * floor_fade, floor_mask * 0.88);

  let horizon = smoothstep(0.014, 0.0, abs(uv.y - floor_y));
  rgb += vec3f(0.08, 0.06, 0.04) * horizon * floor_fade;

  let mouse_dir = normalize(drive.mouse - vec2f(0.5) + vec2f(0.0001));
  let spec = pow(max(dot(normalize(uv - vec2f(0.5)), mouse_dir), 0.0), 46.0);
  let motion = clamp(length(drive.velocity) * 0.012, 0.0, 0.08);
  rgb += amber * (spec * 0.08 + motion * 0.02);

  let grain = hash2(uv * vec2f(923.0, 1301.0)).x * 2.0 - 1.0;
  rgb += vec3f(grain * 0.026);

  let vig = smoothstep(0.98, 0.28, length((uv - vec2f(0.5)) * vec2f(1.12, 1.04)));
  rgb *= vig;
  rgb *= 1.0 + drive.time * 0.0;

  return vec4f(clamp(rgb, vec3f(0.0), vec3f(1.0)), 1.0);
}
