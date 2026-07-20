import { describe, it, expect } from "vitest";
import fr from "./locales/fr/translation.json";
import en from "./locales/en/translation.json";
import tr from "./locales/tr/translation.json";

type Json = Record<string, unknown>;

function flatten(obj: Json, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return v !== null && typeof v === "object"
      ? flatten(v as Json, key)
      : [key];
  });
}

describe("catalog parity", () => {
  const frKeys = flatten(fr as Json).sort();

  it("en has exactly the fr keys", () => {
    expect(flatten(en as Json).sort()).toEqual(frKeys);
  });

  it("tr has exactly the fr keys", () => {
    expect(flatten(tr as Json).sort()).toEqual(frKeys);
  });
});
