import { useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { usePatients } from "./Pacientes";

const agendaStatuses = [
  "Agendado",
  "Confirmado",
  "Em atendimento",
  "Concluído",
  "Atrasado",
  "Cancelado",
  "Retorno",
] as const;

type AgendaStatus = (typeof agendaStatuses)[number];

const gapFilters = [
  "Precisa marcar consulta",
  "Precisa retornar",
  "Aguardando contato",
  "Não possui próximo atendimento",
] as const;

type Gap = (typeof gapFilters)[number];

const statusStyle: Record<AgendaStatus, string> = {
  Agendado: "bg-st-agendado/12 text-st-agendado",
  Confirmado: "bg-st-confirmado/12 text-st-confirmado",
  "Em atendimento": "bg-st-atendimento/12 text-st-atendimento",
  Concluído: "bg-st-concluido/12 text-st-concluido",
  Atrasado: "bg-st-atrasado/12 text-st-atrasado",
  Cancelado: "bg-st-cancelado/12 text-st-cancelado",
  Retorno: "bg-st-retorno/12 text-st-retorno",
};

type View = "dia" | "semana" | "mes" | "sem";

type Visit = {
  date: string;
  time: string;
  procedure: string;
  professional: string;
  status?: AgendaStatus;
};

type EventItem = {
  protocol: string;
  patient: string;
  date: string;
  time: string;
  treatment: string;
  responsible: string;
  status: AgendaStatus;
  funnelStage: string;
};

const views: { id: View; label: string }[] = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "sem", label: "Sem agendamento" },
];

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function formatLong(date: Date) {
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function isStatus(value: string): value is AgendaStatus {
  return (agendaStatuses as readonly string[]).includes(value);
}

function resolveStatus(visit: Visit, today: string): AgendaStatus {
  if (visit.status && isStatus(visit.status)) return visit.status;
  if (visit.date < today) return "Concluído";
  return "Agendado";
}

function gapsFor(patient: { funnelStage: string; status: string; nextAction: string }, futureCount: number): Gap[] {
  if (futureCount > 0) return [];
  const tags: Gap[] = ["Não possui próximo atendimento"];
  if (patient.funnelStage === "Retorno" || patient.status === "Aguardando retorno") tags.push("Precisa retornar");
  if (
    patient.funnelStage === "Avaliação"
    || patient.funnelStage === "Orçamento"
    || patient.funnelStage === "Aguardando aprovação"
    || patient.nextAction.toLowerCase().includes("definir")
    || patient.nextAction.toLowerCase().includes("contato")
  ) {
    tags.push("Aguardando contato");
  }
  if (patient.funnelStage === "Em tratamento" || patient.funnelStage === "Tratamento iniciado" || patient.funnelStage === "Concluído") {
    tags.push("Precisa marcar consulta");
  }
  return tags;
}

export default function Agenda({ onOpenPatient }: { onOpenPatient: (protocol: string) => void }) {
  const { patients, setPatients } = usePatients();
  const today = isoDate(new Date());
  const [cursor, setCursor] = useState(() => parseIso(today));
  const [view, setView] = useState<View>("mes");
  const [gap, setGap] = useState<Gap>("Não possui próximo atendimento");

  const events = useMemo(() => {
    const items: EventItem[] = [];
    patients.forEach((patient) => {
      const visits = [...patient.upcoming, ...patient.consultations];
      visits.forEach((visit) => {
        items.push({
          protocol: patient.protocol,
          patient: patient.name,
          date: visit.date,
          time: visit.time,
          treatment: visit.procedure,
          responsible: visit.professional,
          status: resolveStatus(visit, today),
          funnelStage: patient.funnelStage,
        });
      });
    });
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [patients, today]);

  const unscheduled = useMemo(() => patients.flatMap((patient) => {
    const future = [...patient.upcoming, ...patient.consultations].filter((visit) => visit.date >= today && visit.status !== "Cancelado").length;
    const tags = gapsFor(patient, future);
    if (tags.length === 0) return [];
    return [{ patient, tags }];
  }), [patients, today]);

  function shift(direction: number) {
    if (view === "mes") {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1);
      setCursor(next);
      return;
    }
    setCursor(addDays(cursor, direction * (view === "semana" ? 7 : 1)));
  }

  function updateStatus(item: EventItem, status: AgendaStatus) {
    setPatients((current) => current.map((patient) => {
      if (patient.protocol !== item.protocol) return patient;
      const patch = (visits: Visit[]) => visits.map((visit) => (
        visit.date === item.date && visit.time === item.time && visit.procedure === item.treatment
          ? { ...visit, status }
          : visit
      ));
      return { ...patient, upcoming: patch(patient.upcoming), consultations: patch(patient.consultations) };
    }));
  }

  const dayIso = isoDate(cursor);
  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const monthCells = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const periodLabel = view === "mes"
    ? formatMonth(cursor)
    : view === "semana"
      ? `${weekDays[0].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`
      : formatLong(cursor);

  const visibleGaps = unscheduled.filter((item) => item.tags.includes(gap));

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Agenda</h1>
            <p className="text-[13px] text-muted">Compromissos da clínica, ligados ao funil e aos pacientes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {views.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`rounded-md px-3 py-2 text-[13px] font-medium ${
                  view === item.id ? "bg-teal text-white" : "border border-line bg-white hover:bg-surface"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div className="mt-4 flex flex-wrap gap-2">
          {agendaStatuses.map((status) => (
            <span key={status} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle[status]}`}>{status}</span>
          ))}
        </div>

        {view !== "sem" && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Período anterior" onClick={() => shift(-1)} className="grid size-8 place-items-center rounded-md border border-line bg-white">
                <LuChevronLeft size={16} />
              </button>
              <button type="button" aria-label="Próximo período" onClick={() => shift(1)} className="grid size-8 place-items-center rounded-md border border-line bg-white">
                <LuChevronRight size={16} />
              </button>
              <button type="button" onClick={() => setCursor(parseIso(today))} className="rounded-md border border-line bg-white px-3 py-1.5 text-[12px] font-medium">
                Hoje
              </button>
            </div>
            <p className="text-[14px] font-semibold capitalize">{periodLabel}</p>
          </div>
        )}

        {view === "dia" && (
          <DayList
            items={events.filter((item) => item.date === dayIso)}
            onOpen={onOpenPatient}
            onStatus={updateStatus}
          />
        )}

        {view === "semana" && (
          <div className="mt-4 grid gap-3 md:grid-cols-7">
            {weekDays.map((day) => {
              const iso = isoDate(day);
              const items = events.filter((item) => item.date === iso);
              return (
                <section key={iso} className={`rounded-lg border bg-white p-2 ${iso === today ? "border-teal" : "border-line"}`}>
                  <button type="button" onClick={() => { setCursor(day); setView("dia"); }} className="w-full text-left">
                    <p className="text-[11px] uppercase text-muted">{day.toLocaleDateString("pt-BR", { weekday: "short" })}</p>
                    <p className="text-[16px] font-semibold">{day.getDate()}</p>
                  </button>
                  <div className="mt-2 space-y-2">
                    {items.length === 0 && <p className="text-[11px] text-muted">Sem horários</p>}
                    {items.map((item) => (
                      <button
                        key={`${item.protocol}-${item.time}-${item.treatment}`}
                        type="button"
                        onClick={() => onOpenPatient(item.protocol)}
                        className={`block w-full rounded-md px-2 py-1.5 text-left text-[11px] ${statusStyle[item.status]}`}
                      >
                        <span className="font-semibold">{item.time}</span> {item.patient}
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {view === "mes" && (
          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
            <div className="grid grid-cols-7 border-b border-line bg-surface text-[11px] font-medium text-muted">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
                <div key={label} className="px-2 py-2">{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthCells.map((day) => {
                const iso = isoDate(day);
                const items = events.filter((item) => item.date === iso);
                const inMonth = day.getMonth() === cursor.getMonth();
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => { setCursor(day); setView("dia"); }}
                    className={`min-h-24 border-t border-r border-line p-1.5 text-left ${inMonth ? "bg-white" : "bg-surface/70"} ${iso === today ? "outline outline-teal" : ""}`}
                  >
                    <span className={`text-[12px] font-semibold ${inMonth ? "" : "text-muted"}`}>{day.getDate()}</span>
                    <div className="mt-1 space-y-1">
                      {items.slice(0, 3).map((item) => (
                        <span key={`${item.protocol}-${item.time}`} className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium ${statusStyle[item.status]}`}>
                          {item.time} {item.patient.split(" ")[0]}
                        </span>
                      ))}
                      {items.length > 3 && <span className="block text-[10px] text-muted">+{items.length - 3}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === "sem" && (
          <section className="mt-4">
            <p className="text-[13px] text-muted">
              Pacientes do funil e do cadastro que não têm um próximo horário. João Pedro Silva, por exemplo, segue em tratamento e aparece porque não há consulta marcada.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {gapFilters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGap(item)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                    gap === item ? "bg-navy text-white" : "border border-line bg-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <ul className="mt-4 space-y-3">
              {visibleGaps.length === 0 && (
                <li className="rounded-lg border border-line bg-white px-4 py-8 text-center text-[13px] text-muted">
                  Nenhum paciente neste grupo.
                </li>
              )}
              {visibleGaps.map(({ patient, tags }) => (
                <li key={patient.protocol} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <button type="button" onClick={() => onOpenPatient(patient.protocol)} className="text-left text-[15px] font-semibold hover:text-teal">
                        {patient.name}
                      </button>
                      <p className="text-[12px] text-muted">{patient.protocol} · Funil: {patient.funnelStage}</p>
                      <p className="mt-1 text-[13px]">Próxima ação: {patient.nextAction || "—"}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-surface px-2 py-1 text-[11px] font-medium text-ink">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <button type="button" onClick={() => onOpenPatient(patient.protocol)} className="rounded-md bg-teal px-3 py-2 text-[12px] font-medium text-white hover:bg-navy">
                      Abrir paciente
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function DayList({
  items,
  onOpen,
  onStatus,
}: {
  items: EventItem[];
  onOpen: (protocol: string) => void;
  onStatus: (item: EventItem, status: AgendaStatus) => void;
}) {
  if (items.length === 0) {
    return (
      <section className="mt-4 rounded-lg border border-line bg-white px-5 py-12 text-center text-[13px] text-muted">
        Nenhum compromisso neste dia.
      </section>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface text-[11px] font-medium text-muted">
              <th className="px-4 py-2 font-medium">Horário</th>
              <th className="px-3 py-2 font-medium">Paciente</th>
              <th className="px-3 py-2 font-medium">Tratamento</th>
              <th className="px-3 py-2 font-medium">Responsável</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.protocol}-${item.time}-${item.treatment}`} className="border-t border-line">
                <td className="px-4 py-3 font-semibold tabular-nums">{item.time}</td>
                <td className="px-3 py-3">
                  <button type="button" onClick={() => onOpen(item.protocol)} className="font-semibold hover:text-teal">{item.patient}</button>
                  <p className="text-[11px] text-muted">Funil: {item.funnelStage}</p>
                </td>
                <td className="px-3 py-3">{item.treatment}</td>
                <td className="px-3 py-3">{item.responsible}</td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Status de ${item.patient} às ${item.time}`}
                    value={item.status}
                    onChange={(event) => {
                      if (isStatus(event.target.value)) onStatus(item, event.target.value);
                    }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold outline-none ${statusStyle[item.status]}`}
                  >
                    {agendaStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
