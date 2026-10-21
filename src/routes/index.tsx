import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Home, Zap, SprayCan, ChefHat, LayoutGrid, Send, Loader2, WifiOff, Bot, RotateCcw, Menu, X,
} from "lucide-react";
import { fallbackAnswer } from "@/lib/fallback";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartGhar – Your AI Home Helper" },
      { name: "description", content: "Ask SmartGhar for electricity saving tips, cleaning routines, recipes from your ingredients and home organization help." },
      { property: "og:title", content: "SmartGhar – Your AI Home Helper" },
      { property: "og:description", content: "A friendly AI helper for electricity, cleaning, cooking and organizing your home." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Msg = { role: "user" | "assistant"; content: string; offline?: boolean };

const FEATURES = [
  { id: "electricity", icon: Zap, title: "Electricity Saving", desc: "Lower your monthly bill with simple habits.",
    tips: ["Set AC to 24–26°C", "Switch to LED bulbs", "Unplug idle chargers & TVs", "Use geyser timers"],
    prompt: "Give me practical tips to reduce my electricity bill at home." },
  { id: "cleaning", icon: SprayCan, title: "Cleaning Assistant", desc: "Quick routines that keep the home fresh.",
    tips: ["Daily 15-min tidy-up", "Weekly bathroom deep clean", "Vinegar + baking soda for stains", "Lemon for microwave grime"],
    prompt: "Make me an easy weekly cleaning routine for a family home." },
  { id: "cooking", icon: ChefHat, title: "Cooking Assistant", desc: "Recipes from what's already in your kitchen.",
    tips: [], prompt: "" },
  { id: "organize", icon: LayoutGrid, title: "Home Organization", desc: "Declutter rooms and share chores fairly.",
    tips: ["One room at a time", "Keep / Donate / Discard", "Label storage boxes", "Weekly family chore chart"],
    prompt: "Help me organize a cluttered bedroom and make a family chore chart." },
];

const SUGGESTIONS = [
  "How can I reduce my AC bill in summer?",
  "How do I remove tough kitchen stains?",
  "What can I cook with rice, eggs and onions?",
  "How should we split household chores?",
];

function Index() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [ingredients, setIngredients] = useState("");
  const [menu, setMenu] = useState(false);
  const [chores, setChores] = useState([
    { t: "Wash dishes", who: "Everyone", done: false },
    { t: "Water the plants", who: "Kids", done: false },
    { t: "Take out trash", who: "Papa", done: true },
  ]);
  const [newChore, setNewChore] = useState("");
  const [who, setWho] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setError(null);
    const history: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(history);
    setInput("");
    setLoading(true);
    document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth" });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      if ((res.headers.get("content-type") ?? "").includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
        setOffline(true);
        setMessages((m) => [...m, { role: "assistant", content: data.text, offline: true }]);
        return;
      }
      if (!res.ok || !res.body) throw new Error("live");
      setOffline(false);
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) throw new Error("live");
    } catch (e) {
      // Live AI failed — fall back to built-in tips so the user still gets help.
      setMessages((m) => {
        const base = m[m.length - 1]?.role === "assistant" && !m[m.length - 1]!.content ? m.slice(0, -1) : m;
        return [...base, { role: "assistant", content: fallbackAnswer(q), offline: true }];
      });
      setError(
        e instanceof Error && e.message !== "live"
          ? e.message
          : "Live AI couldn't answer just now, so here's a built-in tip instead. Please try again shortly.",
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const navLinks = [["Assistant", "#assistant"], ["Features", "#features"], ["Cooking", "#cooking"], ["Chores", "#chores"]];

  return (
    <div className="min-h-screen bg-background font-sans">
      <VoiceBot />
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Home className="h-5 w-5" /></span>
            <span className="font-display text-xl font-bold">SmartGhar</span>
          </a>
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            {navLinks.map(([l, h]) => <a key={h} href={h} className="text-muted-foreground hover:text-primary">{l}</a>)}
          </nav>
          <button aria-label="Menu" className="md:hidden" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
        </div>
        {menu && (
          <nav className="flex flex-col border-t border-border px-4 py-2 md:hidden">
            {navLinks.map(([l, h]) => <a key={h} href={h} onClick={() => setMenu(false)} className="py-2 font-medium">{l}</a>)}
          </nav>
        )}
      </header>

      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="mb-3 inline-block rounded-full bg-primary-foreground/15 px-3 py-1 text-sm">🏡 AI Home Helper for families</p>
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight md:text-6xl">SmartGhar – Your AI Home Helper</h1>
          <p className="mt-4 max-w-xl text-lg opacity-90">Everyday home problems, solved simply. Save electricity, clean faster, cook with what you have and keep every room organized.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#assistant" className="rounded-full bg-primary-foreground px-6 py-3 font-semibold text-primary shadow-soft">Ask SmartGhar</a>
            <a href="#features" className="rounded-full border border-primary-foreground/50 px-6 py-3 font-semibold">Explore features</a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <h2 className="font-display text-3xl font-bold">How SmartGhar helps</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary"><f.icon className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              {f.tips.length > 0 && (
                <ul className="mt-4 space-y-1 text-sm">
                  {f.tips.map((t) => <li key={t} className="flex gap-2"><span className="text-primary">✓</span>{t}</li>)}
                </ul>
              )}
              <button
                onClick={() => (f.prompt ? send(f.prompt) : document.getElementById("cooking")?.scrollIntoView({ behavior: "smooth" }))}
                className="mt-auto pt-5 text-left text-sm font-semibold text-primary hover:underline"
              >
                {f.prompt ? "Ask for more tips →" : "Find a recipe →"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="cooking" className="scroll-mt-20 bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold">What's in your kitchen?</h2>
            <p className="mt-2 text-muted-foreground">List your ingredients and get recipe ideas instantly.</p>
          </div>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (ingredients.trim()) send(`Suggest 3 easy recipes I can make with: ${ingredients.trim()}. Include short steps.`);
            }}
          >
            <input
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g. rice, eggs, onion, tomato"
              className="flex-1 rounded-full border border-input bg-card px-5 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
            <button disabled={!ingredients.trim() || loading} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50">
              Get recipes
            </button>
          </form>
        </div>
      </section>

      <section id="chores" className="mx-auto max-w-3xl scroll-mt-20 px-4 pt-16">
        <h2 className="font-display text-3xl font-bold">Family chore list</h2>
        <p className="text-muted-foreground">Add chores, assign them and tick them off.</p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newChore.trim()) return;
            setChores((c) => [...c, { t: newChore.trim(), who: who.trim() || "Anyone", done: false }]);
            setNewChore(""); setWho("");
          }}
        >
          <input value={newChore} onChange={(e) => setNewChore(e.target.value)} placeholder="New chore" className="flex-1 rounded-xl border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
          <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="Who?" className="rounded-xl border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring sm:w-36" />
          <button disabled={!newChore.trim()} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">Add</button>
        </form>
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
          {chores.length === 0 && <li className="p-4 text-sm text-muted-foreground">No chores yet — add one above.</li>}
          {chores.map((c, i) => (
            <li key={i} className="flex items-center gap-3 p-4">
              <input type="checkbox" checked={c.done} onChange={() => setChores((l) => l.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} className="h-5 w-5 accent-primary" aria-label={`Mark ${c.t} done`} />
              <span className={`flex-1 ${c.done ? "text-muted-foreground line-through" : ""}`}>{c.t}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{c.who}</span>
              <button onClick={() => setChores((l) => l.filter((_, j) => j !== i))} aria-label={`Remove ${c.t}`} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">{chores.filter((c) => c.done).length} of {chores.length} done</p>
      </section>

      <section id="assistant" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-3xl font-bold">AI Home Assistant</h2>
            <p className="text-muted-foreground">Ask anything about your home.</p>
          </div>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setError(null); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
              <RotateCcw className="h-4 w-4" /> New chat
            </button>
          )}
        </div>

        {offline && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
            <WifiOff className="h-4 w-4" /> Live AI is not connected — showing built-in SmartGhar tips.
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div ref={listRef} className="h-[26rem] space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot className="h-10 w-10 text-primary" />
                <p className="mt-2 font-semibold">Namaste! How can I help at home today?</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:bg-accent">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground">{m.content}</div>
              ) : (
                <div key={i} className="flex gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Home className="h-4 w-4" /></span>
                  <div className="prose prose-sm max-w-[85%] text-sm leading-relaxed [&_li]:ml-4 [&_ul]:list-disc [&_ol]:list-decimal">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    {m.offline && <p className="mt-1 text-xs text-muted-foreground">Built-in tip</p>}
                  </div>
                </div>
              ),
            )}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> SmartGhar is thinking…</div>
            )}
          </div>
          {error && <div className="border-t border-border bg-muted px-4 py-2 text-sm text-destructive">{error}</div>}
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 border-t border-border p-3">
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Type your home question…"
              className="max-h-32 flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
            <button aria-label="Send" disabled={!input.trim() || loading} className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SmartGhar AI Home Helper · Made for happy homes
      </footer>
    </div>
  );
}
