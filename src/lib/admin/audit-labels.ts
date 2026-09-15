// Plain-language names for the audit actions (src/lib/admin/audit.ts AUDIT_ACTIONS).
//
// The sheet stores `rug.update`, `client.status` and so on: stable keys that the API, the filters
// and the tests key on. The owner reads "Product updated" and "Customer link paused or resumed".
// This module imports nothing from Node so the admin's browser bundle can use it too.

export const AUDIT_LABELS: Record<string, string> = {
  'rug.create': 'Product added',
  'rug.update': 'Product updated',
  'rug.status': 'Product archived or restored',
  'collection.create': 'Collection added',
  'collection.update': 'Collection updated',
  'collection.reorder': 'Collections reordered',
  'tag.create': 'Tag added',
  'tag.update': 'Tag updated',
  'client.create': 'Customer link created',
  'client.status': 'Customer link paused or resumed',
  'client.password': 'Customer password reset',
  'settings.update': 'Settings changed',
  'photo.import': 'Photos imported',
  'scrape.fetch': 'Supplier page fetched',
  'reactions.compact': 'Reactions archived',
  'auth.login': 'Signed in',
  'auth.logout': 'Signed out',
  'auth.lockout': 'Sign-in locked',
  'auth.google': 'Google connected',
};

/** The label for an action key; an unknown key reads as words rather than as code. */
export function auditLabel(action: string): string {
  return AUDIT_LABELS[action] ?? action.replace(/[._]+/g, ' ');
}
