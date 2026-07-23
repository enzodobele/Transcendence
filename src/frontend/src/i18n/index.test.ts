import { describe, it, expect, beforeEach } from "vitest";
import { getInitialLanguage, setLanguage, DEFAULT_LANGUAGE } from "./index";
import i18n from "./index";

describe("i18n helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "";
  });

  it("defaults to fr when nothing is stored", () => {
    expect(getInitialLanguage()).toBe(DEFAULT_LANGUAGE);
    expect(DEFAULT_LANGUAGE).toBe("fr");
  });

  it("reads a valid stored language", () => {
    localStorage.setItem("lang", "tr");
    expect(getInitialLanguage()).toBe("tr");
  });

  it("ignores an invalid stored language", () => {
    localStorage.setItem("lang", "xx");
    expect(getInitialLanguage()).toBe("fr");
  });

  it("setLanguage persists, switches i18next, and sets <html lang>", async () => {
    await setLanguage("en");
    expect(localStorage.getItem("lang")).toBe("en");
    expect(i18n.language).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(i18n.t("common.loading")).toBe("Loading ChessGuard...");
  });
});
