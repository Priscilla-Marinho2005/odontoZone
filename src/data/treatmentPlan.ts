import type {
  Patient,
  PlanProcedure,
  PlanStage,
  PlanStageStatus,
  PlanStatus,
  Responsible,
  Treatment,
  TreatmentPlan,
  TreatmentRecord,
} from "./clinicPatients";
import { stagesByTreatment } from "./clinicPatients";

export function planGross(plan: TreatmentPlan) {
  return plan.procedures.reduce((sum, item) => sum + item.quantity * item.unitValue, 0);
}

export function planTotal(plan: TreatmentPlan) {
  return Math.max(0, planGross(plan) - plan.discount);
}

export function currentStageName(plan: TreatmentPlan) {
  const started = plan.stages.find((item) => item.status === "Iniciada");
  if (started) return started.name;
  const pending = plan.stages.find((item) => item.status === "Pendente");
  return pending?.name ?? plan.stages.at(-1)?.name ?? "";
}

export function planProgress(plan: TreatmentPlan) {
  const countable = plan.stages.filter((item) => item.status !== "Cancelada");
  if (countable.length === 0) return 0;
  return countable.filter((item) => item.status === "Concluída").length / countable.length;
}

export function pendingProcedures(plan: TreatmentPlan) {
  return plan.procedures.filter((item) => item.done < item.quantity);
}

export function doneProcedures(plan: TreatmentPlan) {
  return plan.procedures.filter((item) => item.done >= item.quantity);
}

function recordStatus(status: PlanStatus): TreatmentRecord["status"] {
  if (status === "Concluído") return "Concluído";
  if (status === "Interrompido") return "Pausado";
  if (status === "Em andamento") return "Em andamento";
  return "Pendente";
}

