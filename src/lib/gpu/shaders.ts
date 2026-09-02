export const VOLUME_SHADER = /* wgsl */ `
struct Uniforms {
  view_proj: mat4x4<f32>,
  model: mat4x4<f32>,
  mouse: vec2<f32>,
  velocity: vec2<f32>,
  scroll: f32,
  time: f32,
  grain: f32,
  opacity: f32,
  aspect: f32,
  radius: f32,
  kind: f32,
  highlight: f32,
};

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var plane_tex: texture_2d<f32>;
@group(0) @binding(2) var plane_samp: sampler;

struct VSOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) world_y: f32,
};

@vertex
fn vs_main(
  @location(0) position: vec3<f32>,
  @location(1) uv: vec2<f32>,
) -> VSOut {
  var out: VSOut;
  let world = u.model * vec4<f32>(position, 1.0);
  out.position = u.view_proj * world;
  out.uv = uv;
  out.world_y = world.y;
  return out;
}

fn still_grain(uv: vec2<f32>) -> f32 {
  let p = uv * vec2<f32>(647.0, 881.0);
  let n = fract(sin(dot(p, vec2<f32>(12.9898, 78.233))) * 43758.5453);
  let n2 = fract(sin(dot(p + 19.19, vec2<f32>(39.346, 11.135))) * 23421.631);
  return (n * 0.62 + n2 * 0.38) * 2.0 - 1.0;
}

fn rounded_rect(uv: vec2<f32>, radius: f32) -> f32 {
  let r = max(radius, 0.001);
  let half = vec2<f32>(0.5 - r);
  let q = abs(uv - vec2<f32>(0.5)) - half;
  return length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

fn luma(rgb: vec3<f32>) -> f32 {
  return dot(rgb, vec3<f32>(0.299, 0.587, 0.114));
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
  let uv = input.uv;
  let kind = u.kind;
  let teal = vec3<f32>(0.031, 0.478, 0.298);

  if (kind < 1.5) {
    let sd = rounded_rect(uv, u.radius);
    if (sd > 0.0) {
      discard;
    }
  }

  var sample_uv = uv;
  if (kind < 0.5) {
    let crop = 45.0 / 360.0;
    sample_uv = vec2<f32>(uv.x, mix(crop, 1.0 - crop, uv.y));
  }

  let raw = textureSample(plane_tex, plane_samp, sample_uv);
  var tone = vec3<f32>(luma(raw.rgb));
  tone = pow(clamp(tone, vec3<f32>(0.0), vec3<f32>(1.0)), vec3<f32>(0.92));
  tone *= 0.94;

  let focus = mix(0.78, 1.0, u.highlight);
  tone *= focus;

  let edge = smoothstep(0.08, 0.0, abs(rounded_rect(uv, u.radius)));
  let glint_uv = vec2<f32>(1.0 - uv.x, uv.y);
  let corner = pow(clamp(glint_uv.x * uv.y, 0.0, 1.0), 10.0);
  let mouse_align = pow(
    clamp(dot(normalize(uv - vec2<f32>(0.5)), normalize(u.mouse - vec2<f32>(0.5))), 0.0, 1.0),
    28.0,
  );
  let motion = clamp(length(u.velocity) * 0.015, 0.0, 0.12);
  let teal_glint = teal * (corner * 0.22 + mouse_align * 0.09 + motion * 0.04);
  let white_glint = vec3<f32>(corner * 0.18);

  var grain_amt = u.grain;
  if (kind < 0.5) {
    grain_amt = max(grain_amt, 0.16);
  }
  let grain = still_grain(uv) * grain_amt;

  var rgb = tone + white_glint + teal_glint + vec3<f32>(grain * 0.045);
  rgb = mix(rgb, vec3<f32>(0.02), edge * 0.35);

  var alpha = u.opacity * raw.a;
  if (kind > 1.5 && kind < 2.5) {
    let fade = smoothstep(-0.2, -2.8, input.world_y);
    let radial = 1.0 - clamp(length((uv - vec2<f32>(0.5)) * vec2<f32>(1.6, 1.0)), 0.0, 1.0);
    rgb = vec3<f32>(0.012, 0.012, 0.014) + teal * mouse_align * 0.035;
    rgb += vec3<f32>(still_grain(uv * 0.35) * 0.012);
    alpha = u.opacity * fade * radial * 0.92;
  } else if (kind > 2.5) {
    alpha *= 0.2;
    rgb *= 0.28;
    rgb = mix(rgb, vec3<f32>(0.02), 0.45);
  }

  let scroll_shade = 1.0 - clamp(abs(u.scroll) * 0.02, 0.0, 0.08);
  rgb *= scroll_shade;
  rgb = clamp(rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  return vec4<f32>(rgb, alpha);
}
`;
