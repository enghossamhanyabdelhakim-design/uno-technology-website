// Uno chatbot. Answers only from the site content stored in public.site_content.
// Secret needed: GEMINI_API_KEY (set in Supabase > Edge Functions > Secrets). Without it, a keyword fallback answers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
function flat(o: any, out: string[], skip = /^(images|theme|img|avatar|portfolio|portfolioSample|portfolioSoon|poses|banners|social|chatbot|nav|body|slug|kw|published|cat)$/): void {
  if (o == null) return;
  if (typeof o === "string") { if (o.length > 1 && !/^(assets\/|https?:|#)/.test(o)) out.push(o); return; }
  if (Array.isArray(o)) { o.forEach((x) => flat(x, out, skip)); return; }
  if (typeof o === "object") {
    if (typeof o.ar === "string" && typeof o.en === "string") { out.push(o.ar + " | " + o.en); return; }
    for (const k of Object.keys(o)) if (!skip.test(k)) flat(o[k], out, skip);
  }
}
let cache: { t: number; lines: string[] } | null = null;
async function company(): Promise<string[]> {
  if (cache && Date.now() - cache.t < 60000) return cache.lines;
  const { data } = await sb.from("site_content").select("data").eq("id", 1).maybeSingle();
  const lines: string[] = [];
  if (data?.data) {
    const d = data.data;
    flat(d, lines);
    if (d.contact) lines.push("Phone/WhatsApp: " + d.contact.phone + (d.contact.email ? " Email: " + d.contact.email : ""));
    if (d.blog) lines.push("Articles: " + d.blog.map((b: any) => b.title && (b.title.ar + " | " + b.title.en)).filter(Boolean).join(" ; "));
  }
  cache = { t: Date.now(), lines };
  return lines;
}
const toks = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
function fallback(q: string, lines: string[], ar: boolean) {
  const qs = new Set(toks(q));
  const scored = lines.map((l) => ({ l, s: toks(l).filter((w) => qs.has(w)).length })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
  if (!scored.length) return ar ? "مش لاقي إجابة مؤكدة عندي. كلّم فريقنا على واتساب 01505946321 وهيساعدوك." : "I don't have a confirmed answer. Please message our team on WhatsApp 01505946321.";
  return scored.map((x) => x.l).join("\n");
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { q, lang, history } = await req.json();
    const question = String(q || "").slice(0, 600);
    if (!question) return new Response(JSON.stringify({ a: "" }), { headers: { ...CORS, "Content-Type": "application/json" } });
    const ar = lang !== "en";
    const lines = await company();
    let a = "", dbg = "";
    const key = Deno.env.get("GEMINI_API_KEY");
    if (key) {
      const sys = "You are Uno, the assistant of Uno Technology Services (Farshout, Qena, Egypt). Answer ONLY from the COMPANY INFO below. Never invent prices, products, clients, numbers, offers or facts. If the answer is not in the info, say you are not sure and send the user to WhatsApp 01505946321. Keep answers short and friendly. Reply in " + (ar ? "Egyptian Arabic" : "English") + ".\n\nCOMPANY INFO:\n" + lines.join("\n").slice(0, 24000);
      const contents = ((history || []) as any[]).slice(-6).map((m) => ({ role: m.r === "u" ? "user" : "model", parts: [{ text: String(m.t || "").slice(0, 600) }] }));
      contents.push({ role: "user", parts: [{ text: question }] });
      const models = [Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-flash-latest"];
      for (const m of models) {
        const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent", {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents, generationConfig: { temperature: 0.2, maxOutputTokens: 400 } }),
        });
        const j = await r.json();
        a = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
        if (a) break;
        dbg = m + " " + r.status + " " + (j?.error?.message || "no text").slice(0, 160);
        await new Promise((res) => setTimeout(res, 600));
      }
    }
    sb.from("chat_log").insert({ q: question, a: a || "(local fallback)" }).then(() => {});
    return new Response(JSON.stringify({ a, dbg }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ a: "", error: String(e) }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
