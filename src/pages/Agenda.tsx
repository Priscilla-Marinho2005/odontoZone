import { useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuPlus, LuX } from "react-icons/lu";
import { defaultSchedules, rangesOverlap, weekdayLabels, withinSchedule } from "../data/clinicAgenda";
import { clinicUsers, responsibles } from "../data/clinicPatients";
import type { ClinicTask, ClinicUser, Responsible } from "../data/clinicPatients";
import { usePatients } from "./Pacientes";

const agendaStatuses = [
  "Agendado",
  "Confirmado",
  "Chegou",
  "Em atendimento",
  "Concluído",
  "Atrasado",
  "Cancelado",
  "Falta",
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
  Chegou: "bg-st-confirmado/12 text-st-confirmado",
  "Em atendimento": "bg-st-atendimento/12 text-st-atendimento",
  Concluído: "bg-st-concluido/12 text-st-concluido",
  Atrasado: "bg-st-atrasado/12 text-st-atrasado",
  Cancelado: "bg-st-cancelado/12 text-st-cancelado",
  Falta: "bg-st-cancelado/12 text-st-cancelado",
  Retorno: "bg-st-retorno/12 text-st-retorno",
};

type View = "dia" | "semana" | "mes" | "sem";

type Visit = {
  date: string;
  time: string;
  procedure: string;
  professional: string;
  status?: AgendaStatus;
  durationMin?: number;
  encaixe?: boolean;
  reminded24h?: boolean;
  reminded2h?: boolean;
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
  durationMin: number;
  encaixe: boolean;
  reminded24h: boolean;
  reminded2h: boolean;
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

const fieldClass = "mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal";

export default function Agenda({ onOpenPatient }: { onOpenPatient: (protocol: string) => void }) {
  const { patients, setPatients, tasks, setTasks } = usePatients();
  const today = isoDate(new Date());
  const [cursor, setCursor] = useState(() => parseIso(today));
  const [view, setView] = useState<View>("mes");
  const [gap, setGap] = useState<Gap>("Não possui próximo atendimento");
  const [modal, setModal] = useState<"appointment" | "task" | "hours" | null>(null);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [apptPatient, setApptPatient] = useState("");
  const [apptDate, setApptDate] = useState(today);
  const [apptTime, setApptTime] = useState("09:00");
  const [apptProcedure, setApptProcedure] = useState("");
  const [apptUser, setApptUser] = useState<Responsible>("Dra. Amanda");
  const [apptStatus, setApptStatus] = useState<AgendaStatus>("Agendado");
  const [apptDuration, setApptDuration] = useState("40");
  const [apptEncaixe, setApptEncaixe] = useState(false);
  const [professionalFilter, setProfessionalFilter] = useState<"todos" | Responsible>("todos");
  const [schedules, setSchedules] = useState(defaultSchedules);
  const [hoursPro, setHoursPro] = useState<Responsible>("Dra. Amanda");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState(today);
  const [taskTime, setTaskTime] = useState("09:00");
  const [taskPatient, setTaskPatient] = useState("");
  const [taskUser, setTaskUser] = useState<ClinicUser>("Recepção");
  const [taskNotes, setTaskNotes] = useState("");
  const [error, setError] = useState("");

  function fillAppointment(item?: EventItem, date = isoDate(cursor), encaixe = false) {
    setError("");
    setEditing(item ?? null);
    setApptDate(item?.date ?? date);
    setApptTime(item?.time ?? "09:00");
    setApptProcedure(item?.treatment ?? "");
    setApptPatient(item?.protocol ?? patients[0]?.protocol ?? "");
    setApptUser((item?.responsible as Responsible) || "Dra. Amanda");
    setApptStatus(item?.status ?? "Agendado");
    setApptDuration(String(item?.durationMin ?? 40));
    setApptEncaixe(item?.encaixe ?? encaixe);
    setModal("appointment");
  }

  function openTask(date = isoDate(cursor)) {
    setError("");
    setTaskTitle("");
    setTaskDate(date);
    setTaskTime("09:00");
    setTaskPatient("");
    setTaskNotes("");
    setModal("task");
  }

  function matches(visit: Visit, item: EventItem) {
    return visit.date === item.date && visit.time === item.time && visit.procedure === item.treatment;
  }

  function saveAppointment() {
    if (!apptPatient || !apptDate || !apptTime || !apptProcedure.trim()) {
      setError("Informe paciente, data, horário e procedimento.");
      return;
    }
    const durationMin = Number(apptDuration) || 40;
    const visit: Visit = {
      date: apptDate,
      time: apptTime,
      procedure: apptProcedure.trim(),
      professional: apptUser,
      status: apptStatus,
      durationMin,
      encaixe: apptEncaixe,
      reminded24h: editing?.reminded24h,
      reminded2h: editing?.reminded2h,
    };
    if (apptStatus === "Cancelado") {
      persistVisit(visit);
      return;
    }
    if (!apptEncaixe && !withinSchedule(schedules[apptUser], apptDate, apptTime, durationMin)) {
      setError("Horário fora da disponibilidade deste profissional.");
      return;
    }
    const busy = events.some((item) => {
      if (item.responsible !== apptUser) return false;
      if (item.status === "Cancelado" || item.status === "Falta") return false;
      if (editing && item.protocol === editing.protocol && item.date === editing.date && item.time === editing.time && item.treatment === editing.treatment) return false;
      if (item.date !== apptDate) return false;
      return rangesOverlap(item.time, item.durationMin, apptTime, durationMin);
    });
    if (busy && !apptEncaixe) {
      setError("Conflito: este profissional já tem consulta neste intervalo.");
      return;
    }
    persistVisit(visit);
  }

  function persistVisit(visit: Visit) {
    setPatients((current) => current.map((patient) => {
      let next = patient;
      if (editing && patient.protocol === editing.protocol) {
        const drop = (list: Visit[]) => list.filter((item) => !matches(item, editing));
        next = { ...patient, upcoming: drop(patient.upcoming), consultations: drop(patient.consultations) };
      }
      if (next.protocol !== apptPatient) return next;
      const updated = { ...next, upcoming: [visit, ...next.upcoming] };
      if (visit.status === "Retorno") {
        updated.followUps = [{ date: visit.date, type: "Retorno", procedure: visit.procedure, status: "Agendado" }, ...updated.followUps];
      }
      if (visit.status === "Cancelado" || visit.status === "Falta") {
        const exists = updated.absences.some((entry) => entry.date === visit.date && entry.procedure === visit.procedure);
        if (!exists) {
          updated.absences = [{
            date: visit.date,
            type: visit.status === "Falta" ? "Falta" : "Cancelamento",
            procedure: visit.procedure,
            reason: visit.encaixe ? "Encaixe registrado na agenda" : "Registrado pela agenda",
          }, ...updated.absences];
        }
      }
      return updated;
    }));
    setModal(null);
    setEditing(null);
    setCursor(parseIso(visit.date));
  }

  function saveTask() {
    if (!taskTitle.trim() || !taskDate) {
      setError("Informe o título e a data da tarefa.");
      return;
    }
    const task: ClinicTask = {
      id: `task-${crypto.randomUUID()}`,
      title: taskTitle.trim(),
      date: taskDate,
      time: taskTime,
      patientProtocol: taskPatient,
      assignee: taskUser,
      notes: taskNotes.trim(),
      done: false,
    };
    setTasks((current) => [task, ...current]);
    setModal(null);
    setCursor(parseIso(taskDate));
  }

  function toggleTask(id: string) {
    setTasks((current) => current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

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
          durationMin: visit.durationMin ?? 40,
          encaixe: Boolean(visit.encaixe),
          reminded24h: Boolean(visit.reminded24h),
          reminded2h: Boolean(visit.reminded2h),
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
      const next = { ...patient, upcoming: patch(patient.upcoming), consultations: patch(patient.consultations) };
      if (status === "Cancelado" || status === "Falta") {
        const exists = next.absences.some((entry) => entry.date === item.date && entry.procedure === item.treatment);
        if (!exists) {
          next.absences = [{
            date: item.date,
            type: status === "Falta" ? "Falta" : "Cancelamento",
            procedure: item.treatment,
            reason: "Registrado pela agenda",
          }, ...next.absences];
        }
      }
      if (status === "Retorno") {
        const exists = next.followUps.some((entry) => entry.date === item.date && entry.procedure === item.treatment);
        if (!exists) {
          next.followUps = [{
            date: item.date,
            type: "Retorno",
            procedure: item.treatment,
            status: "Agendado",
          }, ...next.followUps];
        }
      }
      return next;
    }));
  }

  function markReminder(item: EventItem, kind: "24h" | "2h") {
    setPatients((current) => current.map((patient) => {
      if (patient.protocol !== item.protocol) return patient;
      const patch = (visits: Visit[]) => visits.map((visit) => (
        visit.date === item.date && visit.time === item.time && visit.procedure === item.treatment
          ? { ...visit, reminded24h: kind === "24h" ? true : visit.reminded24h, reminded2h: kind === "2h" ? true : visit.reminded2h }
          : visit
      ));
      return { ...patient, upcoming: patch(patient.upcoming), consultations: patch(patient.consultations) };
    }));
    setTasks((current) => [{
      id: `task-rem-${crypto.randomUUID()}`,
      title: `Lembrete ${kind} — ${item.patient}`,
      date: item.date,
      time: item.time,
      patientProtocol: item.protocol,
      assignee: "Recepção",
      notes: `Consulta ${item.treatment}. Aviso ${kind} antes registrado na agenda (sem envio de chat).`,
      done: true,
    }, ...current]);
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
  const visibleEvents = professionalFilter === "todos"
    ? events
    : events.filter((item) => item.responsible === professionalFilter);

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Agenda</h1>
            <p className="text-[13px] text-muted">Consultas, profissionais, disponibilidade e status de comparecimento.</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="inline-flex overflow-hidden rounded-lg border border-line bg-white">
              {views.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    view === item.id ? "bg-teal text-white" : "text-muted hover:bg-surface hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button type="button" onClick={() => fillAppointment()} className="inline-flex items-center gap-1.5 rounded-md bg-teal px-3 py-2 text-[13px] font-medium text-white hover:bg-navy">
                <LuPlus size={15} /> Nova consulta
              </button>
              <button type="button" onClick={() => fillAppointment(undefined, isoDate(cursor), true)} className="rounded-md border border-line bg-white px-3 py-2 text-[13px] font-medium hover:bg-surface">
                Encaixe
              </button>
              <button type="button" onClick={() => { setHoursPro(professionalFilter === "todos" ? "Dra. Amanda" : professionalFilter); setModal("hours"); }} className="rounded-md border border-line bg-white px-3 py-2 text-[13px] font-medium hover:bg-surface">
                Horários
              </button>
              <button type="button" onClick={() => openTask()} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-[13px] font-medium hover:bg-surface">
                <LuPlus size={15} /> Tarefa
              </button>
            </div>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[12px] text-muted">
            Profissional
            <select
              value={professionalFilter}
              onChange={(event) => setProfessionalFilter(event.target.value as "todos" | Responsible)}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-[12px] text-ink outline-none focus:border-teal"
            >
              <option value="todos">Todos (agenda geral)</option>
              {responsibles.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
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
          <>
            <DayList
              items={visibleEvents.filter((item) => item.date === dayIso)}
              onOpen={onOpenPatient}
              onEdit={fillAppointment}
              onStatus={updateStatus}
              onRemind={markReminder}
            />
            <TaskList
              tasks={tasks.filter((item) => item.date === dayIso)}
              patients={patients}
              onToggle={toggleTask}
              onOpenPatient={onOpenPatient}
            />
          </>
        )}

        {view === "semana" && (
          <div className="mt-4 grid gap-3 md:grid-cols-7">
            {weekDays.map((day) => {
              const iso = isoDate(day);
              const items = visibleEvents.filter((item) => item.date === iso);
              const dayTasks = tasks.filter((item) => item.date === iso);
              return (
                <section key={iso} className={`rounded-lg border bg-white p-2 ${iso === today ? "border-teal" : "border-line"}`}>
                  <button type="button" onClick={() => { setCursor(day); setView("dia"); }} className="w-full text-left">
                    <p className="text-[11px] uppercase text-muted">{day.toLocaleDateString("pt-BR", { weekday: "short" })}</p>
                    <p className="text-[16px] font-semibold">{day.getDate()}</p>
                  </button>
                  <div className="mt-2 space-y-2">
                    {items.length === 0 && dayTasks.length === 0 && <p className="text-[11px] text-muted">Sem horários</p>}
                    {items.map((item) => (
                      <button
                        key={`${item.protocol}-${item.time}-${item.treatment}`}
                        type="button"
                        onClick={() => fillAppointment(item)}
                        className={`block w-full rounded-md px-2 py-1.5 text-left text-[11px] ${statusStyle[item.status]}`}
                      >
                        <span className="font-semibold">{item.time}</span> {item.patient}
                      </button>
                    ))}
                    {dayTasks.map((item) => (
                      <p key={item.id} className="rounded-md bg-navy/8 px-2 py-1.5 text-[11px] font-medium text-navy">
                        {item.time} Tarefa
                      </p>
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
                const items = visibleEvents.filter((item) => item.date === iso);
                const dayTasks = tasks.filter((item) => item.date === iso);
                const chips = [
                  ...items.map((item) => ({
                    key: `${item.protocol}-${item.time}`,
                    label: `${item.time} ${item.patient.split(" ")[0]}`,
                    className: statusStyle[item.status],
                  })),
                  ...dayTasks.map((item) => ({
                    key: item.id,
                    label: `${item.time} ${item.title}`,
                    className: "bg-navy/10 text-navy",
                  })),
                ];
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
                      {chips.slice(0, 3).map((item) => (
                        <span key={item.key} className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium ${item.className}`}>
                          {item.label}
                        </span>
                      ))}
                      {chips.length > 3 && <span className="block text-[10px] text-muted">+{chips.length - 3}</span>}
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

      {modal === "hours" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 sm:max-w-lg sm:rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[20px] font-semibold">Horários de atendimento</h2>
              <button type="button" aria-label="Fechar" onClick={() => setModal(null)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface">
                <LuX size={16} />
              </button>
            </div>
            <label className="mt-4 block text-[11px] font-medium text-muted">
              Profissional
              <select value={hoursPro} onChange={(event) => setHoursPro(event.target.value as Responsible)} className={fieldClass}>
                {responsibles.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <ul className="mt-4 space-y-2">
              {weekdayLabels.map((label, day) => {
                const hours = schedules[hoursPro][day];
                return (
                  <li key={label} className="grid grid-cols-[48px_1fr_1fr_auto] items-center gap-2">
                    <span className="text-[12px] font-medium">{label}</span>
                    <input type="time" value={hours.start} onChange={(event) => setSchedules((current) => ({
                      ...current,
                      [hoursPro]: { ...current[hoursPro], [day]: { ...hours, start: event.target.value } },
                    }))} className="rounded-md border border-line px-2 py-1.5 text-[12px]" />
                    <input type="time" value={hours.end} onChange={(event) => setSchedules((current) => ({
                      ...current,
                      [hoursPro]: { ...current[hoursPro], [day]: { ...hours, end: event.target.value } },
                    }))} className="rounded-md border border-line px-2 py-1.5 text-[12px]" />
                    <label className="text-[12px]">
                      <input
                        type="checkbox"
                        checked={hours.enabled}
                        onChange={(event) => setSchedules((current) => ({
                          ...current,
                          [hoursPro]: { ...current[hoursPro], [day]: { ...hours, enabled: event.target.checked } },
                        }))}
                      /> Atende
                    </label>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={() => setModal(null)} className="mt-5 rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">Fechar</button>
          </div>
        </div>
      )}

      {(modal === "appointment" || modal === "task") && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            onSubmit={(event) => {
              event.preventDefault();
              if (modal === "appointment") saveAppointment();
              else saveTask();
            }}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 sm:max-w-lg sm:rounded-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[20px] font-semibold">
                {modal === "appointment"
                  ? editing
                    ? "Editar / reagendar"
                    : apptEncaixe
                      ? "Encaixe"
                      : "Nova consulta"
                  : "Nova tarefa"}
              </h2>
              <button type="button" aria-label="Fechar" onClick={() => { setModal(null); setEditing(null); }} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface">
                <LuX size={16} />
              </button>
            </div>
            {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}

            {modal === "appointment" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-medium text-muted sm:col-span-2">
                  Paciente
                  <select value={apptPatient} onChange={(event) => setApptPatient(event.target.value)} className={fieldClass}>
                    {patients.map((patient) => (
                      <option key={patient.protocol} value={patient.protocol}>{patient.name} · {patient.protocol}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-muted">
                  Data
                  <input type="date" value={apptDate} onChange={(event) => setApptDate(event.target.value)} className={fieldClass} />
                </label>
                <label className="block text-[11px] font-medium text-muted">
                  Horário
                  <input type="time" value={apptTime} onChange={(event) => setApptTime(event.target.value)} className={fieldClass} />
                </label>
                <label className="block text-[11px] font-medium text-muted">
                  Duração (min)
                  <input type="number" min={10} step={5} value={apptDuration} onChange={(event) => setApptDuration(event.target.value)} className={fieldClass} />
                </label>
                <label className="mt-6 flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={apptEncaixe} onChange={(event) => setApptEncaixe(event.target.checked)} />
                  Encaixe (ignora conflito e horário)
                </label>
                <label className="block text-[11px] font-medium text-muted sm:col-span-2">
                  Procedimento
                  <input value={apptProcedure} onChange={(event) => setApptProcedure(event.target.value)} placeholder="Ex.: Avaliação, retorno, limpeza" className={fieldClass} />
                </label>
                <label className="block text-[11px] font-medium text-muted">
                  Profissional
                  <select value={apptUser} onChange={(event) => setApptUser(event.target.value as Responsible)} className={fieldClass}>
                    {responsibles.map((user) => <option key={user} value={user}>{user}</option>)}
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-muted">
                  Status
                  <select value={apptStatus} onChange={(event) => { if (isStatus(event.target.value)) setApptStatus(event.target.value); }} className={fieldClass}>
                    {agendaStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-medium text-muted sm:col-span-2">
                  Título
                  <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="O que precisa ser feito" className={fieldClass} />
                </label>
                <label className="block text-[11px] font-medium text-muted">
                  Data
                  <input type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} className={fieldClass} />
                </label>
                <label className="block text-[11px] font-medium text-muted">
                  Horário
                  <input type="time" value={taskTime} onChange={(event) => setTaskTime(event.target.value)} className={fieldClass} />
                </label>
                <label className="block text-[11px] font-medium text-muted">
                  Paciente vinculado
                  <select value={taskPatient} onChange={(event) => setTaskPatient(event.target.value)} className={fieldClass}>
                    <option value="">Nenhum</option>
                    {patients.map((patient) => (
                      <option key={patient.protocol} value={patient.protocol}>{patient.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-muted">
                  Usuário responsável
                  <select value={taskUser} onChange={(event) => setTaskUser(event.target.value as ClinicUser)} className={fieldClass}>
                    {clinicUsers.map((user) => <option key={user} value={user}>{user}</option>)}
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-muted sm:col-span-2">
                  Observações
                  <textarea value={taskNotes} onChange={(event) => setTaskNotes(event.target.value)} rows={3} className={fieldClass} />
                </label>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setModal(null); setEditing(null); }} className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium">Fechar</button>
              {modal === "appointment" && editing && (
                <button
                  type="button"
                  onClick={() => persistVisit({
                    date: apptDate,
                    time: apptTime,
                    procedure: apptProcedure.trim() || editing.treatment,
                    professional: apptUser,
                    status: "Cancelado",
                    durationMin: Number(apptDuration) || 40,
                    encaixe: apptEncaixe,
                    reminded24h: editing.reminded24h,
                    reminded2h: editing.reminded2h,
                  })}
                  className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium text-danger"
                >
                  Cancelar consulta
                </button>
              )}
              <button type="submit" className="rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function DayList({
  items,
  onOpen,
  onEdit,
  onStatus,
  onRemind,
}: {
  items: EventItem[];
  onOpen: (protocol: string) => void;
  onEdit: (item: EventItem) => void;
  onStatus: (item: EventItem, status: AgendaStatus) => void;
  onRemind: (item: EventItem, kind: "24h" | "2h") => void;
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
              <th className="px-3 py-2 font-medium">Procedimento</th>
              <th className="px-3 py-2 font-medium">Duração</th>
              <th className="px-3 py-2 font-medium">Profissional</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Avisos</th>
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
                <td className="px-3 py-3">
                  <button type="button" onClick={() => onEdit(item)} className="text-left hover:text-teal">
                    {item.treatment}{item.encaixe ? " · encaixe" : ""}
                  </button>
                </td>
                <td className="px-3 py-3 tabular-nums">{item.durationMin} min</td>
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
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => onRemind(item, "24h")}
                      className={`rounded-full px-2 py-1 text-[11px] font-medium ${item.reminded24h ? "bg-teal text-white" : "border border-line text-muted"}`}
                    >
                      24h
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemind(item, "2h")}
                      className={`rounded-full px-2 py-1 text-[11px] font-medium ${item.reminded2h ? "bg-teal text-white" : "border border-line text-muted"}`}
                    >
                      2h
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TaskList({
  tasks,
  patients,
  onToggle,
  onOpenPatient,
}: {
  tasks: ClinicTask[];
  patients: ReturnType<typeof usePatients>["patients"];
  onToggle: (id: string) => void;
  onOpenPatient: (protocol: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <section className="mt-4 rounded-lg border border-line bg-white px-5 py-4">
      <h2 className="text-[15px] font-semibold">Tarefas do dia</h2>
      <ul className="mt-3 space-y-2">
        {tasks.map((task) => {
          const linked = patients.find((patient) => patient.protocol === task.patientProtocol);
          return (
            <li key={task.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line px-3 py-3">
              <label className="flex min-w-0 items-start gap-2">
                <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} className="mt-1" />
                <span>
                  <p className={`text-[13px] font-semibold ${task.done ? "text-muted line-through" : ""}`}>{task.title}</p>
                  <p className="mt-1 text-[12px] text-muted">
                    {task.time} · {task.assignee}
                    {linked ? ` · ${linked.name}` : ""}
                  </p>
                  {task.notes && <p className="mt-1 text-[12px]">{task.notes}</p>}
                </span>
              </label>
              {linked && (
                <button type="button" onClick={() => onOpenPatient(linked.protocol)} className="text-[12px] font-medium text-teal hover:underline">
                  Abrir paciente
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
