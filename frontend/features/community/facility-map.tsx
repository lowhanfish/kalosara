"use client";
import { useState } from "react";
import Link from "next/link";
import { mapUrls, type Place } from "@/lib/region";
const isExample = (item: Place) =>
  /contoh|pratinjau|dummy|ilustrasi/i.test(
    item.description + " " + item.location,
  );
export function FacilityMap({ items }: { items: Place[] }) {
  const points = items.filter((x) => mapUrls(x.latitude, x.longitude));
  const [selectedId, setSelectedId] = useState(
    (points.find((item) => !isExample(item)) ?? points[0])?.id,
  );
  const selected = points.find((x) => x.id === selectedId) ?? points[0];
  const map = selected ? mapUrls(selected.latitude, selected.longitude) : null;
  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="max-h-[560px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
        <p className="p-3 text-xs text-muted">
          {points.length} lokasi memiliki koordinat. Pilih lokasi untuk
          melihatnya di peta.
        </p>
        {items.map((item) => (
          <div key={item.id} className="border-t border-slate-100 p-3">
            {mapUrls(item.latitude, item.longitude) ? (
              <button
                aria-pressed={item.id === selected?.id}
                onClick={() => setSelectedId(item.id)}
                className={`min-h-11 w-full rounded-lg p-3 text-left text-sm font-semibold ${item.id === selected?.id ? "bg-primary text-white" : "bg-slate-50 text-primary"}`}
              >
                {item.name}
                {isExample(item) ? " (contoh)" : ""}
              </button>
            ) : (
              <p className="p-3 text-sm font-semibold">
                {item.name}
                {isExample(item) ? " (contoh)" : ""}
                <span className="block text-xs font-normal text-muted">
                  Koordinat belum tersedia
                </span>
              </p>
            )}
            <Link
              href={`/fasilitas/${item.id}`}
              className="mt-2 inline-block text-xs font-semibold text-primary"
            >
              Detail fasilitas →
            </Link>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {map ? (
          <>
            <iframe
              key={selected.id}
              src={map.embed}
              title={`Peta ${selected.name}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-[420px] w-full border-0 sm:h-[480px]"
            />
            <div className="p-5">
              <h2 className="font-bold">{selected.name}</h2>
              <a
                href={map.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-primary"
              >
                Buka di OpenStreetMap ↗
              </a>
            </div>
          </>
        ) : (
          <p className="p-8 text-muted">
            Belum ada koordinat fasilitas yang dipublikasikan.
          </p>
        )}
      </section>
    </div>
  );
}
