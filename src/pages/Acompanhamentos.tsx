import { useMemo, useState } from "react";
import { LuPlus, LuSend, LuX } from "react-icons/lu";
import type { ClinicUser, FollowUp, MaintenanceKind, MaintenancePlan } from "../data/clinicPatients";
import { maintenanceKinds, periodicityOptions } from "../data/clinicPatients";
import { usePatients } from "./Pacientes";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return iso.split("-").reverse().join("/");
}

function periodicityLabel(days: number) {
  return periodicityOptions.find((item) => item.days === days)?.label ?? `A cada ${days} dias`;
}

function followUpDue(item: FollowUp) {
  return item.status !== "Realizado" && item.date && item.date <= todayIso();
}

function followUpPending(item: FollowUp) {
  return item.status === "Pendente" || item.status === "Atrasado" || followUpDue(item);
}

function reminderWindow(date: string, days: number) {
  const start = addDays(date, -days);
  const now = todayIso();
  return now >= start && now <= date;
}

export default function Acompanhamentos({ onOpenPatient }: { onOpenPatient: (protocol: string) => void }) {
  const { patients, setPatients, setTasks } = usePatients();
  const [tab, setTab] = useState<"retornos" | "manutencoes">("retornos");
  const [returnFilter, setReturnFilter] = useState<"pendentes" | "agendados" | "todos">("pendentes");
  const [kindFilter, setKindFilter] = useState<MaintenanceKind | "todos">("todos");
  const [composeReturn, setComposeReturn] = useState(false);
  const [composeMaint, setComposeMaint] = useState(false);

  const [protocol, setProtocol] = useState(patients[0]?.protocol ?? "");
  const [returnDate, setReturnDate] = useState(addDays(todayIso(), 30));
  const [returnProcedure, setReturnProcedure] = useState("Retorno clínico");
  const [needOnly, setNeedOnly] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);

  const [maintKind, setMaintKind] = useState<MaintenanceKind>("Limpeza");
  const [maintProcedure, setMaintProcedure] = useState("Limpeza periódica");
  const [periodDays, setPeriodDays] = useState(180);
  const [nextDate, setNextDate] = useState(addDays(todayIso(), 180));
  const [maintReminder, setMaintReminder] = useState(7);

  const returns = useMemo(() => {
    return patients.flatMap((patient) => patient.followUps
      .filter((item) => item.type === "Retorno")
      .map((item) => ({ patient, item })));
  }, [patients]);

  const filteredReturns = returns.filter(({ item }) => {
    if (returnFilter === "pendentes") return followUpPending(item);
    if (returnFilter === "agendados") return item.status === "Agendado" && !followUpDue(item);
    return true;
  });

  const maintenances = useMemo(() => {
    return patients.flatMap((patient) => (patient.maintenances ?? [])
      .map((item) => ({ patient, item })));
  }, [patients]);

  const filteredMaints = maintenances.filter(({ item }) => (
    kindFilter === "todos" || item.kind === kindFilter
  ));

  const stats = useMemo(() => {
    const pendingReturns = returns.filter(({ item }) => followUpPending(item)).length;
    const dueMaints = maintenances.filter(({ item }) => item.status === "Ativa" && item.nextDate <= todayIso()).length;
    const reminders = [
      ...returns.filter(({ item }) => item.reminder && item.status !== "Realizado"),
      ...maintenances.filter(({ item }) => item.status === "Ativa" && reminderWindow(item.nextDate, item.reminderDays)),
    ].length;
    const notified = [
      ...returns.filter(({ item }) => item.notified),
      ...maintenances.filter(({ item }) => item.reminderSent),
    ].length;
    return { pendingReturns, dueMaints, reminders, notified };
  }, [returns, maintenances]);

  function findPatient(id: string) {
    return patients.find((item) => item.protocol === id);
  }

  function registerReturn() {
    const patient = findPatient(protocol);
    if (!patient) return;
    const date = needOnly ? "" : returnDate;
    const status: FollowUp["status"] = needOnly ? "Pendente" : "Agendado";
    const followUp: FollowUp = {
      date: date || todayIso(),
      type: "Retorno",
      procedure: returnProcedure.trim() || "Retorno",
      status: needOnly && !date ? "Pendente" : status,
      reminder: true,
    };
    setPatients((current) => current.map((item) => {
      if (item.protocol !== protocol) return item;
      const upcoming = needOnly ? item.upcoming : [{
        date: returnDate,
        time: "09:00",
        procedure: followUp.procedure,
        professional: item.responsible,
        status: "Retorno" as const,
        notes: "Retorno registrado no módulo de acompanhamentos",
      }, ...item.upcoming];
      return {
        ...item,
        status: "Aguardando retorno",
        funnelStage: "Retorno",
        nextAction: needOnly ? `Necessita retorno: ${followUp.procedure}` : `Retorno em ${formatDate(returnDate)}`,
        upcoming,
        followUps: [followUp, ...item.followUps],
      };
    }));
    setTasks((current) => [{
      id: `task-ret-${crypto.randomUUID()}`,
      title: `Lembrete de retorno — ${patient.name}`,
      date: needOnly ? todayIso() : addDays(returnDate, -reminderDays),
      time: "09:00",
      patientProtocol: protocol,
      assignee: patient.responsible as ClinicUser,
      notes: followUp.procedure,
      done: false,
    }, ...current]);
    setComposeReturn(false);
  }

  function createMaintenance() {
    const patient = findPatient(protocol);
    if (!patient) return;
    const plan: MaintenancePlan = {
      id: `man-${crypto.randomUUID()}`,
      kind: maintKind,
      procedure: maintProcedure.trim() || maintKind,
      periodicityDays: periodDays,
      nextDate,
      lastDone: todayIso(),
      reminderDays: maintReminder,
      reminderSent: false,
      status: "Ativa",
    };
    setPatients((current) => current.map((item) => (
      item.protocol === protocol
        ? { ...item, maintenances: [plan, ...(item.maintenances ?? [])], nextAction: `${plan.procedure} em ${formatDate(plan.nextDate)}` }
        : item
    )));
    setTasks((current) => [{
      id: `task-man-${crypto.randomUUID()}`,
      title: `Lembrete: ${plan.procedure} — ${patient.name}`,
      date: addDays(nextDate, -maintReminder),
      time: "09:00",
      patientProtocol: protocol,
      assignee: patient.responsible as ClinicUser,
      notes: `Periodicidade: ${periodicityLabel(periodDays)}`,
      done: false,
    }, ...current]);
    setComposeMaint(false);
  }

  function notifyReturns() {
    const targets = filteredReturns.filter(({ item }) => item.status !== "Realizado");
    setPatients((current) => current.map((patient) => {
      const hit = targets.filter((row) => row.patient.protocol === patient.protocol);
      if (hit.length === 0) return patient;
      const messages = hit.map(({ item }) => ({
        date: todayIso(),
        channel: "WhatsApp" as const,
        summary: `Lembrete de retorno: ${item.procedure} em ${formatDate(item.date)}.`,
      }));
      return {
        ...patient,
        interactions: [...messages, ...patient.interactions],
        followUps: patient.followUps.map((item) => (
          item.type === "Retorno" && hit.some((row) => row.item.date === item.date && row.item.procedure === item.procedure)
            ? { ...item, notified: true, reminder: true }
            : item
        )),
      };
    }));
  }

  function notifyMaintenances() {
    const targets = filteredMaints.filter(({ item }) => item.status === "Ativa");
    setPatients((current) => current.map((patient) => {
      const hit = targets.filter((row) => row.patient.protocol === patient.protocol);
      if (hit.length === 0) return patient;
      const messages = hit.map(({ item }) => ({
        date: todayIso(),
        channel: "WhatsApp" as const,
        summary: `Lembrete de ${item.kind.toLowerCase()}: ${item.procedure} previsto para ${formatDate(item.nextDate)}.`,
      }));
      return {
        ...patient,
        interactions: [...messages, ...patient.interactions],
        maintenances: (patient.maintenances ?? []).map((item) => (
          hit.some((row) => row.item.id === item.id) ? { ...item, reminderSent: true } : item
        )),
      };
    }));
  }

  function markReturnDone(protocolId: string, follow: FollowUp) {
    setPatients((current) => current.map((patient) => (
      patient.protocol !== protocolId ? patient : {
        ...patient,
        status: "Ativo",
        lastVisit: todayIso(),
        nextAction: "Retorno realizado",
        followUps: patient.followUps.map((item) => (
          item.date === follow.date && item.procedure === follow.procedure ? { ...item, status: "Realizado" } : item
        )),
      }
    )));
  }

  function markMaintDone(protocolId: string, plan: MaintenancePlan) {
    const next = addDays(todayIso(), plan.periodicityDays);
    setPatients((current) => current.map((patient) => {
      if (patient.protocol !== protocolId) return patient;
      return {
        ...patient,
        lastVisit: todayIso(),
        nextAction: `Próxima ${plan.procedure} em ${formatDate(next)}`,
        followUps: [{
          date: todayIso(),
          type: "Manutenção",
          procedure: plan.procedure,
          status: "Realizado",
        }, ...patient.followUps],
        upcoming: [{
          date: next,
          time: "09:00",
          procedure: plan.procedure,
          professional: patient.responsible,
          status: "Agendado" as const,
          notes: `Manutenção periódica (${periodicityLabel(plan.periodicityDays)})`,
        }, ...patient.upcoming],
        maintenances: (patient.maintenances ?? []).map((item) => (
          item.id === plan.id
            ? { ...item, lastDone: todayIso(), nextDate: next, reminderSent: false }
            : item
        )),
      };
    }));
  }

  function toggleMaint(protocolId: string, id: string) {
    setPatients((current) => current.map((patient) => (
      patient.protocol !== protocolId ? patient : {
        ...patient,
        maintenances: (patient.maintenances ?? []).map((item) => (
          item.id === id ? { ...item, status: item.status === "Ativa" ? "Pausada" : "Ativa" } : item
        )),
      }
    )));
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Acompanhamentos</h1>
            <p className="text-[13px] text-muted">Retornos e manutenções periódicas da clínica.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setComposeReturn(true)} className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">
              <LuPlus size={15} /> Registrar retorno
            </button>
            <button type="button" onClick={() => setComposeMaint(true)} className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2.5 text-[13px] font-medium hover:bg-surface">
              <LuPlus size={15} /> Criar manutenção
            </button>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Retornos pendentes", String(stats.pendingReturns)],
            ["Manutenções vencidas", String(stats.dueMaints)],
            ["Lembretes ativos", String(stats.reminders)],
            ["Comunicações enviadas", String(stats.notified)],
          ].map(([label, value]) => (
            <article key={label} className="rounded-lg border border-line bg-white px-4 py-3">
              <p className="text-[12px] text-muted">{label}</p>
              <p className="mt-1 text-[22px] font-semibold">{value}</p>
            </article>
          ))}
        </section>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => setTab("retornos")} className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${tab === "retornos" ? "bg-teal text-white" : "border border-line bg-white text-muted"}`}>
            Retornos
          </button>
          <button type="button" onClick={() => setTab("manutencoes")} className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${tab === "manutencoes" ? "bg-teal text-white" : "border border-line bg-white text-muted"}`}>
            Manutenções
          </button>
        </div>

        {tab === "retornos" ? (
          <section className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {(["pendentes", "agendados", "todos"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setReturnFilter(id)}
                    className={`rounded-full px-3 py-1 text-[12px] font-medium ${returnFilter === id ? "bg-teal/10 text-teal" : "text-muted"}`}
                  >
                    {id === "pendentes" ? "Pendentes" : id === "agendados" ? "Agendados" : "Todos"}
                  </button>
                ))}
              </div>
              <button type="button" onClick={notifyReturns} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-teal hover:underline">
                <LuSend size={14} /> Enviar comunicação
              </button>
            </div>
            {filteredReturns.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-muted">Nenhum retorno neste filtro.</p>
            ) : (
              <ul>
                {filteredReturns.map(({ patient, item }) => (
                  <li key={`${patient.protocol}-${item.date}-${item.procedure}`} className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
                    <button type="button" onClick={() => onOpenPatient(patient.protocol)} className="min-w-0 flex-1 text-left">
                      <p className="text-[14px] font-semibold hover:text-teal">{patient.name}</p>
                      <p className="text-[12px] text-muted">
                        {item.procedure} · {formatDate(item.date)} · {item.status}
                        {item.reminder ? " · lembrete" : ""}
                        {item.notified ? " · comunicado" : ""}
                      </p>
                    </button>
                    {item.status !== "Realizado" && (
                      <button type="button" onClick={() => markReturnDone(patient.protocol, item)} className="text-[12px] font-medium text-teal hover:underline">
                        Marcar realizado
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="mt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setKindFilter("todos")} className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${kindFilter === "todos" ? "bg-teal text-white" : "border border-line bg-white text-muted"}`}>
                  Todos
                </button>
                {maintenanceKinds.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setKindFilter(kind)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${kindFilter === kind ? "bg-teal text-white" : "border border-line bg-white text-muted"}`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
              <button type="button" onClick={notifyMaintenances} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-teal hover:underline">
                <LuSend size={14} /> Enviar comunicação
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              {filteredMaints.length === 0 ? (
                <p className="px-4 py-10 text-center text-[13px] text-muted">Nenhuma manutenção neste tipo.</p>
              ) : (
                <ul>
                  {filteredMaints.map(({ patient, item }) => {
                    const overdue = item.status === "Ativa" && item.nextDate <= todayIso();
                    return (
                      <li key={item.id} className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                        <button type="button" onClick={() => onOpenPatient(patient.protocol)} className="min-w-0 flex-1 text-left">
                          <p className="text-[14px] font-semibold hover:text-teal">{patient.name}</p>
                          <p className="text-[12px] text-muted">
                            {item.kind} · {item.procedure} · {periodicityLabel(item.periodicityDays)} · próxima {formatDate(item.nextDate)}
                            {overdue ? " · vencida" : ""}
                            {item.reminderSent ? " · comunicado" : ""}
                          </p>
                        </button>
                        <button type="button" onClick={() => toggleMaint(patient.protocol, item.id)} className="text-[12px] font-medium text-muted hover:underline">
                          {item.status === "Ativa" ? "Pausar" : "Reativar"}
                        </button>
                        {item.status === "Ativa" && (
                          <button type="button" onClick={() => markMaintDone(patient.protocol, item)} className="text-[12px] font-medium text-teal hover:underline">
                            Registrar realizada
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>

      {composeReturn && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            onSubmit={(event) => { event.preventDefault(); registerReturn(); }}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 sm:max-w-lg sm:rounded-xl"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-[20px] font-semibold">Registrar retorno</h2>
              <button type="button" aria-label="Fechar" onClick={() => setComposeReturn(false)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface">
                <LuX size={16} />
              </button>
            </div>
            <label className="mt-4 block text-[11px] font-medium text-muted">
              Paciente
              <select value={protocol} onChange={(event) => setProtocol(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
                {patients.map((patient) => (
                  <option key={patient.protocol} value={patient.protocol}>{patient.name}</option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={needOnly} onChange={(event) => setNeedOnly(event.target.checked)} />
              Só registrar necessidade (sem data ainda)
            </label>
            {!needOnly && (
              <label className="mt-3 block text-[11px] font-medium text-muted">
                Data de retorno
                <input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
              </label>
            )}
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Motivo / procedimento
              <input value={returnProcedure} onChange={(event) => setReturnProcedure(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Lembrete (dias antes)
              <input type="number" min={0} value={reminderDays} onChange={(event) => setReminderDays(Number(event.target.value))} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setComposeReturn(false)} className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium">Cancelar</button>
              <button type="submit" className="rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {composeMaint && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            onSubmit={(event) => { event.preventDefault(); createMaintenance(); }}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 sm:max-w-lg sm:rounded-xl"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-[20px] font-semibold">Manutenção periódica</h2>
              <button type="button" aria-label="Fechar" onClick={() => setComposeMaint(false)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface">
                <LuX size={16} />
              </button>
            </div>
            <label className="mt-4 block text-[11px] font-medium text-muted">
              Paciente
              <select value={protocol} onChange={(event) => setProtocol(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
                {patients.map((patient) => (
                  <option key={patient.protocol} value={patient.protocol}>{patient.name}</option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Tipo
              <select
                value={maintKind}
                onChange={(event) => {
                  const kind = event.target.value as MaintenanceKind;
                  setMaintKind(kind);
                  const defaults: Record<MaintenanceKind, string> = {
                    Aparelho: "Manutenção de aparelho",
                    Limpeza: "Limpeza periódica",
                    Avaliação: "Avaliação periódica",
                    Implante: "Acompanhamento de implante",
                    Prótese: "Acompanhamento de prótese",
                    Recorrente: "Procedimento recorrente",
                  };
                  setMaintProcedure(defaults[kind]);
                  setPeriodDays(kind === "Aparelho" ? 30 : kind === "Recorrente" ? 90 : 180);
                }}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
              >
                {maintenanceKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Procedimento
              <input value={maintProcedure} onChange={(event) => setMaintProcedure(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Periodicidade
              <select value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
                {periodicityOptions.map((item) => (
                  <option key={item.days} value={item.days}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Próxima data
              <input type="date" value={nextDate} onChange={(event) => setNextDate(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Lembrete (dias antes)
              <input type="number" min={0} value={maintReminder} onChange={(event) => setMaintReminder(Number(event.target.value))} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setComposeMaint(false)} className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium">Cancelar</button>
              <button type="submit" className="rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">Criar</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
