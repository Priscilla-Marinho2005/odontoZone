import { useEffect, useMemo, useState } from "react";
import { LuPlus, LuSend, LuX } from "react-icons/lu";
import type { Patient, Quote, QuoteLine, QuoteStatus } from "../data/clinicPatients";
import { hydrateQuote, quoteNet, quoteStatuses } from "../data/clinicPatients";
import { planTotal } from "../data/treatmentPlan";
import { usePatients } from "./Pacientes";

const months = [
  { value: "0", label: "Todos os meses" },
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const statusStyle: Record<QuoteStatus, string> = {
  Rascunho: "bg-st-agendado/12 text-st-agendado",
  Pendente: "bg-st-agendado/12 text-st-agendado",
  Enviado: "bg-st-atendimento/12 text-st-atendimento",
  Visualizado: "bg-st-retorno/12 text-st-retorno",
  "Em negociação": "bg-st-atrasado/12 text-st-atrasado",
  Aprovado: "bg-st-concluido/12 text-st-concluido",
  Recusado: "bg-st-cancelado/12 text-st-cancelado",
  Expirado: "bg-st-cancelado/12 text-st-cancelado",
};

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return iso.split("-").reverse().join("/");
}

function publicUrl(token: string) {
  return `${window.location.origin}${window.location.pathname}#/orcamento/${token}`;
}

function whatsappDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function emptyLine(): QuoteLine {
  return { id: `line-${crypto.randomUUID()}`, name: "", quantity: 1, unitValue: 0 };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
}

