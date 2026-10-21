import { createFileRoute } from "@tanstack/react-router";
import { DEVICES } from "@/lib/voice-commands";

// Secure integration point for future ESP32 hardware.
// Configure server secrets ESP32_BASE_URL (e.g. https://my-esp32.example.com) and ESP32_TOKEN.
// The ESP32 must expose POST /control {device, action} with Bearer auth and reply {"ok":true,"state":"on"|"off"}.
// We only report success when the hardware itself confirms it.
export const Route = createFileRoute("/api/device")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let device = "", action = "";
        try {
          ({ device, action } = await request.json());
        } catch {
          return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
        }
        if (!(DEVICES as readonly string[]).includes(device) || !["on", "off"].includes(action))
          return Response.json({ ok: false, message: "Unknown device or action." }, { status: 400 });

        const base = process.env["ESP32_BASE_URL"];
        const token = process.env["ESP32_TOKEN"];
        if (!base || !token)
          return Response.json({ ok: false, configured: false, message: "No smart-home hardware is connected yet, so nothing was switched." });

        try {
          const res = await fetch(`${base.replace(/\/$/, "")}/control`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ device, action }),
            signal: AbortSignal.timeout(6000),
          });
          const data = (await res.json().catch(() => ({}))) as { ok?: boolean; state?: string };
          if (res.ok && data.ok === true && data.state === action)
            return Response.json({ ok: true, configured: true, message: `The device confirmed: ${device} is now ${action}.` });
          return Response.json({ ok: false, configured: true, message: `The device did not confirm the change, so the ${device} may not have switched.` });
        } catch {
          return Response.json({ ok: false, configured: true, message: `Couldn't reach the home device. The ${device} was not switched.` });
        }
      },
    },
  },
});