export function syncPatientFromPlans(patient: Patient): Patient {
  const plans = patient.plans ?? [];
  const current = plans.find((item) => item.status === "Em andamento")
    ?? plans.find((item) => item.status === "Planejado")
    ?? plans[0];
  const value = plans
    .filter((item) => item.status !== "Interrompido")
    .reduce((sum, item) => sum + planTotal(item), patient.plans?.length ? 0 : patient.value);
  const treatments: TreatmentRecord[] = plans.map((item) => ({
    name: item.name,
    stage: currentStageName(item),
    status: recordStatus(item.status),
    startedAt: item.startedAt,
    professional: item.professional,
  }));
  return {
    ...patient,
    plans,
    treatment: current?.treatment ?? patient.treatment,
    stage: current ? (currentStageName(current) || patient.stage) : patient.stage,
    responsible: current?.professional ?? patient.responsible,
    value: plans.length ? value : patient.value,
    treatments: treatments.length ? treatments : patient.treatments,
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function emptyPlan(treatment: Treatment, professional: Responsible): TreatmentPlan {
  const stages = (stagesByTreatment[treatment] ?? ["Planejamento"]).map((name, index) => ({
    id: `st-${crypto.randomUUID()}`,
    name,
    status: (index === 0 ? "Pendente" : "Pendente") as PlanStageStatus,
  }));
  return {
    id: `plan-${crypto.randomUUID()}`,
    name: treatment,
    treatment,
    professional,
    duration: "",
    discount: 0,
    paymentTerms: "A definir",
    startedAt: today(),
    status: "Planejado",
    procedures: [],
    stages,
    history: [{ date: today(), text: `Plano de ${treatment} criado.` }],
  };
}

export function ensurePlanForTreatment(
  patient: Patient,
  treatment: Treatment,
  professional: Responsible,
  extra?: { duration?: string; price?: number; stageNames?: string[] },
): Patient {
  const plans = [...(patient.plans ?? [])];
  const open = plans.find((item) => item.treatment === treatment && item.status !== "Concluído" && item.status !== "Interrompido");
  if (open) {
    const next = plans.map((item) => (
      item.id === open.id
        ? {
            ...item,
            professional,
            duration: extra?.duration || item.duration,
            history: [{ date: today(), text: `Tratamento ${treatment} confirmado no funil/kanban.` }, ...item.history],
          }
        : item
    ));
    return syncPatientFromPlans({ ...patient, plans: next, treatment, responsible: professional });
  }

  const created = emptyPlan(treatment, professional);
  
  if (extra?.stageNames?.length) {
    created.stages = extra.stageNames.map((name) => ({
      id: `st-${crypto.randomUUID()}`,
      name,
      status: "Pendente" as const,
    }));
  }
  if (created.stages[0]) created.stages[0] = { ...created.stages[0], status: "Iniciada" };
  created.status = "Em andamento";
  created.duration = extra?.duration || created.duration;
  if (extra?.price && extra.price > 0 && created.procedures.length === 0) {
    created.procedures = [{
      id: `pr-${crypto.randomUUID()}`,
      name: treatment,
      quantity: 1,
      teeth: "A definir",
      professional,
      unitValue: extra.price,
      done: 0,
    }];
  }
  created.history = [{ date: today(), text: `Tratamento ${treatment} determinado.` }, ...created.history];
  return syncPatientFromPlans({
    ...patient,
    plans: [created, ...plans],
    treatment,
    responsible: professional,
  });
}

function stageStatusesFor(patient: Patient): PlanStage[] {
  const names = [...(stagesByTreatment[patient.treatment] ?? [patient.stage || "Em andamento"])];
  const current = Math.max(0, names.indexOf(patient.stage));
  return names.map((name, index) => ({
    id: `${patient.protocol}-st-${index}`,
    name,
    status: (index < current ? "Concluída" : index === current ? "Iniciada" : "Pendente") as PlanStageStatus,
  }));
}

function statusFromPatient(patient: Patient): PlanStatus {
  const pending = patient.treatments.some((item) => item.status === "Pendente" || item.status === "Pausado");
  if (patient.status === "Inativo" && pending) return "Interrompido";
  if (patient.funnelStage === "Concluído") return "Concluído";
  if (patient.status === "Em tratamento" || patient.funnelStage === "Em tratamento" || patient.funnelStage === "Tratamento iniciado") {
    return "Em andamento";
  }
  return "Planejado";
}

export function seedPlans(list: Patient[]): Patient[] {
  return list.map((patient) => {
    if (patient.plans?.length) return syncPatientFromPlans(patient);
    const procedures: PlanProcedure[] = patient.procedures.length
      ? patient.procedures.map((item, index) => ({
          id: `${patient.protocol}-pr-${index}`,
          name: item.name,
          quantity: 1,
          teeth: item.tooth,
          professional: (item.professional === "Dr. Rafael" ? "Dr. Rafael" : "Dra. Amanda") as Responsible,
          unitValue: patient.procedures.length ? Math.round(patient.value / patient.procedures.length) : patient.value,
          done: 1,
        }))
      : [{
          id: `${patient.protocol}-pr-0`,
          name: patient.treatment,
          quantity: 1,
          teeth: "A definir",
          professional: patient.responsible,
          unitValue: patient.value,
          done: patient.funnelStage === "Concluído" ? 1 : 0,
        }];
    const pending = patient.treatments.filter((item) => item.status === "Pendente");
    pending.forEach((item, index) => {
      if (procedures.some((entry) => entry.name === item.name)) return;
      procedures.push({
        id: `${patient.protocol}-pend-${index}`,
        name: item.name,
        quantity: 1,
        teeth: "A definir",
        professional: patient.responsible,
        unitValue: 0,
        done: 0,
      });
    });
    const plan: TreatmentPlan = {
      id: `plan-${patient.protocol}`,
      name: patient.treatment,
      treatment: patient.treatment,
      professional: patient.responsible,
      duration: "Conforme plano",
      discount: 0,
      paymentTerms: patient.payments.some((item) => item.method.includes("Boleto")) ? "Parcelado" : "À vista / conforme pagamentos",
      startedAt: patient.lastVisit || today(),
      status: statusFromPatient(patient),
      procedures,
      stages: stageStatusesFor(patient),
      history: [
        { date: patient.lastVisit || today(), text: `Plano de ${patient.treatment} acompanhado no prontuário.` },
        ...patient.history.slice(0, 2).map((item) => ({ date: item.date, text: item.notes || item.procedure })),
      ],
    };
    return syncPatientFromPlans({ ...patient, plans: [plan] });
  });
}
