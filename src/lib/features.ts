// Feature switches (owner, 2026-09-18). One place to turn a feature off without touching anything
// else: flip the value to `false`, commit, deploy. Every caller treats "off" as "behave exactly as
// before the feature existed", so switching off never breaks an import or a save.

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
} as const;
