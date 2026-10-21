import { useMemo, useState } from "react";
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

type QuoteStatus = "Enviado" | "Em andamento" | "Aprovado" | "Recusado";

const statusStyle: Record<QuoteStatus, string> = {
  Enviado: "bg-st-agendado/12 text-st-agendado",
  "Em andamento": "bg-st-atendimento/12 text-st-atendimento",
  Aprovado: "bg-st-concluido/12 text-st-concluido",
  Recusado: "bg-st-cancelado/12 text-st-cancelado",
};

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function quoteStatus(paid: number, total: number, inactive: boolean): QuoteStatus {
  if (inactive && paid < total) return "Recusado";
  if (total > 0 && paid >= total) return "Aprovado";
  if (paid > 0) return "Em andamento";
  return "Enviado";
}

export default function Orcamentos() {
  const { patients } = usePatients();
  const [month, setMonth] = useState("0");
  const [year, setYear] = useState("2026");

  const years = useMemo(() => {
    const found = new Set(patients.map((patient) => patient.lastVisit.slice(0, 4)).filter(Boolean));
    found.add("2026");
    found.add("2027");
    return [...found].sort();
  }, [patients]);

  const quotes = useMemo(() => {
    return patients.flatMap((patient) => {
      const rows = patient.quotes.length > 0
        ? patient.quotes.map((quote) => ({
            protocol: patient.protocol,
            name: patient.name,
            treatment: quote.title,
            stage: patient.funnelStage,
            total: quote.value,
            paid: patient.paid,
            pending: Math.max(quote.value - patient.paid, 0),
            date: quote.date,
            status: quote.status === "Recusado" || quote.status === "Expirado"
              ? "Recusado" as QuoteStatus
              : quoteStatus(patient.paid, quote.value, patient.status === "Inativo"),
          }))
        : [{
            protocol: patient.protocol,
            name: patient.name,
            treatment: patient.treatment,
            stage: patient.funnelStage,
            total: patient.value,
            paid: patient.paid,
            pending: Math.max(patient.value - patient.paid, 0),
            date: patient.lastVisit,
            status: quoteStatus(patient.paid, patient.value, patient.status === "Inativo"),
          }];
      return rows.filter((row) => {
        const [visitYear, visitMonth] = row.date.split("-");
        if (year && visitYear !== year) return false;
        if (month !== "0" && String(Number(visitMonth)) !== month) return false;
        return true;
      });
    });
  }, [patients, month, year]);

  const sentValue = quotes.reduce((sum, quote) => sum + quote.total, 0);
  const received = quotes.reduce((sum, quote) => sum + quote.paid, 0);
  const pending = quotes.reduce((sum, quote) => sum + quote.pending, 0);
  const approved = quotes.filter((quote) => quote.status === "Aprovado").length;
  const approvalRate = quotes.length === 0 ? 0 : Math.round((approved / quotes.length) * 100);

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
          <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Orçamentos</h1>
          <p className="text-[13px] text-muted">Acompanhamento dos orçamentos apresentados aos pacientes.</p>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-lg border border-line bg-white px-4 py-3">
            <p className="text-[12px] text-teal">Total de orçamentos enviados</p>
            <p className="mt-1 text-[22px] font-semibold">{quotes.length}</p>
            <p className="text-[12px] text-muted">{money(sentValue)} apresentados</p>
          </article>
          <article className="rounded-lg border border-line bg-white px-4 py-3">
            <p className="text-[12px] text-teal">Orçamentos recebidos</p>
            <p className="mt-1 text-[22px] font-semibold">{money(received)}</p>
            <p className="text-[12px] text-muted">Valor já recebido</p>
          </article>
          <article className="rounded-lg border border-line bg-white px-4 py-3">
            <p className="text-[12px] text-teal">Valor pendente</p>
            <p className="mt-1 text-[22px] font-semibold">{money(pending)}</p>
            <p className="text-[12px] text-muted">Ainda não recebido</p>
          </article>
          <article className="rounded-lg border border-line bg-white px-4 py-3">
            <p className="text-[12px] text-teal">Taxa de aprovação</p>
            <p className="mt-1 text-[22px] font-semibold">{approvalRate}%</p>
            <p className="text-[12px] text-muted">{approved} {approved === 1 ? "aprovado" : "aprovados"} no período</p>
          </article>
        </section>

        <div className="mt-4 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2">
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
        </div>

        {quotes.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-white px-4 py-10 text-center text-[13px] text-muted">Nenhum orçamento neste período.</p>
        ) : (
          <>
            <section className="mt-4 hidden overflow-hidden rounded-lg border border-line bg-white lg:block">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface text-[11px] font-medium text-muted">
                    <th className="px-4 py-2 font-medium">Paciente</th>
                    <th className="px-3 py-2 font-medium">Tratamento / Etapa</th>
                    <th className="px-3 py-2 font-medium">Valor total</th>
                    <th className="px-3 py-2 font-medium">Pago</th>
                    <th className="px-3 py-2 font-medium">Pendente</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.protocol} className="border-t border-line">
                      <td className="px-4 py-3 font-semibold">{quote.name}</td>
                      <td className="px-3 py-3">{quote.treatment}<span className="block text-[11px] text-muted">{quote.stage}</span></td>
                      <td className="px-3 py-3 tabular-nums">{money(quote.total)}</td>
                      <td className="px-3 py-3 tabular-nums">{money(quote.paid)}</td>
                      <td className="px-3 py-3 tabular-nums">{money(quote.pending)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle[quote.status]}`}>{quote.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <ul className="mt-4 space-y-3 lg:hidden">
              {quotes.map((quote) => (
                <li key={quote.protocol} className="rounded-lg border border-line bg-white p-4">
                  <p className="font-semibold">{quote.name}</p>
                  <p className="text-[13px]">{quote.treatment}</p>
                  <p className="text-[12px] text-muted">{quote.stage}</p>
                  <dl className="mt-3 space-y-1 text-[13px]">
                    <div className="flex justify-between"><dt className="text-muted">Total</dt><dd className="font-medium">{money(quote.total)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Pago</dt><dd className="font-medium">{money(quote.paid)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Pendente</dt><dd className="font-medium">{money(quote.pending)}</dd></div>
                  </dl>
                  <p className="mt-3 text-[12px]">Status: <span className={`rounded-full px-2 py-0.5 font-semibold ${statusStyle[quote.status]}`}>{quote.status}</span></p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
