import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { articleJsonLdGraph, pathnameToArticle } from "../articles/registry";
import { getSeoForPathname } from "../lib/seoConfig";
import { getSiteOrigin } from "../lib/siteOrigin";

const LD_JSON_ID = "wakibet-ld-json-website";
const LD_JSON_ARTICLE_ID = "wakibet-ld-json-article";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const safeKey = key.replace(/"/g, "");
  const selector = attr === "name" ? `meta[name="${safeKey}"]` : `meta[property="${safeKey}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(attr: "name" | "property", key: string) {
  const safeKey = key.replace(/"/g, "");
  const selector = attr === "name" ? `meta[name="${safeKey}"]` : `meta[property="${safeKey}"]`;
  document.head.querySelector(selector)?.remove();
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLdWebsite(origin: string) {
  let el = document.getElementById(LD_JSON_ID) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = LD_JSON_ID;
    document.head.appendChild(el);
  }
  const payload = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WakiBet",
    url: `${origin}/`,
    description:
      "Free-to-play fantasy pickleball, lacrosse, and volleyball with WakiCash lineups and WakiPoints leaderboards.",
  };
  el.textContent = JSON.stringify(payload);
}

function removeJsonLdWebsite() {
  document.getElementById(LD_JSON_ID)?.remove();
}

function setJsonLdArticle(payload: Record<string, unknown>) {
  let el = document.getElementById(LD_JSON_ARTICLE_ID) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = LD_JSON_ARTICLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(payload);
}

function removeJsonLdArticle() {
  document.getElementById(LD_JSON_ARTICLE_ID)?.remove();
}

/**
 * SPA head tags for search + sharing. Runs on every client navigation.
 * Set `VITE_SITE_ORIGIN` in production so canonical and og:url match your public domain.
 */
export default function Seo() {
  const { pathname } = useLocation();
  const seo = getSeoForPathname(pathname);
  const origin = getSiteOrigin();
  const canonical =
    pathname === "/" ? `${origin}/` : `${origin}${pathname.replace(/\/+$/, "") || "/"}`;
  const articleRecord = pathnameToArticle(pathname);

  useLayoutEffect(() => {
    document.title = seo.title;

    upsertMeta("name", "description", seo.description);

    if (seo.noindex) {
      upsertMeta("name", "robots", "noindex, nofollow");
    } else {
      removeMeta("name", "robots");
    }

    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:site_name", "WakiBet");
    upsertMeta("property", "og:image", `${origin}/brand/logo-primary.svg`);

    if (articleRecord) {
      upsertMeta("property", "og:type", "article");
      upsertMeta("property", "article:published_time", `${articleRecord.datePublished}T12:00:00.000Z`);
      upsertMeta("property", "article:modified_time", `${articleRecord.dateModified}T12:00:00.000Z`);
      upsertMeta("name", "keywords", articleRecord.keywords.join(", "));
      setJsonLdArticle(articleJsonLdGraph({ article: articleRecord, canonicalUrl: canonical, origin }));
    } else {
      upsertMeta("property", "og:type", "website");
      removeMeta("property", "article:published_time");
      removeMeta("property", "article:modified_time");
      removeMeta("name", "keywords");
      removeJsonLdArticle();
    }

    upsertMeta("name", "twitter:card", "summary");
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", `${origin}/brand/logo-primary.svg`);

    upsertCanonical(canonical);

    if (pathname === "/" || pathname === "") {
      setJsonLdWebsite(origin);
    } else {
      removeJsonLdWebsite();
    }
  }, [pathname, seo.title, seo.description, seo.noindex, canonical, origin, articleRecord]);

  return null;
}
