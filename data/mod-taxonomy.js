// Shared modification taxonomy for the vehicle profile survey. Uses the same
// system categories as the fastener-record schema (see technical-architecture-
// schema.md) so a logged mod and a fastener spec line up under one vocabulary.
// Each category lists common items as quick checkboxes; the survey pairs every
// category with one open-ended text field for anything not on the list.

const MOD_TAXONOMY = [
  {
    system: "Engine",
    common: ["Cold air intake", "Turbo/supercharger upgrade", "ECU tune / flash", "Intercooler upgrade", "Fuel injectors/pump upgrade", "Headers/exhaust manifold"],
  },
  {
    system: "Exhaust",
    common: ["Cat-back exhaust", "Downpipe", "Resonator/muffler delete", "Full turbo-back exhaust"],
  },
  {
    system: "Suspension",
    common: ["Lowering springs", "Coilovers", "Sway bars (front/rear)", "Strut/camber kit", "Upgraded bushings"],
  },
  {
    system: "Brakes",
    common: ["Big brake kit", "Performance pads", "Slotted/drilled rotors", "Stainless brake lines"],
  },
  {
    system: "Wheels & Tires",
    common: ["Aftermarket wheels", "Wider/different tire size", "Wheel spacers"],
  },
  {
    system: "Steering",
    common: ["Quick-ratio steering rack", "Aftermarket steering wheel"],
  },
  {
    system: "Drivetrain",
    common: ["Upgraded clutch", "Limited-slip differential", "Short-throw shifter"],
  },
  {
    system: "Electrical",
    common: ["Aftermarket gauges/boost gauge", "Lighting upgrades (HID/LED)", "Audio system upgrade", "Battery/alternator upgrade"],
  },
  {
    system: "Body/Interior",
    common: ["Aftermarket seats", "Roll cage/bar", "Body kit/aero", "Weight reduction (interior strip)"],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MOD_TAXONOMY };
}
