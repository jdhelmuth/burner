"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { runtimeFlags } from "../lib/env";
import { getBrowserSupabaseClient } from "../lib/supabase";

type BurnerRow = {
  id: string;
  slug: string;
  title: string;
  sender_name: string;
  cover_image_url: string | null;
  total_tracks: number;
  is_revoked: boolean;
  created_at: string;
};

type ShareLinkRow = {
  burner_id: string;
  short_code: string;
  slug: string;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; burners: BurnerRow[]; shareLinks: Record<string, ShareLinkRow> }
  | { kind: "error"; message: string };

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function MyBurnsClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    if (!runtimeFlags.isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }

    const supabase = getBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !session) {
      return;
    }

    const supabase = getBrowserSupabaseClient();
    let cancelled = false;

    async function load() {
      setState({ kind: "loading" });

      const { data: burners, error } = await supabase
        .from("burners")
        .select(
          "id, slug, title, sender_name, cover_image_url, total_tracks, is_revoked, created_at",
        )
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setState({ kind: "error", message: error.message });
        return;
      }

      const rows = (burners ?? []) as BurnerRow[];

      let shareLinks: Record<string, ShareLinkRow> = {};
      if (rows.length > 0) {
        const { data: links } = await supabase
          .from("burner_share_links")
          .select("burner_id, short_code, slug")
          .in(
            "burner_id",
            rows.map((r) => r.id),
          );

        if (links) {
          for (const link of links as ShareLinkRow[]) {
            shareLinks[link.burner_id] ??= link;
          }
        }
      }

      if (cancelled) return;
      setState({ kind: "ready", burners: rows, shareLinks });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authReady, session]);

  if (!runtimeFlags.isSupabaseConfigured) {
    return (
      <main className="my-burns">
        <header className="my-burns__header">
          <Link className="my-burns__back" href="/">
            ← Back to Burner
          </Link>
          <h1>My Burns</h1>
        </header>
        <p className="my-burns__empty">
          Backend auth is not configured on this deployment, so burner history
          is unavailable.
        </p>
      </main>
    );
  }

  if (!authReady) {
    return (
      <main className="my-burns">
        <header className="my-burns__header">
          <Link className="my-burns__back" href="/">
            ← Back to Burner
          </Link>
          <h1>My Burns</h1>
        </header>
        <p className="my-burns__empty">Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="my-burns">
        <header className="my-burns__header">
          <Link className="my-burns__back" href="/">
            ← Back to Burner
          </Link>
          <h1>My Burns</h1>
        </header>
        <p className="my-burns__empty">
          Sign in on the <Link href="/">home page</Link> to see the mixtapes
          you&apos;ve burned.
        </p>
      </main>
    );
  }

  return (
    <main className="my-burns">
      <header className="my-burns__header">
        <Link className="my-burns__back" href="/">
          ← Back to Burner
        </Link>
        <h1>My Burns</h1>
        <p className="my-burns__subtitle">
          Every mixtape you&apos;ve burned. Tap one to open its share page.
        </p>
      </header>

      {state.kind === "loading" ? (
        <p className="my-burns__empty">Loading your burns...</p>
      ) : state.kind === "error" ? (
        <p className="my-burns__empty my-burns__empty--error">
          Could not load your burns: {state.message}
        </p>
      ) : state.burners.length === 0 ? (
        <p className="my-burns__empty">
          No burns yet. <Link href="/">Burn your first mixtape.</Link>
        </p>
      ) : (
        <ul className="my-burns__list">
          {state.burners.map((burner) => {
            const link = state.shareLinks[burner.id];
            const href = link ? `/b/${link.slug}` : `/b/${burner.slug}`;
            return (
              <li className="my-burns__item" key={burner.id}>
                <Link className="my-burns__itemlink" href={href}>
                  <div className="my-burns__cover">
                    {burner.cover_image_url ? (
                      <img
                        alt=""
                        src={burner.cover_image_url}
                        loading="lazy"
                      />
                    ) : (
                      <span>{burner.title.slice(0, 1) || "B"}</span>
                    )}
                  </div>
                  <div className="my-burns__meta">
                    <strong>{burner.title}</strong>
                    <span>
                      {burner.total_tracks} track
                      {burner.total_tracks === 1 ? "" : "s"} •{" "}
                      {formatDate(burner.created_at)}
                      {burner.is_revoked ? " • Revoked" : ""}
                    </span>
                    {link ? (
                      <span className="my-burns__shortcode">
                        {link.short_code}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
