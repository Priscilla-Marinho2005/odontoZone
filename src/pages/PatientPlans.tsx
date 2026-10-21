import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import type { Patient, PlanStageStatus, PlanStatus, Responsible, Treatment, TreatmentPlan } from "../data/clinicPatients";
import { responsibles, stagesByTreatment, treatments } from "../data/clinicPatients";
import {
  currentStageName,
  doneProcedures,
  emptyPlan,
  pendingProcedures,
  planGross,
  planProgress,
  planTotal,
  syncPatientFromPlans,
} from "../data/treatmentPlan";

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

const stageOptions: PlanStageStatus[] = ["Pendente", "Iniciada", "Concluída", "Cancelada"];
const planStatuses: PlanStatus[] = ["Planejado", "Em andamento", "Concluído", "Interrompido"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function PatientPlans({
  patient,
  onChange,
}: {
  patient: Patient;
  onChange: (next: Patient) => void;
}) {
  const plans = patient.plans ?? [];
  const [selectedId, setSelectedId] = useState(plans[0]?.id ?? "");
  const selected = plans.find((item) => item.id === selectedId) ?? plans[0] ?? null;
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<Treatment>("Avaliação");

  function commit(plansNext: TreatmentPlan[], extra: Partial<Patient> = {}) {
    const next = syncPatientFromPlans({ ...patient, ...extra, plans: plansNext });
    onChange(next);
  }

  function patchPlan(planId: string, updater: (plan: TreatmentPlan) => TreatmentPlan) {
    commit((patient.plans ?? []).map((item) => (item.id === planId ? updater(item) : item)));
  }

  function createPlan() {
    const plan = emptyPlan(newType, patient.responsible);
    const named = stagesByTreatment[newType];
    if (named) {
      plan.stages = named.map((name) => ({
        id: `st-${crypto.randomUUID()}`,
        name,
        status: "Pendente" as const,
      }));
    }
    const next = [plan, ...(patient.plans ?? [])];
    setSelectedId(plan.id);
    setCreating(false);
    commit(next, { treatment: newType });
  }

  if (!selected) {
    return (
      <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Planos de tratamento</h2>
          <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-md bg-teal px-3 py-2 text-[12px] font-medium text-white hover:bg-navy">
            <LuPlus size={14} /> Criar plano
          </button>
        </div>
        {creating && (
          <div className="mt-4 flex flex-wrap gap-2">
            <select value={newType} onChange={(event) => setNewType(event.target.value as Treatment)} className="rounded-md border border-line px-3 py-2 text-[13px]">
              {treatments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="button" onClick={createPlan} className="rounded-md bg-teal px-3 py-2 text-[13px] font-medium text-white">Salvar</button>
          </div>
        )}
        <p className="mt-3 text-[13px] text-muted">Nenhum plano indicado para este paciente.</p>
      </section>
    );
  }

  const gross = planGross(selected);
  const total = planTotal(selected);
  const progress = planProgress(selected);
  const pending = pendingProcedures(selected);
  const done = doneProcedures(selected);

  return (
    <div className="mt-5 grid gap-4">
      <section className="rounded-xl border border-line bg-white px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Planos de tratamento</h2>
            <p className="mt-1 text-[12px] text-muted">O plano ativo define a coluna no kanban de tratamentos e o valor no funil.</p>
          </div>
          <button type="button" onClick={() => setCreating((open) => !open)} className="inline-flex items-center gap-1.5 rounded-md bg-teal px-3 py-2 text-[12px] font-medium text-white hover:bg-navy">
            <LuPlus size={14} /> Criar plano
          </button>
        </div>
        {creating && (
          <div className="mt-4 flex flex-wrap gap-2">
            <select value={newType} onChange={(event) => setNewType(event.target.value as Treatment)} className="rounded-md border border-line px-3 py-2 text-[13px]">
              {treatments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="button" onClick={createPlan} className="rounded-md bg-teal px-3 py-2 text-[13px] font-medium text-white">Salvar plano</button>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {plans.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                item.id === selected.id ? "bg-teal text-white" : "bg-surface text-muted ring-1 ring-line"
              }`}
            >
              {item.name} · {item.status}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold">{selected.name}</h3>
          <select
            value={selected.status}
            onChange={(event) => patchPlan(selected.id, (plan) => ({
              ...plan,
              status: event.target.value as PlanStatus,
              history: [{ date: today(), text: `Status alterado para ${event.target.value}.` }, ...plan.history],
            }))}
            className="rounded-md border border-line px-2 py-1.5 text-[12px]"
          >
            {planStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-teal" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p className="mt-2 text-[12px] text-muted">{Math.round(progress * 100)}% das etapas · etapa atual: {currentStageName(selected) || "—"}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-[11px] font-medium text-muted">
            Tratamento
            <select
              value={selected.treatment}
              onChange={(event) => {
                const treatment = event.target.value as Treatment;
                patchPlan(selected.id, (plan) => ({ ...plan, treatment, name: treatment }));
              }}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px]"
            >
              {treatments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-[11px] font-medium text-muted">
            Profissional responsável
            <select
              value={selected.professional}
              onChange={(event) => patchPlan(selected.id, (plan) => ({ ...plan, professional: event.target.value as Responsible }))}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px]"
            >
              {responsibles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-[11px] font-medium text-muted">
            Previsão de duração
            <input
              value={selected.duration}
              onChange={(event) => patchPlan(selected.id, (plan) => ({ ...plan, duration: event.target.value }))}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px]"
            />
          </label>
          <label className="block text-[11px] font-medium text-muted">
            Condições de pagamento
            <input
              value={selected.paymentTerms}
              onChange={(event) => patchPlan(selected.id, (plan) => ({ ...plan, paymentTerms: event.target.value }))}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px]"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white px-5 py-4">
        <h3 className="text-[15px] font-semibold">Procedimentos</h3>
        <ul className="mt-3 space-y-2">
          {selected.procedures.map((item) => (
            <li key={item.id} className="grid gap-2 rounded-lg border border-line px-3 py-3 sm:grid-cols-6">
              <label className="block text-[11px] font-medium text-muted sm:col-span-2">
                Nome
                <input value={item.name} onChange={(event) => patchPlan(selected.id, (plan) => ({
                  ...plan,
                  procedures: plan.procedures.map((entry) => entry.id === item.id ? { ...entry, name: event.target.value } : entry),
                }))} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-[12px] text-ink" />
              </label>
              <label className="block text-[11px] font-medium text-muted">
                Dentes
                <input value={item.teeth} onChange={(event) => patchPlan(selected.id, (plan) => ({
                  ...plan,
                  procedures: plan.procedures.map((entry) => entry.id === item.id ? { ...entry, teeth: event.target.value } : entry),
                }))} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-[12px] text-ink" />
              </label>
              <label className="block text-[11px] font-medium text-muted">
                Quantidade
                <input type="number" min={1} value={item.quantity} onChange={(event) => patchPlan(selected.id, (plan) => ({
                  ...plan,
                  procedures: plan.procedures.map((entry) => entry.id === item.id ? { ...entry, quantity: Number(event.target.value) || 1 } : entry),
                }))} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-[12px] text-ink" />
              </label>
              <label className="block text-[11px] font-medium text-muted">
                Valor unitário
                <input type="number" min={0} value={item.unitValue} onChange={(event) => patchPlan(selected.id, (plan) => ({
                  ...plan,
                  procedures: plan.procedures.map((entry) => entry.id === item.id ? { ...entry, unitValue: Number(event.target.value) || 0 } : entry),
                }))} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-[12px] text-ink" />
              </label>
              <label className="block text-[11px] font-medium text-muted">
                Realizados
                <input type="number" min={0} max={item.quantity} value={item.done} onChange={(event) => patchPlan(selected.id, (plan) => ({
                  ...plan,
                  procedures: plan.procedures.map((entry) => entry.id === item.id ? { ...entry, done: Number(event.target.value) || 0 } : entry),
                }))} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-[12px] text-ink" />
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => patchPlan(selected.id, (plan) => ({
            ...plan,
            procedures: [...plan.procedures, {
              id: `pr-${crypto.randomUUID()}`,
              name: "",
              quantity: 1,
              teeth: "",
              professional: plan.professional,
              unitValue: 0,
              done: 0,
            }],
          }))}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-teal"
        >
          <LuPlus size={14} /> Adicionar procedimento
        </button>
      </section>

      <section className="rounded-xl border border-line bg-white px-5 py-4">
        <h3 className="text-[15px] font-semibold">Etapas</h3>
        <ul className="mt-3 space-y-2">
          {selected.stages.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
              <span className="text-[13px] font-medium">{item.name}</span>
              <div className="flex flex-wrap gap-1">
                {stageOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => patchPlan(selected.id, (plan) => ({
                      ...plan,
                      stages: plan.stages.map((entry) => entry.id === item.id ? { ...entry, status } : entry),
                      history: [{ date: today(), text: `Etapa ${item.name}: ${status}.` }, ...plan.history],
                    }))}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      item.status === status ? "bg-teal text-white" : "bg-surface text-muted"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            const name = window.prompt("Nome da etapa");
            if (!name?.trim()) return;
            patchPlan(selected.id, (plan) => ({
              ...plan,
              stages: [...plan.stages, { id: `st-${crypto.randomUUID()}`, name: name.trim(), status: "Pendente" }],
            }));
          }}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-teal"
        >
          <LuPlus size={14} /> Criar etapa
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-white px-5 py-4">
          <h3 className="text-[15px] font-semibold">Acompanhamento</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
            <div><dt className="text-[11px] text-muted">Realizados</dt><dd className="font-semibold">{done.length}</dd></div>
            <div><dt className="text-[11px] text-muted">Pendentes</dt><dd className="font-semibold">{pending.length}</dd></div>
            <div><dt className="text-[11px] text-muted">Bruto</dt><dd className="font-semibold">{money(gross)}</dd></div>
            <div>
              <dt className="text-[11px] text-muted">Desconto</dt>
              <dd>
                <input
                  type="number"
                  min={0}
                  value={selected.discount}
                  onChange={(event) => patchPlan(selected.id, (plan) => ({ ...plan, discount: Number(event.target.value) || 0 }))}
                  className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-[13px]"
                />
              </dd>
            </div>
            <div className="col-span-2"><dt className="text-[11px] text-muted">Valor do plano</dt><dd className="text-[16px] font-semibold">{money(total)}</dd></div>
            <div><dt className="text-[11px] text-muted">Pago no paciente</dt><dd className="font-semibold">{money(patient.paid)}</dd></div>
            <div><dt className="text-[11px] text-muted">Pendente</dt><dd className="font-semibold">{money(Math.max(total - patient.paid, 0))}</dd></div>
          </dl>
        </div>
        <div className="rounded-xl border border-line bg-white px-5 py-4">
          <h3 className="text-[15px] font-semibold">Histórico do tratamento</h3>
          <ul className="mt-3 space-y-2">
            {selected.history.map((item, index) => (
              <li key={`${item.date}-${index}`} className="text-[13px]">
                <span className="text-[11px] text-muted">{formatDate(item.date)}</span>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
