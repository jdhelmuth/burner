"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ImportedTrack, ShareExchangeResult } from "@burner/core";

import { ReceiverShell } from "./receiver-shell";
import { exchangeShareAccessInBrowser } from "../lib/burner-api";
import { getOrCreateRecipientFingerprint } from "../lib/receiver-state";

type ReceiverExchange = ShareExchangeResult & {
  localTracks?: ImportedTrack[];
  isLocalShare?: boolean;
};

export function ReceiverPageClient({
  slug,
  token,
  payload,
}: {
  slug: string;
  token?: string;
  payload?: string;
}) {
  const fingerprint = useMemo(() => getOrCreateRecipientFingerprint(), []);
  const [exchange, setExchange] = useState<ReceiverExchange | null>(null);
  const [status, setStatus] = useState("Opening burner...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadExchange() {
      try {
        const opened = await exchangeShareAccessInBrowser(
          slug,
          token,
          payload,
          fingerprint,
        );
        if (!active) {
          return;
        }

        setExchange(opened as ReceiverExchange);
        setStatus("Burner loaded.");
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError((nextError as Error).message);
      }
    }

    void loadExchange();

    return () => {
      active = false;
    };
  }, [fingerprint, payload, slug, token]);

  if (error) {
    return (
      <main className="app-shell itunes-shell">
        <section className="panel auth-shell">
          <span className="eyebrow">receiver mode</span>
          <h1 className="panel-title">This burner would not open.</h1>
          <p className="muted-copy">{error}</p>
          <div className="button-row">
            <Link className="button button--secondary" href="/">
              Back home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!exchange) {
    return (
      <main className="app-shell itunes-shell">
        <section className="panel auth-shell">
          <span className="eyebrow">receiver mode</span>
          <h1 className="panel-title">Opening burner…</h1>
          <p className="muted-copy">{status}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell itunes-shell">
      <ReceiverShell exchange={exchange} />
    </main>
  );
}
