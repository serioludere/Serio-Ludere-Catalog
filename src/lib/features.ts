// Feature switches (owner, 2026-09-18). One place to turn a feature off without touching anything
// else: flip the value to `false`, commit, deploy. Every caller treats "off" as "behave exactly as
// before the feature existed", so switching off never breaks an import or a save.
import type { Supplier } from './scrape/types.ts';

export const FEATURES = {
  /**
   * Background removal on a product's cover photo — the first one, the one the card shows — for
   * both suppliers, applied as the photo is copied into Drive (src/lib/drive/transform.ts).
   *
   * Free and local: both suppliers shoot on a plain white studio backdrop, so the server flood-fills
   * that backdrop to transparent with sharp (already a dependency) and stores a PNG. No model, no
   * paid service, nothing extra to install. A photo without a plain backdrop is stored untouched,
   * and so is anything that goes wrong along the way.
   *
   * Off: covers are stored exactly as the supplier sent them (the Karavan rotation still applies).
   * Photos already in Drive are not changed either way.
   */
  backgroundRemoval: true,

  /**
   * Crops a product's cover photo to 2:3 portrait — the shape of the card — as it is copied into
   * Drive (owner, 2026-09-27: "the first photo scraped from KV cropped to a 2:3 ratio after rotating
   * -90 degrees", switchable for the other suppliers). Per supplier: `true` crops that supplier's
   * cover, `false` leaves it as it was.
   *
   * The frame is built around the rug, never through it: spare backdrop is trimmed, and a rug too
   * wide for 2:3 gets backdrop added rather than its sides cut (src/lib/drive/transform.ts). It runs
   * after the Karavan rotation and the background removal, so turning it on for a supplier crops
   * without rotating.
   *
   * Off: the cover is stored at the supplier's own proportions, as before. Photos already in Drive
   * are not changed either way.
   */
  coverCrop2x3: {
    karavanrug: true,
    ecarpetgallery: false,
    serioludere: false,
  } satisfies Record<Supplier, boolean>,
} as const;
