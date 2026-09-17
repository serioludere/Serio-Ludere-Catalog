// Astro glue for the customer realm (brief §7, §10): the runtime singletons wired from astro:env,
// the gate configuration for src/middleware.ts and the visit recorder. All the
// logic lives in the pure modules next to this file — this is the only one that imports the runtime.
import { AUTH_SECRET, PUBLIC_CATALOGUE } from 'astro:env/server';
import { isSecureSite } from '../api.ts';
import { getClient } from '../runtime.ts';
import { consoleLogger } from '../sheets/errors.ts';
import type { Customer } from '../sheets/types.ts';
import { insertVisitRows } from '../sheets/write.ts';
import { customerRealmEnabled, type CustomerGateConfig } from './gate.ts';
import { VisitThrottle, recordVisit } from './visits.ts';

const secret = AUTH_SECRET && AUTH_SECRET.length >= 32 ? AUTH_SECRET : undefined;
// `astro:env/server` is generated at server start, so a dev process older than a newly added
// variable exports `undefined` for it. The schema's own default (off, owner 2026-09-17: buyers only
// browse their /{slug} link) is repeated here rather than inferred from falsiness.
const publicCatalogue = PUBLIC_CATALOGUE ?? false;

export const customerRuntime = {
  secret,
  publicCatalogue,
  isSecureSite,
  configured: customerRealmEnabled({ secret }),
  visits: new VisitThrottle(),
};

if (!customerRuntime.configured) {
  console.warn(
    '[customer] AUTH_SECRET is unset or shorter than 32 characters: the /{slug} preview realm stays disabled (404).',
  );
}

export function customerGateConfig(): CustomerGateConfig {
  return {
    secret: customerRuntime.secret,
    publicCatalogue: customerRuntime.publicCatalogue,
    isSecureSite: customerRuntime.isSecureSite,
  };
}

/** What /api/health reports (no secrets). */
export function customerHealth(): { customerRealm: boolean; publicCatalogue: boolean } {
  return { customerRealm: customerRuntime.configured, publicCatalogue: customerRuntime.publicCatalogue };
}

/**
 * The active customer with this slug, or undefined. Inactive rows are invisible on purpose: the
 * owner switches `active` off to end a buyer's access without deleting their reaction history.
 */
export function findCustomer(customers: readonly Customer[], slug: string): Customer | undefined {
  const wanted = slug.toLowerCase();
  return customers.find((c) => c.slug.toLowerCase() === wanted && c.active);
}

/** Fire-and-forget visit row; never throws, never awaited by a render. */
export function noteVisit(customerSlug: string, request: Request): void {
  void recordVisit(
    {
      customerSlug,
      userAgent: request.headers.get('user-agent'),
      referrer: request.headers.get('referer'),
    },
    {
      throttle: customerRuntime.visits,
      append: async (rows) => insertVisitRows(getClient(), rows),
      logger: consoleLogger,
    },
  );
}
