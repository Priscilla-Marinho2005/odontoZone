import { useState } from "react";
import { LuGripVertical } from "react-icons/lu";
import { funnelStages, usePatients } from "./Pacientes";
import type { FunnelStage } from "./Pacientes";
import { ensurePlanForTreatment } from "../data/treatmentPlan";
import { actionsForTreatment, findClinicTreatment, placementForTreatment, useTreatments } from "./Tratamentos";

type Patient = ReturnType<typeof usePatients>["patients"][number];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isFunnelStage(value: string): value is FunnelStage {
  return (funnelStages as readonly string[]).includes(value);
}

export default function Funil({ onOpenPatient }: { onOpenPatient: (protocol: string) => void }) {
  const { patients, setPatients } = usePatients();
  const { treatments } = useTreatments();
  const [overStage, setOverStage] = useState<FunnelStage | null>(null);
  const [summaryProtocol, setSummaryProtocol] = useState<string | null>(null);
  const summary = patients.find((patient) => patient.protocol === summaryProtocol) ?? null;

  function movePatient(protocol: string, funnelStage: FunnelStage) {
    setPatients((current) => current.map((patient) => (
      patient.protocol === protocol ? { ...patient, funnelStage } : patient
    )));
  }

  function setNextAction(protocol: string, nextAction: string) {
    setPatients((current) => current.map((patient) => (
      patient.protocol === protocol ? { ...patient, nextAction } : patient
    )));
  }

  function setTreatment(protocol: string, patientKey: string) {
    const item = findClinicTreatment(treatments, patientKey);
    if (!item) return;
    const placement = placementForTreatment(item);
    const actions = actionsForTreatment(treatments, placement.treatment);
    const price = Number(item.price);
    const stageNames = item.stages.split("\n").map((stage) => stage.trim()).filter(Boolean);
    setPatients((current) => current.map((patient) => {
      if (patient.protocol !== protocol) return patient;
      const next = ensurePlanForTreatment(patient, placement.treatment, patient.responsible, {
        duration: item.duration,
        price: Number.isFinite(price) ? price : undefined,
        stageNames,
      });
      return {
        ...next,
        nextAction: actions.includes(patient.nextAction) ? patient.nextAction : (actions[0] ?? next.nextAction),
      };
    }));
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
      <header className="shrink-0 px-4 pt-5 sm:px-6">
        <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
        <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Funil</h1>
        <p className="text-[13px] text-muted">
          Acompanhe a evolução dos pacientes. Arraste o card ou altere a etapa manualmente.
        </p>
      </header>

      <div className="mt-4 flex flex-1 gap-3 overflow-x-auto px-4 pb-5 sm:px-6">
        {funnelStages.map((stage, index) => {
          const column = patients.filter((patient) => patient.funnelStage === stage);
          return (
            <section
              key={stage}
              className={`flex w-72 shrink-0 flex-col rounded-lg border bg-white ${
                overStage === stage ? "border-teal" : "border-line"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((current) => (current === stage ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                const protocol = event.dataTransfer.getData("text/plain");
                if (protocol) movePatient(protocol, stage);
                setOverStage(null);
              }}
            >
              <header className="border-b border-line px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[13px] font-semibold">{stage}</h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">{column.length}</span>
                </div>
                {index < funnelStages.length - 1 && (
                  <p className="mt-1 text-[10px] text-muted">Próxima etapa: {funnelStages[index + 1]}</p>
                )}
              </header>
              <div className="flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto p-2">
                {column.length === 0 && (
                  <p className="px-2 py-6 text-center text-[12px] text-muted">Nenhum paciente nesta etapa</p>
                )}
                {column.map((patient) => (
                  <PatientCard
                    key={patient.protocol}
                    patient={patient}
                    onMove={(next) => movePatient(patient.protocol, next)}
                    onOpen={() => onOpenPatient(patient.protocol)}
                    onSummary={() => setSummaryProtocol(patient.protocol)}
                    onNextAction={(action) => setNextAction(patient.protocol, action)}
                    onTreatment={(key) => setTreatment(patient.protocol, key)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {summary && (
        <Summary
          patient={summary}
          onClose={() => setSummaryProtocol(null)}
          onOpen={() => onOpenPatient(summary.protocol)}
          onMove={(stage) => movePatient(summary.protocol, stage)}
          onNextAction={(action) => setNextAction(summary.protocol, action)}
          onTreatment={(key) => setTreatment(summary.protocol, key)}
        />
      )}
    </main>
  );
}

function PatientCard({
  patient,
  onMove,
  onOpen,
  onSummary,
  onNextAction,
  onTreatment,
}: {
  patient: Patient;
  onMove: (stage: FunnelStage) => void;
  onOpen: () => void;
  onSummary: () => void;
  onNextAction: (action: string) => void;
  onTreatment: (patientKey: string) => void;
}) {
  const { treatments } = useTreatments();
  const actions = actionsForTreatment(treatments, patient.treatment);
  const selectClass = "mt-1 w-full rounded-md border border-line bg-white px-2 py-1.5 text-[12px] text-ink outline-none focus:border-teal";

  return (
    <article
      draggable
      onDragStart={(event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("input, select, button, textarea")) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData("text/plain", patient.protocol);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab rounded-lg border border-line bg-white p-3 shadow-[0_1px_0_rgb(219_229_232)] active:cursor-grabbing"
    >
      <header className="flex items-start gap-2">
        {patient.photo ? (
          <img src={patient.photo} alt="" className="size-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal text-[11px] font-semibold text-white">
            {patient.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onSummary} className="block w-full truncate text-left text-[13px] font-semibold hover:text-teal">
            {patient.name}
          </button>
          <p className="truncate text-[11px] text-muted">{patient.protocol} · {patient.responsible}</p>
        </div>
        <LuGripVertical size={16} className="mt-1 shrink-0 text-muted" aria-hidden="true" />
      </header>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-surface px-2.5 py-2">
          <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Valor</p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums">{formatMoney(patient.value)}</p>
        </div>
        <div className="rounded-md bg-surface px-2.5 py-2">
          <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Pago</p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums">{formatMoney(patient.paid)}</p>
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-line pt-3">
        <label className="block text-[10px] font-medium tracking-wide text-muted uppercase">
          Tratamento
          <select value={patient.treatment} onChange={(event) => onTreatment(event.target.value)} className={selectClass}>
            {treatments.map((item) => (
              <option key={item.id} value={item.patientKey}>{item.name}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-1 gap-2">
          <label className="block text-[10px] font-medium tracking-wide text-muted uppercase">
            Próxima ação
            <select value={patient.nextAction} onChange={(event) => onNextAction(event.target.value)} className={selectClass}>
              <option value="">Selecione</option>
              {patient.nextAction && !actions.includes(patient.nextAction) && (
                <option value={patient.nextAction}>{patient.nextAction}</option>
              )}
              {actions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </label>
          <label className="block text-[10px] font-medium tracking-wide text-muted uppercase">
            Mover etapa
            <select
              value={patient.funnelStage}
              onChange={(event) => {
                if (isFunnelStage(event.target.value)) onMove(event.target.value);
              }}
              className={selectClass}
            >
              {funnelStages.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onSummary} className="flex-1 rounded-md border border-line bg-surface px-2 py-2 text-[12px] font-medium hover:bg-white">
          Resumo
        </button>
        <button type="button" onClick={onOpen} className="flex-1 rounded-md bg-teal px-2 py-2 text-[12px] font-medium text-white hover:bg-navy">
          Abrir
        </button>
      </div>
    </article>
  );
}

function Summary({
  patient,
  onClose,
  onOpen,
  onMove,
  onNextAction,
  onTreatment,
}: {
  patient: Patient;
  onClose: () => void;
  onOpen: () => void;
  onMove: (stage: FunnelStage) => void;
  onNextAction: (action: string) => void;
  onTreatment: (patientKey: string) => void;
}) {
  const { treatments } = useTreatments();
  const actions = actionsForTreatment(treatments, patient.treatment);
  const pending = Math.max(patient.value - patient.paid, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="resumo-paciente" className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 sm:max-w-lg sm:rounded-xl">
        <p className="text-[11px] font-semibold text-teal">RESUMO</p>
        <h2 id="resumo-paciente" className="mt-1 text-[20px] font-semibold">{patient.name}</h2>
        <p className="text-[12px] text-muted">Protocolo {patient.protocol}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <dt className="text-[11px] text-muted">Tratamento</dt>
            <dd className="font-medium">{patient.treatment}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted">Etapa atual</dt>
            <dd className="font-medium">{patient.funnelStage}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted">Responsável</dt>
            <dd className="font-medium">{patient.responsible}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted">Valor</dt>
            <dd className="font-medium">{formatMoney(patient.value)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted">Valor pago</dt>
            <dd className="font-medium">{formatMoney(patient.paid)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted">Valor pendente</dt>
            <dd className="font-medium">{formatMoney(pending)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[11px] text-muted">Telefone</dt>
            <dd className="font-medium">{patient.phone || "—"}</dd>
          </div>
        </dl>
        <label className="mt-4 block text-[11px] font-medium text-muted">
          Determinar tratamento
          <select
            value={patient.treatment}
            onChange={(event) => onTreatment(event.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
          >
            {treatments.map((item) => (
              <option key={item.id} value={item.patientKey}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Etapa
          <select
            value={patient.funnelStage}
            onChange={(event) => {
              if (isFunnelStage(event.target.value)) onMove(event.target.value);
            }}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
          >
            {funnelStages.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Próxima ação
          <select
            value={patient.nextAction}
            onChange={(event) => onNextAction(event.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
          >
            <option value="">Selecione a ação</option>
            {patient.nextAction && !actions.includes(patient.nextAction) && (
              <option value={patient.nextAction}>{patient.nextAction}</option>
            )}
            {actions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </label>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium hover:bg-surface">
            Fechar
          </button>
          <button type="button" onClick={onOpen} className="rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">
            Abrir paciente
          </button>
        </div>
      </section>
    </div>
  );
}
