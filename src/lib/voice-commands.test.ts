import { describe, it, expect } from "vitest";
import { parseCommand, monthlyUsage } from "./voice-commands";

describe("parseCommand", () => {
  it("adds grocery items", () => {
    expect(parseCommand("Add milk and eggs to my grocery list")).toEqual({ type: "grocery-add", items: ["milk", "eggs"] });
  });
  it("adds a budget expense", () => {
    expect(parseCommand("I spent 500 rupees on vegetables")).toEqual({ type: "budget-add", amount: 500, label: "vegetables" });
  });
  it("parses electricity calculation", () => {
    expect(parseCommand("1500 watts for 4 hours")).toEqual({ type: "calc", watts: 1500, hours: 4 });
  });
  it("parses device control", () => {
    expect(parseCommand("Turn off the fan")).toEqual({ type: "device", device: "fan", action: "off" });
  });
  it("leaves general questions for the AI", () => {
    expect(parseCommand("How do I clean my sink?")).toBeNull();
  });
});

describe("monthlyUsage", () => {
  it("1000W for 5h/day at ₹8 = 150 units, ₹1200", () => {
    expect(monthlyUsage(1000, 5, 8)).toEqual({ units: 150, cost: 1200 });
  });
});
