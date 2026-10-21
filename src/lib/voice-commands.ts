// Turns a spoken/typed sentence into a local SmartGhar action, or null (→ ask the AI).
export type Command =
  | { type: "grocery-add"; items: string[] }
  | { type: "grocery-read" }
  | { type: "budget-add"; amount: number; label: string }
  | { type: "budget-read" }
  | { type: "calc"; watts: number; hours: number }
  | { type: "device"; device: string; action: "on" | "off" };

export const DEVICES = ["fan", "light", "ac", "geyser", "tv", "motor", "plug"] as const;

export function parseCommand(raw: string): Command | null {
  const t = raw.toLowerCase().replace(/[.!?]/g, "").trim();

  let m = t.match(/^add (.+?) to (?:my |the )?(?:grocery|shopping) list$/);
  if (m) return { type: "grocery-add", items: m[1]!.split(/,| and /).map((s) => s.trim()).filter(Boolean) };
  if (/(read|show|what'?s on|what is on).*(grocery|shopping) list/.test(t)) return { type: "grocery-read" };

  m = t.match(/(?:add|spent|spend) (?:an )?(?:expense (?:of )?)?(?:rs\.? ?|₹|rupees ?)?(\d+(?:\.\d+)?)(?: rupees)?(?: (?:for|on) (.+))?$/);
  if (m) return { type: "budget-add", amount: Number(m[1]), label: m[2]?.trim() || "Expense" };
  if (/(how much|total).*(spent|budget|expenses?)|budget (status|summary)/.test(t)) return { type: "budget-read" };

  m = t.match(/(\d+(?:\.\d+)?) ?(?:watts?|w)\b.*?(\d+(?:\.\d+)?) ?(?:hours?|hrs?)/);
  if (m) return { type: "calc", watts: Number(m[1]), hours: Number(m[2]) };

  m = t.match(/(?:turn|switch) (on|off) (?:the )?(\w+)|(?:turn|switch) (?:the )?(\w+) (on|off)/);
  if (m) {
    const action = (m[1] ?? m[4]) as "on" | "off";
    const device = (m[2] ?? m[3])!;
    if ((DEVICES as readonly string[]).includes(device)) return { type: "device", device, action };
  }
  return null;
}

/** Monthly units (kWh) and cost for an appliance used daily. */
export function monthlyUsage(watts: number, hoursPerDay: number, rate: number) {
  const units = (watts * hoursPerDay * 30) / 1000;
  return { units: Math.round(units * 10) / 10, cost: Math.round(units * rate) };
}
