import { describe, it, expect } from "vitest";
import { fallbackAnswer, OFFLINE_DEFAULT } from "./fallback";

describe("fallbackAnswer", () => {
  it("answers electricity questions", () => {
    expect(fallbackAnswer("How to lower my electricity bill?")).toContain("electricity bill");
  });
  it("answers cooking questions", () => {
    expect(fallbackAnswer("recipe with eggs")).toContain("recipe");
  });
  it("uses default for unknown topics", () => {
    expect(fallbackAnswer("xyz")).toBe(OFFLINE_DEFAULT);
  });
});
