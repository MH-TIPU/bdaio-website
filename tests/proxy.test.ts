import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { splitLocale } from "@/lib/i18n/config";

const ORIGIN = "https://bdaio.example";

function run(pathname: string) {
  const response = proxy(new NextRequest(new URL(`${ORIGIN}${pathname}`)));
  return {
    status: response.status,
    location: response.headers.get("location"),
  };
}

describe("splitLocale", () => {
  it("strips a live locale prefix", () => {
    expect(splitLocale("/en")).toEqual({ locale: "en", rest: "/", legacy: false });
    expect(splitLocale("/en/events")).toEqual({ locale: "en", rest: "/events", legacy: false });
  });

  it("strips a retired locale prefix and says so", () => {
    expect(splitLocale("/bn/faq")).toEqual({ locale: null, rest: "/faq", legacy: true });
    expect(splitLocale("/bn")).toEqual({ locale: null, rest: "/", legacy: true });
  });

  it("only matches whole path segments", () => {
    // The bug this guards: a `startsWith("/en")` check reads these as locales.
    for (const pathname of ["/enrol", "/energy", "/events", "/bnagar"]) {
      expect(splitLocale(pathname)).toEqual({ locale: null, rest: pathname, legacy: false });
    }
  });
});

describe("proxy locale redirects", () => {
  it("301s a live locale prefix to the un-prefixed URL", () => {
    expect(run("/en")).toEqual({ status: 301, location: `${ORIGIN}/` });
    expect(run("/en/events")).toEqual({ status: 301, location: `${ORIGIN}/events` });
  });

  it("301s a retired locale prefix to the un-prefixed URL", () => {
    expect(run("/bn/faq")).toEqual({ status: 301, location: `${ORIGIN}/faq` });
  });

  it("keeps the query string across the redirect", () => {
    expect(run("/en/events?year=2026")).toEqual({
      status: 301,
      location: `${ORIGIN}/events?year=2026`,
    });
  });

  it("leaves a route that merely starts with those letters alone", () => {
    // /enrol used to redirect to /enrol — an infinite loop that took the route
    // down completely. Nothing here may produce a redirect.
    for (const pathname of ["/enrol", "/energy", "/events", "/bnagar", "/about"]) {
      expect(run(pathname).location).toBeNull();
    }
  });
});
