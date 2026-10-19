"use client";
import { useState } from "react";
import { mapUrls } from "@/lib/region";
export function LocationMap({
  latitude,
  longitude,
  address,
}: {
  latitude?: number | null;
  longitude?: number | null;
  address: string;
}) {
  const [consented, setConsented] = useState(false);
  const urls = mapUrls(latitude, longitude);
  return (
    <section
      aria-label="Lokasi kantor kelurahan"
      className="space-y-4 rounded-xl border border-border bg-soft p-6"
    >
      <h2 className="text-xl font-bold">Lokasi kantor</h2>
      <p>{address}</p>
      {!urls ? (
        <p className="text-[15px] text-muted">
          Koordinat kantor belum diisi pengelola. Gunakan alamat di atas sebagai
          acuan.
        </p>
      ) : (
        <>
          <p className="text-[15px] text-muted">
            Peta disediakan OpenStreetMap. Memuat peta akan menghubungkan
            perangkat Anda ke layanan tersebut dan mengirim alamat IP serta
            informasi teknis browser. Peta tidak dimuat sebelum Anda memilih
            tombol di bawah.
          </p>
          {!consented ? (
            <button
              className="yellow-button"
              onClick={() => setConsented(true)}
            >
              Setuju, tampilkan peta
            </button>
          ) : (
            <>
              <iframe
                title="Peta lokasi kantor kelurahan"
                src={urls.embed}
                width="100%"
                height="320"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="rounded-lg border border-border"
              />
              <button className="underline" onClick={() => setConsented(false)}>
                Tutup peta
              </button>
            </>
          )}
          <p>
            <a
              href={urls.link}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Buka lokasi di OpenStreetMap
            </a>
          </p>
          <noscript>
            <p>
              JavaScript dinonaktifkan. Alamat dan tautan lokasi tetap dapat
              digunakan.
            </p>
          </noscript>
        </>
      )}
    </section>
  );
}
