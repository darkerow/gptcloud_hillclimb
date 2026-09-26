/** Arcade tuning profiles. Values are authored here, not extracted from HCR.
 * The longitudinal guide pivots at axle height, allowing independent spring
 * travel instead of triangulating the axle into a rigid chassis. */
const profiles={
  car:{spring:0.048,damping:0.085,travel:27,inertia:1.45,air:0.00125},
  monster:{spring:0.032,damping:0.08,travel:39,inertia:1.7,air:0.0011},
  buggy:{spring:0.036,damping:0.082,travel:35,inertia:1.45,air:0.0015},
  bike:{spring:0.052,damping:0.075,travel:28,inertia:1.65,air:0.0017},
  race:{spring:0.085,damping:0.1,travel:14,inertia:1.75,air:0.00085},
  tractor:{spring:0.064,damping:0.11,travel:23,inertia:1.65,air:0.00085},
  van:{spring:0.047,damping:0.09,travel:30,inertia:1.8,air:0.0009},
  bus:{spring:0.062,damping:0.105,travel:28,inertia:1.8,air:0.00065},
  truck:{spring:0.075,damping:0.12,travel:28,inertia:1.9,air:0.0007},
  fire:{spring:0.075,damping:0.12,travel:26,inertia:1.9,air:0.0007},
  ambulance:{spring:0.051,damping:0.11,travel:30,inertia:1.8,air:0.0008},
  police:{spring:0.065,damping:0.1,travel:22,inertia:1.55,air:0.0011},
  tank:{spring:0.094,damping:0.12,travel:12,inertia:2.1,air:0.0006},
  snow:{spring:0.066,damping:0.095,travel:22,inertia:1.65,air:0.0011},
  hover:{spring:0.058,damping:0.12,travel:20,inertia:1.85,air:0.0008},
  rocket:{spring:0.064,damping:0.1,travel:21,inertia:1.9,air:0.0011},
  hotrod:{spring:0.058,damping:0.09,travel:22,inertia:1.7,air:0.0011},
  mono:{spring:0.98,damping:0.2,travel:0,inertia:1,air:0.0018}
};
const special={
  rally:{spring:0.062,damping:0.11,travel:28},
  trophy:{spring:0.03,damping:0.092,travel:43},
  offroad:{spring:0.043,damping:0.09,travel:34},
  lunar:{spring:0.032,damping:0.092,travel:32},
  lowrider:{spring:0.087,damping:0.12,travel:13},
  minibike:{spring:0.063,damping:0.085,travel:18},
  superbike:{spring:0.08,damping:0.095,travel:18},
  dragster:{spring:0.081,damping:0.11,travel:17},
  electric:{spring:0.065,damping:0.11,travel:23},
  safari:{spring:0.052,damping:0.1,travel:30},
  armored:{spring:0.081,damping:0.13,travel:27},
  custom:{spring:0.044,damping:0.09,travel:31}
};
export function suspensionFor(spec,level=0){
  const p={...(profiles[spec.style]||profiles.car),...special[spec.id]};
  const upgrade=Math.min(15,Math.max(0,Number(level)||0))/15;
  // Upgrades increase damping and usable travel, not just joint rigidity.
  return {...p,spring:p.spring*(1+upgrade*.12),damping:p.damping*(1+upgrade*.65),travel:p.travel*(1+upgrade*.18)};
}
