"use client";

import { EditorEmptyState } from "./EditorEmptyState";
import { SectionHeader } from "./SectionHeader";
import { SectionShell } from "./SectionShell";

interface Store {
  name?: string;
  region?: string;
  address?: string;
  city?: string;
  hours?: string;
  phone?: string;
  flagship?: boolean;
}

interface StoreListProps {
  heading?: string;
  subheading?: string;
  stores?: Store[];
  attributes?: Record<string, unknown>;
}

function directionsUrl(store: Store) {
  const query = [store.name, store.address, store.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function StoreList({ heading, subheading, stores, attributes }: StoreListProps) {
  const items = (stores ?? []).filter((store) => store?.name && store.address);

  if (items.length === 0) {
    return <EditorEmptyState attributes={attributes} message="Add stores in the options panel." />;
  }

  // Grouped in first-seen order so editors control region order by list order.
  const groups = new Map<string, Store[]>();
  for (const store of items) {
    const region = store.region?.trim() || "";
    groups.set(region, [...(groups.get(region) ?? []), store]);
  }

  return (
    <SectionShell attributes={attributes} spacing="md">
      <SectionHeader heading={heading} subheading={subheading} />
      <div className="flex flex-col gap-12">
        {[...groups.entries()].map(([region, regionStores]) => (
          <div key={region || "stores"}>
            {region && (
              <h3 className="mb-5 text-sm font-medium uppercase tracking-wide text-slate">
                {region}
              </h3>
            )}
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {regionStores.map((store, index) => (
                <li
                  key={`${store.name}-${index}`}
                  className="flex flex-col rounded-lg border border-sand bg-surface p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-lg text-ink">{store.name}</p>
                    {store.flagship && (
                      <span className="shrink-0 rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-ink">
                        Flagship
                      </span>
                    )}
                  </div>
                  <address className="mt-3 text-sm not-italic leading-relaxed text-slate">
                    {store.address}
                    {store.city && (
                      <>
                        <br />
                        {store.city}
                      </>
                    )}
                  </address>
                  {store.hours && <p className="mt-3 text-sm text-ink">{store.hours}</p>}
                  <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-5 text-sm font-medium">
                    <a
                      href={directionsUrl(store)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      Get directions
                    </a>
                    {store.phone && (
                      <a href={telHref(store.phone)} className="text-ink underline-offset-4 hover:underline">
                        {store.phone}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