function printQuote(patient: Patient, quote: Quote) {
  const logo = `${window.location.origin}/IconeLogoSemFundo.png`;
  const lines = (quote.procedures ?? []).map((item) => (
    `<tr>
      <td>${escapeHtml(item.name)}</td>
      <td class="num">${item.quantity}</td>
      <td class="num">${money(item.unitValue)}</td>
      <td class="num">${money(item.quantity * item.unitValue)}</td>
    </tr>`
  )).join("");
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Orçamento ${escapeHtml(quote.id)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #053647;
      --navy-soft: #0b4a60;
      --teal: #018295;
      --surface: #f3f7f8;
      --line: #dbe5e8;
      --ink: #0d2c38;
      --muted: #6b8590;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--surface);
      color: var(--ink);
      font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
    }
    .page { padding: 28px; }
    .card {
      max-width: 720px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
    }
    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 24px;
      background: linear-gradient(90deg, var(--navy), var(--navy-soft));
      color: #fff;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand img { width: 36px; height: 36px; object-fit: contain; }
    .brand strong { display: block; font-size: 14px; font-weight: 600; }
    .brand span { font-size: 11px; color: #a8c8d6; }
    .hero-id { text-align: right; font-size: 12px; color: #a8c8d6; }
    .hero-id b { display: block; color: #fff; font-size: 16px; font-weight: 600; }
    .body { padding: 24px; }
    .kicker { margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .04em; color: var(--teal); }
    h1 { margin: 4px 0 0; font-size: 26px; font-weight: 600; line-height: 1.2; }
    .meta { margin: 6px 0 0; font-size: 13px; color: var(--muted); }
    .chip {
      display: inline-block;
      margin-top: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #0182951f;
      color: var(--teal);
      font-size: 11px;
      font-weight: 600;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    thead th {
      text-align: left;
      font-size: 11px;
      font-weight: 500;
      color: var(--muted);
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      padding: 10px 12px;
    }
    td { padding: 12px; border-bottom: 1px solid var(--line); }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals {
      margin-top: 16px;
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
    }
    .totals p { display: flex; justify-content: space-between; margin: 0 0 8px; font-size: 13px; }
    .totals p:last-child { margin: 0; font-size: 16px; font-weight: 600; color: var(--navy); }
    .totals .muted { color: var(--muted); font-weight: 400; }
    .notes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
    .note {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 12px 14px;
    }
    .note span { display: block; font-size: 11px; color: var(--muted); }
    .note strong { display: block; margin-top: 4px; font-size: 13px; font-weight: 500; }
    footer { padding: 0 24px 20px; font-size: 11px; color: var(--muted); }
    @media print {
      body { background: #fff; }
      .page { padding: 0; }
      .card { border: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <article class="card">
      <header class="hero">
        <div class="brand">
          <img src="${logo}" alt="OdontoZone">
          <div>
            <strong>Odonto<span style="font-weight:500;color:#a8c8d6">Zone</span></strong>
            <span>Plataforma</span>
          </div>
        </div>
        <div class="hero-id">Orçamento<b>${escapeHtml(quote.id)}</b></div>
      </header>
      <div class="body">
        <p class="kicker">ÁUREA ODONTO</p>
        <h1>${escapeHtml(quote.title)}</h1>
        <p class="meta">${escapeHtml(patient.name)} · ${escapeHtml(patient.protocol)}</p>
        <span class="chip">${escapeHtml(quote.status)}</span>
        <table>
          <thead>
            <tr>
              <th>Procedimento</th>
              <th class="num">Qtd</th>
              <th class="num">Unitário</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>${lines}</tbody>
        </table>
        <div class="totals">
          <p><span class="muted">Desconto</span><span>${money(quote.discount ?? 0)}</span></p>
          <p><span>Total</span><span>${money(quoteNet(quote))}</span></p>
        </div>
        <div class="notes">
          <div class="note"><span>Condições de pagamento</span><strong>${escapeHtml(quote.paymentTerms || "A combinar")}</strong></div>
          <div class="note"><span>Validade</span><strong>${formatDate(quote.expiresAt ?? "")}</strong></div>
        </div>
      </div>
      <footer>Documento gerado pelo OdontoZone · ${formatDate(today())}</footer>
    </article>
  </div>
</body>
</html>`;
  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}

export function QuotePublicView({ token }: { token: string }) {
  const { patients, setPatients } = usePatients();
  const found = patients.flatMap((patient) => patient.quotes.map((quote) => ({ patient, quote }))).find((row) => row.quote.token === token);

  useEffect(() => {
    if (!found) return;
    if (found.quote.viewedAt) return;
    if (found.quote.status === "Recusado" || found.quote.status === "Expirado" || found.quote.status === "Aprovado") return;
    setPatients((current) => current.map((patient) => (
      patient.protocol !== found.patient.protocol ? patient : {
        ...patient,
        quotes: patient.quotes.map((quote) => quote.token === token ? hydrateQuote({
          ...quote,
          viewedAt: today(),
          status: quote.status === "Rascunho" ? "Visualizado" : quote.status === "Enviado" || quote.status === "Pendente" ? "Visualizado" : quote.status,
          history: [{ date: today(), text: "Paciente visualizou o orçamento online" }, ...(quote.history ?? [])],
        }) : quote),
      }
    )));
  }, [found, setPatients, token]);

  if (!found) {
    return (
      <main className="min-h-screen bg-surface px-4 py-10">
        <p className="mx-auto max-w-lg text-center text-[14px] text-muted">Orçamento não encontrado.</p>
      </main>
    );
  }

  const { patient, quote } = found;
  return (
    <main className="min-h-screen bg-surface px-4 py-8">
      <article className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-line bg-white">
        <header className="flex items-center justify-between gap-4 bg-linear-to-r from-navy to-navy-soft px-5 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/IconeLogoSemFundo.png" alt="" className="h-9 w-9 object-contain" />
            <div>
              <p className="text-[14px] font-semibold text-white">Odonto<span className="font-medium text-active">Zone</span></p>
              <p className="text-[11px] text-active">Plataforma</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-active">Orçamento</p>
            <p className="text-[16px] font-semibold text-white">{quote.id}</p>
          </div>
        </header>
        <div className="px-5 py-5">
          <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
          <h1 className="mt-1 text-[24px] font-semibold leading-tight">{quote.title}</h1>
          <p className="mt-1 text-[13px] text-muted">{patient.name} · {patient.protocol}</p>
          <span className="mt-3 inline-flex rounded-full bg-teal/12 px-2.5 py-1 text-[11px] font-semibold text-teal">{quote.status}</span>
          <table className="mt-5 w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface text-[11px] font-medium text-muted">
                <th className="px-3 py-2 font-medium">Procedimento</th>
                <th className="px-3 py-2 font-medium text-right">Qtd</th>
                <th className="px-3 py-2 font-medium text-right">Unitário</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(quote.procedures ?? []).map((item) => (
                <tr key={item.id} className="border-b border-line">
                  <td className="px-3 py-3">{item.name}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{money(item.unitValue)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{money(item.quantity * item.unitValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-3">
            <p className="flex justify-between text-[13px]"><span className="text-muted">Desconto</span><span>{money(quote.discount ?? 0)}</span></p>
            <p className="mt-2 flex justify-between text-[16px] font-semibold text-navy"><span>Total</span><span>{money(quoteNet(quote))}</span></p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-[11px] text-muted">Condições de pagamento</p>
              <p className="mt-1 text-[13px] font-medium">{quote.paymentTerms}</p>
            </div>
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-[11px] text-muted">Validade</p>
              <p className="mt-1 text-[13px] font-medium">{formatDate(quote.expiresAt ?? "")}</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}

export default function Orcamentos({ onOpenPatient }: { onOpenPatient?: (protocol: string) => void }) {
  const { patients, setPatients } = usePatients();
  const [month, setMonth] = useState("0");
  const [year, setYear] = useState("2026");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "todos">("todos");
  const [active, setActive] = useState<{ protocol: string; id: string } | null>(null);
  const [compose, setCompose] = useState(false);
  const [note, setNote] = useState("");

  const [protocol, setProtocol] = useState(patients[0]?.protocol ?? "");
  const [planId, setPlanId] = useState("");
  const [title, setTitle] = useState("");
  const [terms, setTerms] = useState("3x no cartão ou Pix à vista");
  const [discount, setDiscount] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([emptyLine()]);

  const selectedPatient = patients.find((item) => item.protocol === protocol);
  const rows = useMemo(() => {
    return patients.flatMap((patient) => patient.quotes.map((quote) => ({ patient, quote: hydrateQuote(quote) })));
  }, [patients]);

  const filtered = rows.filter(({ quote }) => {
    const [quoteYear, quoteMonth] = quote.date.split("-");
    if (year && quoteYear !== year) return false;
    if (month !== "0" && String(Number(quoteMonth)) !== month) return false;
    if (statusFilter !== "todos" && quote.status !== statusFilter) return false;
    return true;
  });

  const years = useMemo(() => {
    const found = new Set(rows.map((row) => row.quote.date.slice(0, 4)).filter(Boolean));
    found.add("2026");
    found.add("2027");
    return [...found].sort();
  }, [rows]);

  const stats = useMemo(() => {
    const sent = rows.filter((row) => row.quote.sentAt || ["Enviado", "Visualizado", "Em negociação", "Aprovado", "Recusado"].includes(row.quote.status)).length;
    const viewed = rows.filter((row) => row.quote.viewedAt || row.quote.status === "Visualizado").length;
    const approved = rows.filter((row) => row.quote.status === "Aprovado").length;
    const rate = sent === 0 ? 0 : Math.round((approved / sent) * 100);
    return { sent, viewed, approved, rate, total: rows.reduce((sum, row) => sum + quoteNet(row.quote), 0) };
  }, [rows]);

  const current = active
    ? rows.find((row) => row.patient.protocol === active.protocol && row.quote.id === active.id) ?? null
    : null;

  function patchQuote(protocolId: string, quoteId: string, updater: (quote: Quote, patient: Patient) => { quote: Quote; extra?: Partial<Patient> }) {
    setPatients((currentList) => currentList.map((patient) => {
      if (patient.protocol !== protocolId) return patient;
      const quote = patient.quotes.find((item) => item.id === quoteId);
      if (!quote) return patient;
      const next = updater(hydrateQuote(quote), patient);
      return {
        ...patient,
        ...next.extra,
        quotes: patient.quotes.map((item) => (item.id === quoteId ? hydrateQuote({ ...next.quote, value: quoteNet(next.quote) }) : item)),
      };
    }));
  }

  function history(quote: Quote, text: string): Quote {
    return { ...quote, history: [{ date: today(), text }, ...(quote.history ?? [])] };
  }

  function applyPlan(id: string) {
    setPlanId(id);
    const plan = selectedPatient?.plans?.find((item) => item.id === id);
    if (!plan) return;
    setTitle(plan.name);
    setDiscount(String(plan.discount));
    setTerms(plan.paymentTerms || terms);
    setLines(plan.procedures.map((item) => ({
      id: `line-${crypto.randomUUID()}`,
      name: item.name,
      quantity: item.quantity,
      unitValue: item.unitValue,
    })));
  }

  function createQuote() {
    const patient = selectedPatient;
    if (!patient) return;
    const procedures = lines.filter((item) => item.name.trim());
    if (procedures.length === 0) return;
    const draft: Quote = hydrateQuote({
      id: `ORC-${Date.now().toString().slice(-6)}`,
      date: today(),
      title: title.trim() || procedures[0].name,
      value: 0,
      status: "Rascunho",
      procedures,
      discount: Number(discount) || 0,
      paymentTerms: terms.trim() || "A combinar",
      planId,
      token: `tk${crypto.randomUUID().slice(0, 8)}`,
      expiresAt,
      history: [{ date: today(), text: "Orçamento criado" }],
    });
    setPatients((currentList) => currentList.map((item) => (
      item.protocol === patient.protocol
        ? { ...item, quotes: [draft, ...item.quotes], funnelStage: "Orçamento", nextAction: `Orçamento ${draft.id} em rascunho` }
        : item
    )));
    setActive({ protocol: patient.protocol, id: draft.id });
    setCompose(false);
    setTitle("");
    setLines([emptyLine()]);
    setPlanId("");
  }

  function markSent(channel: "WhatsApp" | "E-mail" | "Link") {
    if (!current) return;
    const { patient, quote } = current;
    const link = publicUrl(quote.token || quote.id);
    const body = `Olá, ${patient.name.split(" ")[0]}! Segue o orçamento ${quote.id} (${quote.title}) no valor de ${money(quoteNet(quote))}. Visualize em ${link}`;
    if (channel === "WhatsApp") {
      const digits = whatsappDigits(patient.whatsapp || patient.phone);
      if (digits) window.open(`https://wa.me/${digits}?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
    }
    if (channel === "E-mail" && patient.email) {
      window.open(`mailto:${patient.email}?subject=${encodeURIComponent(`Orçamento ${quote.id}`)}&body=${encodeURIComponent(body)}`, "_self");
    }
    if (channel === "Link") {
      void navigator.clipboard?.writeText(link);
    }
    patchQuote(patient.protocol, quote.id, (item) => ({
      quote: history({
        ...item,
        status: item.status === "Rascunho" || item.status === "Pendente" ? "Enviado" : item.status,
        sentAt: today(),
        sentChannel: channel,
      }, `Enviado por ${channel}`),
      extra: {
        interactions: [{
          date: today(),
          channel: channel === "E-mail" ? "E-mail" : "WhatsApp",
          summary: `Orçamento ${quote.id} enviado por ${channel}.`,
        }, ...patient.interactions],
        funnelStage: "Aguardando aprovação",
        nextAction: `Acompanhar orçamento ${quote.id}`,
      },
    }));
  }

  function setStatus(status: QuoteStatus, extraText?: string) {
    if (!current) return;
    const { patient, quote } = current;
    const text = extraText || `Status: ${status}`;
    patchQuote(patient.protocol, quote.id, (item) => ({
      quote: history({
        ...item,
        status,
        negotiation: status === "Em negociação" ? (extraText || item.negotiation) : item.negotiation,
        viewedAt: status === "Visualizado" ? (item.viewedAt || today()) : item.viewedAt,
      }, text),
      extra: status === "Aprovado" ? {
        funnelStage: "Tratamento iniciado" as const,
        status: "Em tratamento" as const,
        nextAction: `Orçamento ${quote.id} aprovado`,
        value: quoteNet(quote),
      } : status === "Recusado" ? {
        nextAction: `Orçamento ${quote.id} recusado`,
      } : status === "Expirado" ? {
        nextAction: `Orçamento ${quote.id} expirado`,
      } : undefined,
    }));
  }

  const draftTotal = Math.max(0, lines.reduce((sum, item) => sum + item.quantity * item.unitValue, 0) - (Number(discount) || 0));

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Orçamentos</h1>
            <p className="text-[13px] text-muted">Criação, envio e acompanhamento dos orçamentos.</p>
          </div>
          <button type="button" onClick={() => setCompose(true)} className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">
            <LuPlus size={15} /> Criar orçamento
          </button>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Enviados", String(stats.sent), money(stats.total)],
            ["Visualizados", String(stats.viewed), "Pelo paciente"],
            ["Aprovados", String(stats.approved), `${stats.rate}% de aprovação`],
            ["No filtro", String(filtered.length), "Lista atual"],
          ].map(([label, value, hint]) => (
            <article key={label} className="rounded-lg border border-line bg-white px-4 py-3">
              <p className="text-[12px] text-muted">{label}</p>
              <p className="mt-1 text-[22px] font-semibold">{value}</p>
              <p className="text-[12px] text-muted">{hint}</p>
            </article>
          ))}
        </section>

        <div className="mt-4 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-3">
          <label className="block text-[11px] font-medium text-muted">
            Mês
            <select value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
              {months.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block text-[11px] font-medium text-muted">
            Ano
            <select value={year} onChange={(event) => setYear(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
              {years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-[11px] font-medium text-muted">
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as QuoteStatus | "todos")} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
              <option value="todos">Todos</option>
              {quoteStatuses.filter((item) => item !== "Pendente").map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-lg border border-line bg-white">
            {filtered.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-muted">Nenhum orçamento neste filtro.</p>
            ) : (
              <ul>
                {filtered.map(({ patient, quote }) => (
                  <li key={`${patient.protocol}-${quote.id}`}>
                    <button
                      type="button"
                      onClick={() => setActive({ protocol: patient.protocol, id: quote.id })}
                      className={`w-full border-t border-line px-4 py-3 text-left first:border-t-0 ${
                        active?.id === quote.id && active.protocol === patient.protocol ? "bg-teal/8" : "hover:bg-surface"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[14px] font-semibold">{patient.name}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle[quote.status]}`}>{quote.status}</span>
                      </div>
                      <p className="mt-1 text-[12px] text-muted">{quote.id} · {quote.title} · {formatDate(quote.date)} · {money(quoteNet(quote))}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {current ? (
            <aside className="rounded-lg border border-line bg-white px-4 py-4">
              <p className="text-[12px] text-muted">{current.quote.id}</p>
              <h2 className="text-[18px] font-semibold">{current.quote.title}</h2>
              <button type="button" onClick={() => onOpenPatient?.(current.patient.protocol)} className="mt-1 text-[13px] font-medium text-teal hover:underline">
                {current.patient.name}
              </button>
              <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle[current.quote.status]}`}>{current.quote.status}</p>
              <p className="mt-2 text-[12px] text-muted">
                Plano: {current.patient.plans?.find((item) => item.id === current.quote.planId)?.name || "Não associado"}
              </p>
              <ul className="mt-3 space-y-1 text-[13px]">
                {(current.quote.procedures ?? []).map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span>{item.quantity}× {item.name}</span>
                    <span className="tabular-nums">{money(item.quantity * item.unitValue)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between text-[13px]"><span className="text-muted">Desconto</span><span>{money(current.quote.discount ?? 0)}</span></p>
              <p className="flex justify-between text-[15px] font-semibold"><span>Total</span><span>{money(quoteNet(current.quote))}</span></p>
              <p className="mt-2 text-[12px] text-muted">Condições: {current.quote.paymentTerms}</p>
              {current.quote.expiresAt && <p className="text-[12px] text-muted">Validade: {formatDate(current.quote.expiresAt)}</p>}
              {current.quote.viewedAt && <p className="text-[12px] text-teal">Visualizado em {formatDate(current.quote.viewedAt)}</p>}
              {current.quote.negotiation && <p className="mt-2 text-[13px]">Negociação: {current.quote.negotiation}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => printQuote(current.patient, current.quote)} className="rounded-md border border-line px-3 py-1.5 text-[12px] font-medium">PDF / imprimir</button>
                <button type="button" onClick={() => markSent("WhatsApp")} className="inline-flex items-center gap-1 rounded-md bg-teal px-3 py-1.5 text-[12px] font-medium text-white">
                  <LuSend size={13} /> WhatsApp
                </button>
                <button type="button" onClick={() => markSent("E-mail")} className="rounded-md border border-line px-3 py-1.5 text-[12px] font-medium">E-mail</button>
                <button type="button" onClick={() => markSent("Link")} className="rounded-md border border-line px-3 py-1.5 text-[12px] font-medium">Copiar link</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setStatus("Visualizado")} className="text-[12px] font-medium text-teal hover:underline">Marcar visualizado</button>
                <button type="button" onClick={() => setStatus("Aprovado")} className="text-[12px] font-medium text-teal hover:underline">Aprovar</button>
                <button type="button" onClick={() => setStatus("Recusado")} className="text-[12px] font-medium text-teal hover:underline">Recusar</button>
                <button type="button" onClick={() => setStatus("Expirado")} className="text-[12px] font-medium text-teal hover:underline">Expirar</button>
              </div>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!note.trim()) return;
                  setStatus("Em negociação", note.trim());
                  setNote("");
                }}
              >
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Registrar negociação" className="min-w-0 flex-1 rounded-md border border-line px-2 py-1.5 text-[12px] outline-none focus:border-teal" />
                <button type="submit" className="rounded-md border border-line px-2 py-1.5 text-[12px] font-medium">Salvar</button>
              </form>
              <h3 className="mt-4 text-[13px] font-semibold">Histórico</h3>
              <ul className="mt-2 space-y-1">
                {(current.quote.history ?? []).map((item, index) => (
                  <li key={`${item.date}-${index}`} className="text-[12px] text-muted">{formatDate(item.date)} · {item.text}</li>
                ))}
              </ul>
            </aside>
          ) : (
            <p className="rounded-lg border border-line bg-white px-4 py-10 text-center text-[13px] text-muted">Selecione um orçamento para enviar e acompanhar.</p>
          )}
        </div>
      </div>

      {compose && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            onSubmit={(event) => { event.preventDefault(); createQuote(); }}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 sm:max-w-lg sm:rounded-xl"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-[20px] font-semibold">Novo orçamento</h2>
              <button type="button" aria-label="Fechar" onClick={() => setCompose(false)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface">
                <LuX size={16} />
              </button>
            </div>
            <label className="mt-4 block text-[11px] font-medium text-muted">
              Paciente
              <select value={protocol} onChange={(event) => { setProtocol(event.target.value); setPlanId(""); }} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
                {patients.map((patient) => <option key={patient.protocol} value={patient.protocol}>{patient.name}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Plano de tratamento
              <select value={planId} onChange={(event) => applyPlan(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
                <option value="">Sem plano</option>
                {(selectedPatient?.plans ?? []).map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name} · {money(planTotal(plan))}</option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Título
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <div className="mt-3">
              <p className="text-[11px] font-medium text-muted">Procedimentos</p>
              <ul className="mt-2 space-y-2">
                {lines.map((line) => (
                  <li key={line.id} className="grid grid-cols-[1fr_64px_96px] gap-2">
                    <input value={line.name} onChange={(event) => setLines((currentLines) => currentLines.map((item) => item.id === line.id ? { ...item, name: event.target.value } : item))} placeholder="Procedimento" className="rounded-md border border-line px-2 py-1.5 text-[12px] outline-none focus:border-teal" />
                    <input type="number" min={1} value={line.quantity} onChange={(event) => setLines((currentLines) => currentLines.map((item) => item.id === line.id ? { ...item, quantity: Number(event.target.value) } : item))} className="rounded-md border border-line px-2 py-1.5 text-[12px] outline-none focus:border-teal" />
                    <input type="number" min={0} value={line.unitValue} onChange={(event) => setLines((currentLines) => currentLines.map((item) => item.id === line.id ? { ...item, unitValue: Number(event.target.value) } : item))} className="rounded-md border border-line px-2 py-1.5 text-[12px] outline-none focus:border-teal" />
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setLines((currentLines) => [...currentLines, emptyLine()])} className="mt-2 text-[12px] font-medium text-teal hover:underline">Adicionar procedimento</button>
            </div>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Desconto (R$)
              <input type="number" min={0} value={discount} onChange={(event) => setDiscount(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Condições de pagamento
              <input value={terms} onChange={(event) => setTerms(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Validade
              <input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <p className="mt-3 text-[13px] font-semibold">Total {money(draftTotal)}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setCompose(false)} className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium">Cancelar</button>
              <button type="submit" className="rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
