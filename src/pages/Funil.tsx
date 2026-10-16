import { useEffect, useState } from "react";
import { LuGripVertical } from "react-icons/lu";
import { funnelStages, usePatients } from "./Pacientes";
import type { FunnelStage } from "./Pacientes";

type Patient = ReturnType<typeof usePatients>["patients"][number];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isFunnelStage(value: string): value is FunnelStage {
  return (funnelStages as readonly string[]).includes(value);
}

export default function Funil({ onOpenPatient }: { onOpenPatient: (protocol: string) => void }) {
  const { patients, setPatients } = usePatients();
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
              className={`flex w-[280px] shrink-0 flex-col rounded-lg border bg-white ${
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
}: {
  patient: Patient;
  onMove: (stage: FunnelStage) => void;
  onOpen: () => void;
  onSummary: () => void;
  onNextAction: (action: string) => void;
}) {
  const [action, setAction] = useState(patient.nextAction);

  useEffect(() => {
    setAction(patient.nextAction);
  }, [patient.nextAction]);

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
      className="cursor-grab rounded-lg border border-line bg-surface p-3 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onSummary} className="text-left text-[14px] font-semibold hover:text-teal">
          {patient.name}
        </button>
        <LuGripVertical size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
      </div>
      <dl className="mt-2 space-y-1 text-[12px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Tratamento</dt>
          <dd className="text-right font-medium">{patient.treatment}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Valor</dt>
          <dd className="font-medium tabular-nums">{formatMoney(patient.value)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Responsável</dt>
          <dd className="text-right font-medium">{patient.responsible}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Etapa atual</dt>
          <dd className="text-right font-medium">{patient.funnelStage}</dd>
        </div>
      </dl>
      <label className="mt-3 block text-[11px] font-medium text-muted">
        Próxima ação
        <input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          onBlur={() => onNextAction(action.trim())}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          placeholder="Definir próxima ação"
          className="mt-1 w-full rounded-md border border-line bg-white px-2 py-1.5 text-[12px] text-ink outline-none focus:border-teal"
        />
      </label>
      <label className="mt-2 block text-[11px] font-medium text-muted">
        Alterar etapa
        <select
          value={patient.funnelStage}
          onChange={(event) => {
            if (isFunnelStage(event.target.value)) onMove(event.target.value);
          }}
          className="mt-1 w-full rounded-md border border-line bg-white px-2 py-1.5 text-[12px] outline-none focus:border-teal"
        >
          {funnelStages.map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </label>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onSummary} className="flex-1 rounded-md border border-line bg-white px-2 py-1.5 text-[12px] font-medium hover:bg-white/80">
          Resumo
        </button>
        <button type="button" onClick={onOpen} className="flex-1 rounded-md bg-teal px-2 py-1.5 text-[12px] font-medium text-white hover:bg-navy">
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
}: {
  patient: Patient;
  onClose: () => void;
  onOpen: () => void;
  onMove: (stage: FunnelStage) => void;
  onNextAction: (action: string) => void;
}) {
  const [action, setAction] = useState(patient.nextAction);
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
          <input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            onBlur={() => onNextAction(action.trim())}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
          />
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
