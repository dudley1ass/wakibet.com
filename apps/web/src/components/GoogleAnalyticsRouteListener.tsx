import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends GA4 `page_view` on each client-side navigation (SPA). Initial HTML uses `send_page_view: false`. */
export default function GoogleAnalyticsRouteListener() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const page_path = `${location.pathname}${location.search}`;
    window.gtag("event", "page_view", {
      page_path,
      page_title: document.title,
      page_location: `${window.location.origin}${page_path}`,
    });
  }, [location.pathname, location.search]);

  return null;
}
