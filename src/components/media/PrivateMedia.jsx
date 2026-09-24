import React, { useEffect, useState } from "react";
import supabase from "../../api/supabase";

// Existing DB public URLs remain stable locators; the bucket itself is private.
export function storageImagePath(source) {
  if (!source) return null;
  const base = supabase.storage.from("voice-images").getPublicUrl("").data.publicUrl;
  try {
    const url = new URL(source);
    const root = new URL(base);
    if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return null;
    return decodeURIComponent(url.pathname.slice(root.pathname.length));
  } catch { return null; }
}

function usePrivateMedia(source) {
  const [loaded, setLoaded] = useState(null);
  const path = storageImagePath(source);
  useEffect(() => {
    if (path === null) return;
    let active = true;
    let blobUrl;
    supabase.storage.from("voice-images").download(path).then(({ data, error }) => {
      if (!active || error || !data) return;
      blobUrl = URL.createObjectURL(data);
      setLoaded({ source, url: blobUrl });
    }).catch(() => {});
    return () => { active = false; if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [source, path]);
  return path === null ? source : loaded?.source === source ? loaded.url : undefined;
}

export default function PrivateImage({ src, ...props }) {
  const url = usePrivateMedia(src);
  return <img {...props} src={url} />;
}

export function PrivateMediaLink({ href, children, ...props }) {
  const url = usePrivateMedia(href);
  return <a {...props} href={url} onClick={event => { if (!url) event.preventDefault(); }}>{children}</a>;
}
