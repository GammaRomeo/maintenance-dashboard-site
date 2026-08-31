Audi A3 section explorer — prototype using the real purchased model

WHY YOU CAN'T JUST DOUBLE-CLICK index.html
Browsers block a page from fetching sibling files (the .obj/.mtl) when opened
directly as a file:// URL — it's a security restriction, not a bug in this build.
Run a tiny local server instead (one line, no install needed if you have Python):

  1. Unzip this folder somewhere.
  2. Open a terminal in that folder.
  3. Run:  python3 -m http.server 8000
  4. Open http://localhost:8000 in your browser.

WHAT'S IN THIS BUILD
- Audi_A3_8V.obj / .mtl — the model you purchased, unmodified.
- index.html — loads the model, calibrates its scale against the real A3 8V's
  published wheelbase/track (so the four hotspots land in the right real-world
  places), and adds the Google Earth-style orbit/pan/zoom + section fly-to.

TEXTURE WIRING (added in the polish pass)
The original export had UV coordinates baked into the geometry but no
map_Kd lines in the .mtl, so none of the texture PNGs were actually linked.
I matched each texture file to a material by name and by checking where its
faces sit on the mesh (e.g. the "BODY" material is only 12 vertices sitting
right where a license plate would be, so it got audiplate.jpg). Mapping used:

  BodyPaint        -> Audi_A3_8V_.png
  BODY (plate)      -> audiplate.jpg (+ audiplatebump.png as bump)
  rims             -> Audi_A3_8V_wheels.png
  tyre             -> a3_tyre.png
  interior         -> Audi_A3_8V_interior.png
  glas / darkglass -> Audi_A3_8V_windows.png
  mirror           -> Audi_A3_8V_mirror.png
  healamps         -> Audi_A3_8V_lighsinnards.png
  lights / headlightsblur -> Audi_A3_lights_uv.png
  Material, Material.011/013/014/015 (wheel-well area) -> brakes textures

This is a best-guess mapping, not verified pixel-by-pixel — if something
looks visibly wrong when you load it (stretched, upside-down, or on the
wrong part), that's the most likely place to look first.
