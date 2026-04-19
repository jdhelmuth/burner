"use client";

import { useEffect } from "react";

export function CanonicalLocalhost() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const { hostname, href } = window.location;
    if (hostname !== "127.0.0.1" && hostname !== "0.0.0.0") {
      return;
    }

    const nextUrl = new URL(href);
    nextUrl.hostname = "localhost";
    window.location.replace(nextUrl.toString());
  }, []);

  return null;
}
