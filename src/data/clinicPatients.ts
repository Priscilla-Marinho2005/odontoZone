export const treatments = ["Avaliação", "Limpeza", "Clareamento", "Restauração", "Canal", "Implante", "Ortodontia"] as const;
export const responsibles = ["Dra. Amanda", "Dr. Rafael"] as const;
export const clinicUsers = ["Dra. Amanda", "Dr. Rafael", "Recepção", "Financeiro"] as const;
export const statuses = ["Ativo", "Em tratamento", "Aguardando retorno", "Inativo"] as const;
export const origins = [
  "Indicação",
  "Instagram",
  "Google",
  "WhatsApp",
  "Convênio",
  "Campanha da clínica",
  "Passante",
  "Facebook",
] as const;

export type Treatment = (typeof treatments)[number];
export type Responsible = (typeof responsibles)[number];
export type ClinicUser = (typeof clinicUsers)[number];

export type ClinicTask = {
  id: string;
  title: string;
  date: string;
  time: string;
  patientProtocol: string;
  assignee: ClinicUser;
  notes: string;
  done: boolean;
};

export const initialTasks: ClinicTask[] = [
  { id: "task-1", title: "Confirmar sessão 3 de clareamento", date: "2026-10-19", time: "09:00", patientProtocol: "OZ-0006", assignee: "Dra. Amanda", notes: "Ligar pela manhã.", done: false },
  { id: "task-2", title: "Reativar contato do orçamento", date: "2026-10-16", time: "11:00", patientProtocol: "OZ-0010", assignee: "Recepção", notes: "Lead de lentes parado.", done: false },
  { id: "task-3", title: "Cobrar parcela em atraso", date: "2026-10-16", time: "14:00", patientProtocol: "OZ-0011", assignee: "Financeiro", notes: "Boleto do canal.", done: false },
];
export type Status = (typeof statuses)[number];
export type Origin = (typeof origins)[number];

export const funnelStages = [
  "Avaliação",
  "Orçamento",
  "Aguardando aprovação",
  "Tratamento iniciado",
  "Em tratamento",
  "Retorno",
  "Concluído",
] as const;

export type FunnelStage = (typeof funnelStages)[number];

export type Address = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
};

export type Guardian = {
  name: string;
  kinship: string;
  phone: string;
  cpf: string;
};

export type TagDef = {
  id: string;
  label: string;
  color: string;
};

export type ClinicalNote = {
  date: string;
  procedure: string;
  professional: string;
  notes: string;
};

export type Consultation = {
  date: string;
  time: string;
  procedure: string;
  professional: string;
  status?: "Agendado" | "Confirmado" | "Chegou" | "Em atendimento" | "Concluído" | "Atrasado" | "Cancelado" | "Retorno" | "Falta";
  notes?: string;
  durationMin?: number;
  encaixe?: boolean;
  reminded24h?: boolean;
  reminded2h?: boolean;
};

export type Procedure = {
  date: string;
  name: string;
  tooth: string;
  professional: string;
  notes: string;
};

export type TreatmentRecord = {
  name: string;
  stage: string;
  status: "Em andamento" | "Pendente" | "Concluído" | "Pausado";
  startedAt: string;
  professional: string;
};

export type PlanStageStatus = "Pendente" | "Iniciada" | "Concluída" | "Cancelada";
export type PlanStatus = "Planejado" | "Em andamento" | "Concluído" | "Interrompido";

export type PlanProcedure = {
  id: string;
  name: string;
  quantity: number;
  teeth: string;
  professional: Responsible;
  unitValue: number;
  done: number;
};

export type PlanStage = {
  id: string;
  name: string;
  status: PlanStageStatus;
};

export type PlanHistory = {
  date: string;
  text: string;
};

export type TreatmentPlan = {
  id: string;
  name: string;
  treatment: Treatment;
  professional: Responsible;
  duration: string;
  discount: number;
  paymentTerms: string;
  startedAt: string;
  status: PlanStatus;
  procedures: PlanProcedure[];
  stages: PlanStage[];
  history: PlanHistory[];
};

export const quoteStatuses = [
  "Rascunho",
  "Pendente",
  "Enviado",
  "Visualizado",
  "Em negociação",
  "Aprovado",
  "Recusado",
  "Expirado",
] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];

export type QuoteLine = {
  id: string;
  name: string;
  quantity: number;
  unitValue: number;
};

export type QuoteEvent = {
  date: string;
  text: string;
};

export type Quote = {
  id: string;
  date: string;
  title: string;
  value: number;
  status: QuoteStatus;
  procedures?: QuoteLine[];
  discount?: number;
  paymentTerms?: string;
  planId?: string;
  token?: string;
  sentAt?: string;
  viewedAt?: string;
  sentChannel?: "WhatsApp" | "E-mail" | "Link" | "";
  negotiation?: string;
  expiresAt?: string;
  history?: QuoteEvent[];
};

export function quoteGross(quote: Quote) {
  const lines = quote.procedures ?? [];
  if (lines.length === 0) return quote.value + (quote.discount ?? 0);
  return lines.reduce((sum, item) => sum + item.quantity * item.unitValue, 0);
}

export function quoteNet(quote: Quote) {
  return Math.max(0, quoteGross(quote) - (quote.discount ?? 0));
}

export function hydrateQuote(quote: Quote): Quote {
  const procedures = quote.procedures?.length
    ? quote.procedures
    : [{ id: `${quote.id}-1`, name: quote.title, quantity: 1, unitValue: quote.value }];
  const discount = quote.discount ?? 0;
  const status = quote.status === "Pendente" ? "Enviado" : quote.status;
  return {
    ...quote,
    procedures,
    discount,
    value: Math.max(0, procedures.reduce((sum, item) => sum + item.quantity * item.unitValue, 0) - discount),
    status,
    paymentTerms: quote.paymentTerms ?? "A combinar",
    planId: quote.planId ?? "",
    token: quote.token ?? quote.id.toLowerCase().replace(/\W/g, ""),
    sentAt: quote.sentAt ?? (status === "Rascunho" ? "" : quote.date),
    viewedAt: quote.viewedAt ?? "",
    sentChannel: quote.sentChannel ?? "",
    negotiation: quote.negotiation ?? "",
    expiresAt: quote.expiresAt ?? "",
    history: quote.history ?? [{ date: quote.date, text: `Orçamento ${status.toLowerCase()}` }],
  };
}

export function hydrateQuotes(patients: Patient[]): Patient[] {
  return patients.map((patient) => ({
    ...patient,
    quotes: patient.quotes.map(hydrateQuote),
  }));
}

export type Payment = {
  date: string;
  method: string;
  amount: number;
  status: "Pago" | "Em aberto" | "Atrasado";
};

export type Interaction = {
  date: string;
  channel: "WhatsApp" | "E-mail" | "Telefone" | "Presencial";
  summary: string;
};

export type Absence = {
  date: string;
  type: "Falta" | "Cancelamento";
  procedure: string;
  reason: string;
};

export type FollowUp = {
  date: string;
  type: "Retorno" | "Manutenção";
  procedure: string;
  status: "Agendado" | "Realizado" | "Atrasado" | "Pendente";
  reminder?: boolean;
  notified?: boolean;
};

export const maintenanceKinds = ["Aparelho", "Limpeza", "Avaliação", "Implante", "Prótese", "Recorrente"] as const;
export type MaintenanceKind = (typeof maintenanceKinds)[number];

export const periodicityOptions = [
  { days: 30, label: "30 dias" },
  { days: 90, label: "3 meses" },
  { days: 180, label: "6 meses" },
  { days: 365, label: "12 meses" },
] as const;

export type MaintenancePlan = {
  id: string;
  kind: MaintenanceKind;
  procedure: string;
  periodicityDays: number;
  nextDate: string;
  lastDone: string;
  reminderDays: number;
  reminderSent: boolean;
  status: "Ativa" | "Pausada";
};

export type Patient = {
  protocol: string;
  name: string;
  photo: string;
  cpf: string;
  phone: string;
  whatsapp: string;
  email: string;
  birthDate: string;
  address: Address;
  hasGuardian: boolean;
  guardian: Guardian | null;
  tagIds: string[];
  origin: Origin;
  notes: string;
  treatment: Treatment;
  stage: string;
  funnelStage: FunnelStage;
  responsible: Responsible;
  status: Status;
  value: number;
  paid: number;
  lastVisit: string;
  nextAction: string;
  history: ClinicalNote[];
  upcoming: Consultation[];
  consultations: Consultation[];
  procedures: Procedure[];
  treatments: TreatmentRecord[];
  plans?: TreatmentPlan[];
  quotes: Quote[];
  payments: Payment[];
  interactions: Interaction[];
  absences: Absence[];
  followUps: FollowUp[];
  maintenances?: MaintenancePlan[];
  odontogram?: import("./odontogram").ToothEvent[];
  chart?: import("./clinicalRecord").ClinicalChart;
};

export const defaultTagCatalog: TagDef[] = [
  { id: "implante", label: "Implante", color: "#018295" },
  { id: "orto", label: "Ortodontia", color: "#6d4fe0" },
  { id: "estetica", label: "Estética", color: "#079ed4" },
  { id: "endo", label: "Endodontia", color: "#b36b00" },
  { id: "perio", label: "Periodontia", color: "#138a5e" },
  { id: "protese", label: "Prótese", color: "#053647" },
  { id: "urgencia", label: "Urgência", color: "#d13b40" },
  { id: "convenio", label: "Convênio", color: "#5f7a86" },
  { id: "pedo", label: "Odontopediatria", color: "#19d3a2" },
  { id: "clareamento", label: "Clareamento", color: "#0687b5" },
  { id: "vip", label: "VIP", color: "#c9a227" },
  { id: "faceta", label: "Facetas", color: "#c45c8a" },
  { id: "alinhador", label: "Alinhador", color: "#3d7ea6" },
  { id: "bruxismo", label: "Bruxismo", color: "#8a5a2b" },
  { id: "siso", label: "Siso", color: "#4a6670" },
  { id: "geriatria", label: "Odontogeriatria", color: "#5b4b8a" },
];

export const stagesByTreatment: Record<Treatment, readonly string[]> = {
  Avaliação: ["Triagem", "Concluída"],
  Limpeza: ["Agendada", "Realizada"],
  Clareamento: ["Avaliação", "Sessão 1", "Sessão 2", "Finalização"],
  Restauração: ["Preparo", "Restauração", "Revisão"],
  Canal: ["Diagnóstico", "Tratamento", "Obturação", "Acompanhamento"],
  Implante: ["Planejamento", "Cirurgia", "Osseointegração", "Prótese"],
  Ortodontia: ["Avaliação", "Instalação", "Manutenção", "Contenção"],
};

const sp = (street: string, number: string, neighborhood: string, zip: string): Address => ({
  street, number, neighborhood, city: "São Paulo", state: "SP", zip,
});

export const emptyAddress = (): Address => ({
  street: "", number: "", neighborhood: "", city: "São Paulo", state: "SP", zip: "",
});

export const emptyGuardian = (): Guardian => ({
  name: "", kinship: "Pai/Mãe", phone: "", cpf: "",
});

export const emptyClinicalExtras = () => ({
  history: [] as ClinicalNote[],
  upcoming: [] as Consultation[],
  consultations: [] as Consultation[],
  procedures: [] as Procedure[],
  treatments: [] as TreatmentRecord[],
  plans: [] as TreatmentPlan[],
  quotes: [] as Quote[],
  payments: [] as Payment[],
  interactions: [] as Interaction[],
  absences: [] as Absence[],
  followUps: [] as FollowUp[],
  maintenances: [] as MaintenancePlan[],
  odontogram: [] as import("./odontogram").ToothEvent[],
  chart: { anamnesis: [], evolutions: [], documents: [], permissions: {}, audit: [] } as import("./clinicalRecord").ClinicalChart,
});

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function enrichPatientHistory(patients: Patient[]): Patient[] {
  return patients.map((patient) => {
    if (patient.history.length >= 4) return patient;
    const pro = patient.responsible;
    const extraHistory = [
      { date: "2025-11-18", procedure: "Consulta de rotina", professional: pro, notes: "Sem queixas agudas. Higiene regular." },
      { date: "2026-02-09", procedure: "Reavaliação", professional: pro, notes: "Acompanhamento do plano terapêutico." },
      { date: "2026-06-14", procedure: "Controle clínico", professional: pro, notes: "Tecidos moles sem alteração." },
    ].filter((item) => !patient.history.some((entry) => entry.date === item.date));
    const extraConsult = extraHistory.map((item, index) => ({
      date: item.date,
      time: ["09:00", "10:30", "15:00"][index] ?? "09:00",
      procedure: item.procedure,
      professional: pro,
      status: "Concluído" as const,
      notes: item.notes,
    }));
    const extraProc = extraHistory.map((item) => ({
      date: item.date,
      name: item.procedure,
      tooth: "Arcada",
      professional: pro,
      notes: item.notes,
    }));
    const extraPay = patient.payments.length ? [] : [
      { date: patient.lastVisit || "2026-09-01", method: "Pix", amount: Math.min(patient.paid, 200) || 150, status: "Pago" as const },
    ];
    const extraMsg = [
      { date: "2026-09-20", channel: "WhatsApp" as const, summary: "Confirmação de horário e orientação pré-consulta." },
    ].filter((item) => !patient.interactions.some((entry) => entry.summary === item.summary));
    const extraAbsence = patient.absences.length ? [] : [
      { date: "2026-03-04", type: "Cancelamento" as const, procedure: "Consulta", reason: "Imprevisto familiar. Reagendado." },
    ];
    const extraFollow = patient.followUps.length ? [] : [
      { date: "2026-12-10", type: "Manutenção" as const, procedure: "Retorno de manutenção", status: "Agendado" as const },
    ];
    return {
      ...patient,
      history: [...patient.history, ...extraHistory].sort((a, b) => b.date.localeCompare(a.date)),
      consultations: [...patient.consultations, ...extraConsult],
      procedures: [...patient.procedures, ...extraProc],
      treatments: patient.treatments.length >= 2 ? patient.treatments : [
        ...patient.treatments,
        { name: patient.treatment, stage: patient.stage, status: patient.status === "Inativo" ? "Pausado" : "Em andamento", startedAt: patient.lastVisit, professional: pro },
      ],
      quotes: patient.quotes.length >= 2 ? patient.quotes : [
        ...patient.quotes,
        { id: `ORC-${patient.protocol.slice(-3)}-B`, date: "2026-06-14", title: `Manutenção — ${patient.treatment}`, value: 280, status: "Aprovado" },
      ],
      payments: [...patient.payments, ...extraPay],
      interactions: [...patient.interactions, ...extraMsg],
      absences: [...patient.absences, ...extraAbsence],
      followUps: [...patient.followUps, ...extraFollow],
    };
  });
}

export function seedMaintenances(patients: Patient[]): Patient[] {
  return patients.map((patient) => {
    if ((patient.maintenances ?? []).length > 0) return patient;
    const plans: MaintenancePlan[] = [];
    const last = patient.lastVisit || "2026-10-01";
    if (patient.treatment === "Ortodontia" || patient.tagIds.includes("orto")) {
      plans.push({
        id: `man-${patient.protocol}-aparelho`,
        kind: "Aparelho",
        procedure: "Manutenção de aparelho",
        periodicityDays: 30,
        lastDone: last,
        nextDate: addDays(last, 30),
        reminderDays: 3,
        reminderSent: false,
        status: "Ativa",
      });
    }
    if (patient.treatment === "Limpeza" || patient.tagIds.includes("perio")) {
      plans.push({
        id: `man-${patient.protocol}-limpeza`,
        kind: "Limpeza",
        procedure: "Limpeza periódica",
        periodicityDays: 180,
        lastDone: last,
        nextDate: addDays(last, 180),
        reminderDays: 7,
        reminderSent: false,
        status: "Ativa",
      });
    }
    if (patient.treatment === "Avaliação") {
      plans.push({
        id: `man-${patient.protocol}-avaliacao`,
        kind: "Avaliação",
        procedure: "Avaliação periódica",
        periodicityDays: 180,
        lastDone: last,
        nextDate: addDays(last, 180),
        reminderDays: 7,
        reminderSent: false,
        status: "Ativa",
      });
    }
    if (patient.treatment === "Implante" || patient.tagIds.includes("implante")) {
      plans.push({
        id: `man-${patient.protocol}-implante`,
        kind: "Implante",
        procedure: "Acompanhamento de implante",
        periodicityDays: 180,
        lastDone: last,
        nextDate: addDays(last, 180),
        reminderDays: 7,
        reminderSent: false,
        status: "Ativa",
      });
    }
    if (patient.tagIds.includes("protese")) {
      plans.push({
        id: `man-${patient.protocol}-protese`,
        kind: "Prótese",
        procedure: "Acompanhamento de prótese",
        periodicityDays: 180,
        lastDone: last,
        nextDate: addDays(last, 180),
        reminderDays: 7,
        reminderSent: false,
        status: "Ativa",
      });
    }
    if (patient.treatment === "Canal" || patient.treatment === "Clareamento") {
      plans.push({
        id: `man-${patient.protocol}-recorrente`,
        kind: "Recorrente",
        procedure: patient.treatment === "Canal" ? "Revisão endodôntica" : "Revisão de clareamento",
        periodicityDays: 90,
        lastDone: last,
        nextDate: addDays(last, 90),
        reminderDays: 5,
        reminderSent: false,
        status: "Ativa",
      });
    }
    return { ...patient, maintenances: plans };
  });
}

export function visitsOf(patient: Patient) {
  return [...patient.upcoming, ...patient.consultations];
}

export function syncAgendaLinks(patient: Patient): Patient {
  const visits = visitsOf(patient);
  const extraAbsences = patient.absences.filter((item) => (
    !visits.some((visit) => visit.date === item.date && visit.procedure === item.procedure)
  ));
  const extraFollowUps = patient.followUps.filter((item) => (
    !visits.some((visit) => visit.date === item.date && visit.procedure === item.procedure)
  ));
  return {
    ...patient,
    consultations: [
      ...patient.consultations,
      ...extraAbsences.map((item) => ({
        date: item.date,
        time: "09:00",
        procedure: item.procedure,
        professional: patient.responsible,
        status: (item.type === "Falta" ? "Falta" : "Cancelado") as Consultation["status"],
        notes: item.reason,
      })),
    ],
    upcoming: [
      ...patient.upcoming,
      ...extraFollowUps.map((item) => ({
        date: item.date,
        time: "10:00",
        procedure: item.procedure,
        professional: patient.responsible,
        status: (item.status === "Realizado"
          ? "Concluído"
          : item.status === "Atrasado"
            ? "Atrasado"
            : item.type === "Retorno" ? "Retorno" : "Agendado") as Consultation["status"],
        notes: item.type,
      })),
    ],
  };
}

export const initialPatients: Patient[] = [
  {
    protocol: "OZ-0001",
    name: "Ana Beatriz Santos",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    cpf: "391.204.518-22",
    phone: "(11) 98821-1044",
    whatsapp: "(11) 98821-1044",
    email: "ana.santos@email.com",
    birthDate: "1994-03-12",
    address: sp("Rua Harmonia", "412", "Vila Madalena", "05435-000"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["estetica", "clareamento"],
    origin: "Instagram",
    notes: "Prefere contato por WhatsApp no período da tarde. Ansiedade leve em procedimentos longos.",
    treatment: "Avaliação",
    stage: "Triagem",
    funnelStage: "Avaliação",
    responsible: "Dra. Amanda",
    status: "Ativo",
    value: 350,
    paid: 0,
    lastVisit: "2026-10-05",
    nextAction: "Enviar orçamento",
    history: [
      { date: "2026-10-05", procedure: "Avaliação inicial", professional: "Dra. Amanda", notes: "Queixa de sensibilidade. Exames solicitados." },
      { date: "2026-09-02", procedure: "Moldagem para clareamento", professional: "Dra. Amanda", notes: "Moldeira em laboratório." },
      { date: "2026-07-22", procedure: "Profilaxia", professional: "Dra. Amanda", notes: "Gengiva saudável. Orientação de higiene." },
      { date: "2026-04-11", procedure: "Restauração 15", professional: "Dr. Rafael", notes: "Resina em face oclusal. Oclusão ok." },
      { date: "2025-12-03", procedure: "Consulta de rotina", professional: "Dra. Amanda", notes: "Sem cárie ativa. Indicado clareamento." },
    ],
    upcoming: [
      { date: "2026-10-16", time: "14:00", procedure: "Avaliação", professional: "Dra. Amanda", status: "Agendado" },
      { date: "2026-10-20", time: "15:00", procedure: "Retorno da avaliação", professional: "Dra. Amanda", status: "Confirmado" },
      { date: "2026-11-05", time: "10:00", procedure: "1ª sessão de clareamento", professional: "Dra. Amanda", status: "Agendado" },
    ],
    consultations: [
      { date: "2025-12-03", time: "09:30", procedure: "Consulta de rotina", professional: "Dra. Amanda", status: "Concluído" },
      { date: "2026-04-11", time: "11:00", procedure: "Restauração", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-07-22", time: "09:00", procedure: "Profilaxia", professional: "Dra. Amanda", status: "Concluído" },
      { date: "2026-08-03", time: "14:00", procedure: "Limpeza", professional: "Dra. Amanda", status: "Cancelado", notes: "Viagem de trabalho." },
      { date: "2026-09-02", time: "16:30", procedure: "Moldagem", professional: "Dra. Amanda", status: "Concluído" },
      { date: "2026-10-05", time: "16:00", procedure: "Avaliação", professional: "Dra. Amanda", status: "Concluído" },
    ],
    procedures: [
      { date: "2025-12-03", name: "Exame clínico e radiografia bitewing", tooth: "Arcada", professional: "Dra. Amanda", notes: "Sem lesão interproximal." },
      { date: "2026-04-11", name: "Restauração em resina composta", tooth: "15", professional: "Dr. Rafael", notes: "Classe I oclusal." },
      { date: "2026-07-22", name: "Profilaxia e aplicação de flúor", tooth: "Arcada", professional: "Dra. Amanda", notes: "Sem intercorrências." },
      { date: "2026-09-02", name: "Moldagem para moldeira de clareamento", tooth: "Arcada", professional: "Dra. Amanda", notes: "Alginato + modelo em gesso." },
      { date: "2026-10-05", name: "Exame clínico e periapicais", tooth: "15 e 16", professional: "Dra. Amanda", notes: "Sensibilidade ao frio." },
    ],
    treatments: [
      { name: "Avaliação estética", stage: "Triagem", status: "Em andamento", startedAt: "2026-10-05", professional: "Dra. Amanda" },
      { name: "Clareamento", stage: "Orçamento", status: "Pendente", startedAt: "2026-10-05", professional: "Dra. Amanda" },
      { name: "Restauração 15", stage: "Revisão", status: "Concluído", startedAt: "2026-04-11", professional: "Dr. Rafael" },
    ],
    quotes: [
      { id: "ORC-104", date: "2026-10-06", title: "Clareamento em consultório (3 sessões)", value: 1800, status: "Pendente" },
      { id: "ORC-101", date: "2026-09-02", title: "Moldeira + gel de clareamento caseiro", value: 890, status: "Aprovado" },
      { id: "ORC-088", date: "2026-07-22", title: "Profilaxia", value: 220, status: "Aprovado" },
      { id: "ORC-061", date: "2026-04-11", title: "Restauração em resina 15", value: 380, status: "Aprovado" },
    ],
    payments: [
      { date: "2026-04-11", method: "Pix", amount: 380, status: "Pago" },
      { date: "2026-07-22", method: "Pix", amount: 220, status: "Pago" },
      { date: "2026-09-02", method: "Cartão", amount: 890, status: "Pago" },
      { date: "2026-10-20", method: "Cartão", amount: 350, status: "Em aberto" },
    ],
    interactions: [
      { date: "2026-10-12", channel: "E-mail", summary: "Enviado comparativo de clareamento em consultório vs. caseiro." },
      { date: "2026-10-06", channel: "WhatsApp", summary: "Enviado lembrete da avaliação e pedido de fotos intraorais." },
      { date: "2026-10-05", channel: "Presencial", summary: "Orientação sobre clareamento e sensibilidade." },
      { date: "2026-09-12", channel: "WhatsApp", summary: "Lead convertido após anúncio de Instagram." },
      { date: "2026-08-03", channel: "Telefone", summary: "Cancelou limpeza por viagem e reagendou profilaxia." },
    ],
    absences: [
      { date: "2026-08-03", type: "Cancelamento", procedure: "Limpeza", reason: "Viagem de trabalho. Reagendou." },
      { date: "2026-05-19", type: "Falta", procedure: "Revisão da restauração", reason: "Não compareceu. Contato no dia seguinte." },
    ],
    followUps: [
      { date: "2026-10-20", type: "Retorno", procedure: "Retorno da avaliação", status: "Agendado" },
      { date: "2026-11-05", type: "Retorno", procedure: "1ª sessão de clareamento", status: "Agendado" },
      { date: "2027-01-22", type: "Manutenção", procedure: "Profilaxia semestral", status: "Agendado" },
    ],
  },
  {
    protocol: "OZ-0002",
    name: "Carlos Henrique",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    cpf: "284.119.607-91",
    phone: "(11) 99740-2218",
    whatsapp: "(11) 99740-2218",
    email: "carlos.henrique@email.com",
    birthDate: "1981-07-02",
    address: sp("Av. Rebouças", "1208", "Pinheiros", "05402-000"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["urgencia"],
    origin: "Google",
    notes: "Relatou desconforto ao mastigar do lado direito.",
    treatment: "Restauração",
    stage: "Revisão",
    funnelStage: "Orçamento",
    responsible: "Dra. Amanda",
    status: "Aguardando retorno",
    value: 890,
    paid: 890,
    lastVisit: "2026-09-28",
    nextAction: "Agendar revisão",
    history: [
      { date: "2026-09-14", procedure: "Restauração", professional: "Dra. Amanda", notes: "Restauração em resina no dente 16." },
      { date: "2026-09-28", procedure: "Revisão", professional: "Dra. Amanda", notes: "Adaptação boa. Orientado retorno em 30 dias." },
      { date: "2026-03-11", procedure: "Urgência", professional: "Dr. Rafael", notes: "Dor aguda. Restauração provisória." },
    ],
    upcoming: [],
    consultations: [
      { date: "2026-03-11", time: "18:30", procedure: "Urgência", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-09-14", time: "09:00", procedure: "Restauração", professional: "Dra. Amanda", status: "Concluído" },
      { date: "2026-09-28", time: "09:30", procedure: "Revisão", professional: "Dra. Amanda", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-03-11", name: "Restauração provisória", tooth: "16", professional: "Dr. Rafael", notes: "Alívio da dor." },
      { date: "2026-09-14", name: "Restauração em resina", tooth: "16", professional: "Dra. Amanda", notes: "Oclusão ajustada." },
    ],
    treatments: [
      { name: "Restauração 16", stage: "Revisão", status: "Em andamento", startedAt: "2026-09-14", professional: "Dra. Amanda" },
    ],
    quotes: [
      { id: "ORC-091", date: "2026-09-10", title: "Restauração em resina — dente 16", value: 890, status: "Aprovado" },
    ],
    payments: [
      { date: "2026-09-14", method: "Cartão", amount: 890, status: "Pago" },
    ],
    interactions: [
      { date: "2026-09-27", channel: "Telefone", summary: "Confirmou revisão da restauração." },
      { date: "2026-10-12", channel: "WhatsApp", summary: "Pendente agendar retorno de 30 dias." },
    ],
    absences: [],
    followUps: [
      { date: "2026-10-28", type: "Retorno", procedure: "Revisão oclusal", status: "Atrasado" },
    ],
  },
  {
    protocol: "OZ-0003",
    name: "Fernanda Lima",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
    cpf: "512.883.044-60",
    phone: "(11) 98102-7730",
    whatsapp: "(11) 98102-7730",
    email: "fernanda.lima@email.com",
    birthDate: "1990-11-21",
    address: sp("Rua Augusta", "2510", "Jardins", "01412-100"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["perio", "convenio"],
    origin: "Convênio",
    notes: "",
    treatment: "Limpeza",
    stage: "Realizada",
    funnelStage: "Concluído",
    responsible: "Dra. Amanda",
    status: "Ativo",
    value: 180,
    paid: 180,
    lastVisit: "2026-10-05",
    nextAction: "Profilaxia em 6 meses",
    history: [
      { date: "2026-10-05", procedure: "Limpeza", professional: "Dra. Amanda", notes: "Profilaxia concluída sem intercorrências." },
      { date: "2026-04-02", procedure: "Raspagem periodontal", professional: "Dra. Amanda", notes: "Bolsa de 4 mm no 46." },
    ],
    upcoming: [
      { date: "2027-04-05", time: "08:30", procedure: "Profilaxia", professional: "Dra. Amanda", status: "Agendado" },
    ],
    consultations: [
      { date: "2026-04-02", time: "08:00", procedure: "Periodontia", professional: "Dra. Amanda", status: "Concluído" },
      { date: "2026-10-05", time: "08:00", procedure: "Limpeza", professional: "Dra. Amanda", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-04-02", name: "Raspagem subgengival", tooth: "46", professional: "Dra. Amanda", notes: "Sangramento controlado." },
      { date: "2026-10-05", name: "Profilaxia", tooth: "Arcada", professional: "Dra. Amanda", notes: "Manutenção periodontal." },
    ],
    treatments: [
      { name: "Manutenção periodontal", stage: "Realizada", status: "Concluído", startedAt: "2026-04-02", professional: "Dra. Amanda" },
    ],
    quotes: [
      { id: "ORC-077", date: "2026-04-02", title: "Raspagem + profilaxia", value: 480, status: "Aprovado" },
    ],
    payments: [
      { date: "2026-04-02", method: "Convênio", amount: 300, status: "Pago" },
      { date: "2026-10-05", method: "Convênio", amount: 180, status: "Pago" },
    ],
    interactions: [
      { date: "2026-10-04", channel: "E-mail", summary: "Lembrete automático da profilaxia." },
    ],
    absences: [
      { date: "2026-10-16", type: "Cancelamento", procedure: "Retoque de limpeza", reason: "Conflito de agenda." },
    ],
    followUps: [
      { date: "2027-04-05", type: "Manutenção", procedure: "Profilaxia", status: "Agendado" },
    ],
  },
  {
    protocol: "OZ-0004",
    name: "João Pedro Silva",
    photo: "https://randomuser.me/api/portraits/men/52.jpg",
    cpf: "147.662.309-55",
    phone: "(11) 99215-4481",
    whatsapp: "(11) 99215-4481",
    email: "joao.silva@email.com",
    birthDate: "1988-01-30",
    address: sp("Rua Girassol", "88", "Vila Madalena", "05433-000"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["implante", "protese", "vip"],
    origin: "Indicação",
    notes: "Implante na região do 36. Acompanhar cicatrização.",
    treatment: "Implante",
    stage: "Osseointegração",
    funnelStage: "Em tratamento",
    responsible: "Dr. Rafael",
    status: "Em tratamento",
    value: 8500,
    paid: 4000,
    lastVisit: "2026-10-02",
    nextAction: "Definir próximo atendimento",
    history: [
      { date: "2026-08-10", procedure: "Planejamento", professional: "Dr. Rafael", notes: "Tomografia analisada. Plano de implante unitário." },
      { date: "2026-08-18", procedure: "Cirurgia de implante", professional: "Dr. Rafael", notes: "Implante instalado. Receituário entregue." },
      { date: "2026-10-02", procedure: "Controle", professional: "Dr. Rafael", notes: "Cicatrização dentro do esperado." },
    ],
    upcoming: [],
    consultations: [
      { date: "2026-08-10", time: "14:00", procedure: "Planejamento", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-08-18", time: "08:00", procedure: "Cirurgia", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-10-02", time: "14:30", procedure: "Controle", professional: "Dr. Rafael", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-08-18", name: "Instalação de implante", tooth: "36", professional: "Dr. Rafael", notes: "Torque 35 Ncm." },
      { date: "2026-10-02", name: "Controle de osseointegração", tooth: "36", professional: "Dr. Rafael", notes: "Sem mobilidade." },
    ],
    treatments: [
      { name: "Implante 36", stage: "Osseointegração", status: "Em andamento", startedAt: "2026-08-18", professional: "Dr. Rafael" },
      { name: "Prótese sobre implante", stage: "Planejamento", status: "Pendente", startedAt: "2026-08-18", professional: "Dr. Rafael" },
    ],
    quotes: [
      { id: "ORC-061", date: "2026-08-10", title: "Implante + coroa metalocerâmica", value: 8500, status: "Aprovado" },
      { id: "ORC-062", date: "2026-08-10", title: "Enxerto ósseo (opcional)", value: 2200, status: "Recusado" },
    ],
    payments: [
      { date: "2026-08-18", method: "Transferência", amount: 4000, status: "Pago" },
      { date: "2026-11-18", method: "Boleto", amount: 2250, status: "Em aberto" },
      { date: "2026-12-18", method: "Boleto", amount: 2250, status: "Em aberto" },
    ],
    interactions: [
      { date: "2026-10-02", channel: "Presencial", summary: "Explicado prazo de osseointegração (3 a 4 meses)." },
      { date: "2026-09-01", channel: "WhatsApp", summary: "Paciente enviou foto da cicatrização. Sem sinais de infecção." },
    ],
    absences: [],
    followUps: [
      { date: "2026-12-02", type: "Retorno", procedure: "Controle de implante", status: "Agendado" },
    ],
  },
  {
    protocol: "OZ-0005",
    name: "Luciana Prado",
    photo: "https://randomuser.me/api/portraits/women/21.jpg",
    cpf: "408.771.256-03",
    phone: "(11) 99633-0192",
    whatsapp: "(11) 99633-0192",
    email: "luciana.prado@email.com",
    birthDate: "1996-05-18",
    address: sp("Rua Fradique Coutinho", "955", "Pinheiros", "05416-010"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["orto"],
    origin: "Indicação",
    notes: "Usa aparelho fixo. Manutenção mensal.",
    treatment: "Ortodontia",
    stage: "Manutenção",
    funnelStage: "Tratamento iniciado",
    responsible: "Dr. Rafael",
    status: "Em tratamento",
    value: 6200,
    paid: 3100,
    lastVisit: "2026-09-20",
    nextAction: "Troca de arco",
    history: [
      { date: "2026-06-12", procedure: "Instalação", professional: "Dr. Rafael", notes: "Aparelho fixo superior e inferior." },
      { date: "2026-09-20", procedure: "Manutenção ortodôntica", professional: "Dr. Rafael", notes: "Troca de ligaduras. Próxima etapa: arco superior." },
    ],
    upcoming: [
      { date: "2026-10-16", time: "11:00", procedure: "Manutenção", professional: "Dr. Rafael", status: "Confirmado" },
      { date: "2026-10-22", time: "11:00", procedure: "Manutenção", professional: "Dr. Rafael", status: "Agendado" },
    ],
    consultations: [
      { date: "2026-06-12", time: "11:00", procedure: "Instalação", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-07-15", time: "11:00", procedure: "Manutenção", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-08-18", time: "11:00", procedure: "Manutenção", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-09-20", time: "11:00", procedure: "Manutenção", professional: "Dr. Rafael", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-06-12", name: "Colagem de bráquetes", tooth: "Arcada", professional: "Dr. Rafael", notes: "Sistema autoligado." },
      { date: "2026-09-20", name: "Troca de ligaduras", tooth: "Arcada", professional: "Dr. Rafael", notes: "Arco 016 NiTi." },
    ],
    treatments: [
      { name: "Ortodontia fixa", stage: "Manutenção", status: "Em andamento", startedAt: "2026-06-12", professional: "Dr. Rafael" },
    ],
    quotes: [
      { id: "ORC-055", date: "2026-05-20", title: "Ortodontia completa (24 meses)", value: 6200, status: "Aprovado" },
    ],
    payments: [
      { date: "2026-06-12", method: "Cartão", amount: 1550, status: "Pago" },
      { date: "2026-07-12", method: "Cartão", amount: 1550, status: "Pago" },
      { date: "2026-10-12", method: "Cartão", amount: 1550, status: "Atrasado" },
    ],
    interactions: [
      { date: "2026-10-10", channel: "WhatsApp", summary: "Confirmou manutenção e perguntou sobre elásticos." },
    ],
    absences: [
      { date: "2026-10-16", type: "Falta", procedure: "Manutenção 09:00", reason: "Atraso. Remarcado para 11:00." },
    ],
    followUps: [
      { date: "2026-10-22", type: "Manutenção", procedure: "Manutenção mensal", status: "Agendado" },
    ],
  },
  {
    protocol: "OZ-0006",
    name: "Maria Oliveira",
    photo: "https://randomuser.me/api/portraits/women/12.jpg",
    cpf: "229.450.871-40",
    phone: "(11) 98477-3306",
    whatsapp: "(11) 98477-3306",
    email: "maria.oliveira@email.com",
    birthDate: "1979-09-09",
    address: sp("Rua dos Pinheiros", "1489", "Pinheiros", "05422-002"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["clareamento", "estetica"],
    origin: "Campanha da clínica",
    notes: "Sensibilidade leve após a segunda sessão.",
    treatment: "Clareamento",
    stage: "Sessão 2",
    funnelStage: "Aguardando aprovação",
    responsible: "Dra. Amanda",
    status: "Em tratamento",
    value: 1400,
    paid: 700,
    lastVisit: "2026-10-05",
    nextAction: "Confirmar sessão 3",
    history: [
      { date: "2026-09-20", procedure: "Sessão 1 de clareamento", professional: "Dra. Amanda", notes: "Início do protocolo. Sem queixas." },
      { date: "2026-10-05", procedure: "Sessão 2 de clareamento", professional: "Dra. Amanda", notes: "Sensibilidade leve." },
    ],
    upcoming: [
      { date: "2026-10-19", time: "10:00", procedure: "Sessão 3 de clareamento", professional: "Dra. Amanda", status: "Confirmado" },
    ],
    consultations: [
      { date: "2026-09-20", time: "09:30", procedure: "Clareamento", professional: "Dra. Amanda", status: "Concluído" },
      { date: "2026-10-05", time: "10:00", procedure: "Clareamento", professional: "Dra. Amanda", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-09-20", name: "Clareamento em consultório", tooth: "Arcada", professional: "Dra. Amanda", notes: "Gel 35%." },
      { date: "2026-10-05", name: "Clareamento em consultório", tooth: "Arcada", professional: "Dra. Amanda", notes: "Dessensibilizante aplicado." },
    ],
    treatments: [
      { name: "Clareamento", stage: "Sessão 2", status: "Em andamento", startedAt: "2026-09-20", professional: "Dra. Amanda" },
    ],
    quotes: [
      { id: "ORC-099", date: "2026-09-10", title: "Clareamento 3 sessões", value: 1400, status: "Aprovado" },
      { id: "ORC-100", date: "2026-10-05", title: "Lentes nos incisivos", value: 9600, status: "Pendente" },
    ],
    payments: [
      { date: "2026-09-20", method: "Pix", amount: 700, status: "Pago" },
      { date: "2026-10-19", method: "Pix", amount: 700, status: "Em aberto" },
    ],
    interactions: [
      { date: "2026-10-06", channel: "WhatsApp", summary: "Enviado protocolo de dessensibilizante caseiro." },
    ],
    absences: [],
    followUps: [
      { date: "2026-10-19", type: "Retorno", procedure: "Sessão 3", status: "Agendado" },
    ],
  },
  {
    protocol: "OZ-0007",
    name: "Roberto Alves",
    photo: "https://randomuser.me/api/portraits/men/76.jpg",
    cpf: "063.918.442-17",
    phone: "(11) 99108-5520",
    whatsapp: "(11) 99108-5520",
    email: "roberto.alves@email.com",
    birthDate: "1972-12-03",
    address: sp("Av. Paulista", "1578", "Bela Vista", "01310-200"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["endo"],
    origin: "Google",
    notes: "Tratamento de canal concluído. Paciente sem retorno recente.",
    treatment: "Canal",
    stage: "Acompanhamento",
    funnelStage: "Retorno",
    responsible: "Dr. Rafael",
    status: "Inativo",
    value: 1600,
    paid: 1600,
    lastVisit: "2026-08-12",
    nextAction: "Sem retorno previsto",
    history: [
      { date: "2026-07-08", procedure: "Abertura e instrumentação", professional: "Dr. Rafael", notes: "Canal do dente 26 iniciado." },
      { date: "2026-08-12", procedure: "Obturação", professional: "Dr. Rafael", notes: "Tratamento finalizado." },
    ],
    upcoming: [],
    consultations: [
      { date: "2026-07-08", time: "09:00", procedure: "Canal", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-08-12", time: "09:00", procedure: "Obturação", professional: "Dr. Rafael", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-07-08", name: "Abertura coronária", tooth: "26", professional: "Dr. Rafael", notes: "3 canais localizados." },
      { date: "2026-08-12", name: "Obturação endodôntica", tooth: "26", professional: "Dr. Rafael", notes: "Cimento AH Plus." },
    ],
    treatments: [
      { name: "Endodontia 26", stage: "Acompanhamento", status: "Concluído", startedAt: "2026-07-08", professional: "Dr. Rafael" },
      { name: "Coroa provisória", stage: "Pendente", status: "Pendente", startedAt: "2026-08-12", professional: "Dr. Rafael" },
    ],
    quotes: [
      { id: "ORC-040", date: "2026-07-08", title: "Tratamento de canal 26", value: 1600, status: "Aprovado" },
      { id: "ORC-041", date: "2026-08-12", title: "Coroa cerâmica 26", value: 2100, status: "Expirado" },
    ],
    payments: [
      { date: "2026-07-08", method: "Pix", amount: 800, status: "Pago" },
      { date: "2026-08-12", method: "Pix", amount: 800, status: "Pago" },
    ],
    interactions: [
      { date: "2026-09-15", channel: "Telefone", summary: "Não atendeu. Mensagem de retorno da coroa." },
      { date: "2026-10-01", channel: "WhatsApp", summary: "Sem resposta há 17 dias." },
    ],
    absences: [
      { date: "2026-09-20", type: "Falta", procedure: "Prova de coroa", reason: "Não compareceu e não avisou." },
    ],
    followUps: [
      { date: "2026-09-20", type: "Retorno", procedure: "Prova de coroa", status: "Atrasado" },
    ],
  },
  {
    protocol: "OZ-0008",
    name: "Miguel Santos Costa",
    photo: "https://randomuser.me/api/portraits/lego/2.jpg",
    cpf: "000.000.000-00",
    phone: "(11) 98821-1044",
    whatsapp: "(11) 98821-1044",
    email: "ana.santos@email.com",
    birthDate: "2015-04-08",
    address: sp("Rua Harmonia", "412", "Vila Madalena", "05435-000"),
    hasGuardian: true,
    guardian: { name: "Ana Beatriz Santos", kinship: "Mãe", phone: "(11) 98821-1044", cpf: "391.204.518-22" },
    tagIds: ["pedo"],
    origin: "Indicação",
    notes: "Primeira consulta odontopediátrica. Colaborou bem.",
    treatment: "Avaliação",
    stage: "Triagem",
    funnelStage: "Avaliação",
    responsible: "Dra. Amanda",
    status: "Ativo",
    value: 280,
    paid: 280,
    lastVisit: "2026-10-10",
    nextAction: "Selantes nos molares",
    history: [
      { date: "2026-10-10", procedure: "Avaliação infantil", professional: "Dra. Amanda", notes: "Dentição mista. Higiene regular." },
    ],
    upcoming: [
      { date: "2026-11-05", time: "15:00", procedure: "Selantes", professional: "Dra. Amanda", status: "Agendado" },
    ],
    consultations: [
      { date: "2026-10-10", time: "15:00", procedure: "Avaliação infantil", professional: "Dra. Amanda", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-10-10", name: "Exame clínico infantil", tooth: "Arcada", professional: "Dra. Amanda", notes: "Sem cárie ativa." },
    ],
    treatments: [
      { name: "Odontopediatria", stage: "Triagem", status: "Em andamento", startedAt: "2026-10-10", professional: "Dra. Amanda" },
      { name: "Selantes", stage: "Agendada", status: "Pendente", startedAt: "2026-10-10", professional: "Dra. Amanda" },
    ],
    quotes: [
      { id: "ORC-112", date: "2026-10-10", title: "Selantes oclusais (4 molares)", value: 480, status: "Pendente" },
    ],
    payments: [
      { date: "2026-10-10", method: "Pix", amount: 280, status: "Pago" },
    ],
    interactions: [
      { date: "2026-10-10", channel: "Presencial", summary: "Orientação de higiene para a mãe." },
    ],
    absences: [],
    followUps: [
      { date: "2026-11-05", type: "Retorno", procedure: "Selantes", status: "Agendado" },
    ],
  },
  {
    protocol: "OZ-0009",
    name: "Helena Moreira",
    photo: "https://randomuser.me/api/portraits/women/90.jpg",
    cpf: "018.224.659-08",
    phone: "(11) 97300-4412",
    whatsapp: "(11) 97300-4412",
    email: "helena.moreira@email.com",
    birthDate: "1948-02-14",
    address: sp("Rua Teodoro Sampaio", "1020", "Pinheiros", "05406-050"),
    hasGuardian: true,
    guardian: { name: "Paulo Moreira", kinship: "Filho", phone: "(11) 99912-3344", cpf: "301.552.889-10" },
    tagIds: ["protese", "convenio"],
    origin: "Convênio",
    notes: "Usa prótese parcial. Pressão alta controlada. Avisar responsável em procedimentos longos.",
    treatment: "Implante",
    stage: "Planejamento",
    funnelStage: "Orçamento",
    responsible: "Dr. Rafael",
    status: "Aguardando retorno",
    value: 12000,
    paid: 0,
    lastVisit: "2026-09-30",
    nextAction: "Aguardar aprovação do orçamento",
    history: [
      { date: "2026-09-30", procedure: "Avaliação protética", professional: "Dr. Rafael", notes: "Candidata a overdenture sobre 2 implantes." },
    ],
    upcoming: [],
    consultations: [
      { date: "2026-09-30", time: "10:00", procedure: "Avaliação protética", professional: "Dr. Rafael", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-09-30", name: "Moldagem de estudo", tooth: "Arcada inferior", professional: "Dr. Rafael", notes: "Alginato." },
    ],
    treatments: [
      { name: "Overdenture", stage: "Planejamento", status: "Pendente", startedAt: "2026-09-30", professional: "Dr. Rafael" },
    ],
    quotes: [
      { id: "ORC-108", date: "2026-10-01", title: "2 implantes + overdenture", value: 12000, status: "Pendente" },
    ],
    payments: [
      { date: "2026-11-01", method: "Convênio + particular", amount: 12000, status: "Em aberto" },
    ],
    interactions: [
      { date: "2026-10-02", channel: "Telefone", summary: "Filho pediu orçamento detalhado por e-mail." },
      { date: "2026-10-03", channel: "E-mail", summary: "PDF do plano cirúrgico enviado." },
    ],
    absences: [],
    followUps: [
      { date: "2026-10-25", type: "Retorno", procedure: "Discussão do plano", status: "Agendado" },
    ],
  },
  {
    protocol: "OZ-0010",
    name: "Thiago Mendes",
    photo: "https://randomuser.me/api/portraits/men/11.jpg",
    cpf: "455.102.778-33",
    phone: "(11) 98765-2210",
    whatsapp: "(11) 98765-2210",
    email: "thiago.mendes@email.com",
    birthDate: "1992-08-25",
    address: sp("Rua Aspicuelta", "233", "Vila Madalena", "05433-010"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["estetica"],
    origin: "Facebook",
    notes: "Não retorna desde a avaliação de lentes.",
    treatment: "Avaliação",
    stage: "Concluída",
    funnelStage: "Aguardando aprovação",
    responsible: "Dra. Amanda",
    status: "Inativo",
    value: 7800,
    paid: 0,
    lastVisit: "2026-05-18",
    nextAction: "Reativar contato",
    history: [
      { date: "2026-05-18", procedure: "Avaliação de lentes", professional: "Dra. Amanda", notes: "Deseja 8 lentes. Pediu prazo para decidir." },
    ],
    upcoming: [],
    consultations: [
      { date: "2026-05-18", time: "17:00", procedure: "Avaliação estética", professional: "Dra. Amanda", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-05-18", name: "Ensaio digital do sorriso", tooth: "11-22", professional: "Dra. Amanda", notes: "Mock-up apresentado." },
    ],
    treatments: [
      { name: "Lentes de contato", stage: "Orçamento", status: "Pausado", startedAt: "2026-05-18", professional: "Dra. Amanda" },
    ],
    quotes: [
      { id: "ORC-033", date: "2026-05-18", title: "8 lentes em dissilicato", value: 7800, status: "Expirado" },
    ],
    payments: [],
    interactions: [
      { date: "2026-06-02", channel: "WhatsApp", summary: "Follow-up do orçamento. Visualizado, sem resposta." },
      { date: "2026-07-10", channel: "E-mail", summary: "Campanha de reativação enviada." },
    ],
    absences: [
      { date: "2026-06-20", type: "Cancelamento", procedure: "Prova de mock-up", reason: "Desistiu temporariamente." },
    ],
    followUps: [],
  },
  {
    protocol: "OZ-0011",
    name: "Patrícia Nogueira",
    photo: "https://randomuser.me/api/portraits/women/36.jpg",
    cpf: "612.330.194-77",
    phone: "(11) 99551-8088",
    whatsapp: "(11) 99551-8088",
    email: "patricia.nogueira@email.com",
    birthDate: "1985-06-03",
    address: sp("Rua Fidalga", "540", "Pinheiros", "05432-000"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["endo", "urgencia"],
    origin: "WhatsApp",
    notes: "Dor residual após canal. Parcelamento em atraso.",
    treatment: "Canal",
    stage: "Acompanhamento",
    funnelStage: "Retorno",
    responsible: "Dr. Rafael",
    status: "Em tratamento",
    value: 1950,
    paid: 650,
    lastVisit: "2026-10-08",
    nextAction: "Cobrar parcela em aberto",
    history: [
      { date: "2026-09-22", procedure: "Urgência endodôntica", professional: "Dr. Rafael", notes: "Pulpite no 15. Medicação intracanal." },
      { date: "2026-10-08", procedure: "Obturação", professional: "Dr. Rafael", notes: "Canal finalizado. Restauração provisória." },
    ],
    upcoming: [
      { date: "2026-10-29", time: "16:00", procedure: "Restauração definitiva", professional: "Dra. Amanda", status: "Agendado" },
    ],
    consultations: [
      { date: "2026-09-22", time: "19:00", procedure: "Urgência", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-10-08", time: "16:00", procedure: "Canal", professional: "Dr. Rafael", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-09-22", name: "Pulpectomia", tooth: "15", professional: "Dr. Rafael", notes: "Alívio imediato." },
      { date: "2026-10-08", name: "Obturação", tooth: "15", professional: "Dr. Rafael", notes: "Radiografia final ok." },
    ],
    treatments: [
      { name: "Endodontia 15", stage: "Acompanhamento", status: "Em andamento", startedAt: "2026-09-22", professional: "Dr. Rafael" },
      { name: "Restauração definitiva", stage: "Agendada", status: "Pendente", startedAt: "2026-10-08", professional: "Dra. Amanda" },
    ],
    quotes: [
      { id: "ORC-110", date: "2026-09-22", title: "Canal + restauração 15", value: 1950, status: "Aprovado" },
    ],
    payments: [
      { date: "2026-09-22", method: "Pix", amount: 650, status: "Pago" },
      { date: "2026-10-08", method: "Boleto", amount: 650, status: "Atrasado" },
      { date: "2026-11-08", method: "Boleto", amount: 650, status: "Em aberto" },
    ],
    interactions: [
      { date: "2026-10-15", channel: "WhatsApp", summary: "Lembrete da parcela vencida." },
    ],
    absences: [],
    followUps: [
      { date: "2026-10-29", type: "Retorno", procedure: "Restauração definitiva", status: "Agendado" },
    ],
  },
  {
    protocol: "OZ-0012",
    name: "Bruno Ferreira",
    photo: "https://randomuser.me/api/portraits/men/85.jpg",
    cpf: "773.201.448-09",
    phone: "(11) 97640-1199",
    whatsapp: "(11) 97640-1199",
    email: "bruno.ferreira@email.com",
    birthDate: "1998-01-19",
    address: sp("Rua Wisard", "149", "Vila Madalena", "05434-000"),
    hasGuardian: false,
    guardian: null,
    tagIds: ["implante"],
    origin: "Passante",
    notes: "Quer extração do siso e depois implante. Tratamento ainda não iniciado.",
    treatment: "Implante",
    stage: "Planejamento",
    funnelStage: "Orçamento",
    responsible: "Dr. Rafael",
    status: "Ativo",
    value: 4200,
    paid: 0,
    lastVisit: "2026-10-14",
    nextAction: "Agendar extração do 38",
    history: [
      { date: "2026-10-14", procedure: "Avaliação de siso", professional: "Dr. Rafael", notes: "38 semi-incluso. Plano: extração e implante posterior." },
    ],
    upcoming: [],
    consultations: [
      { date: "2026-10-14", time: "18:00", procedure: "Avaliação", professional: "Dr. Rafael", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-10-14", name: "Radiografia panorâmica", tooth: "38", professional: "Dr. Rafael", notes: "Proximidade com canal mandibular." },
    ],
    treatments: [
      { name: "Extração 38", stage: "Planejamento", status: "Pendente", startedAt: "2026-10-14", professional: "Dr. Rafael" },
      { name: "Implante 38", stage: "Planejamento", status: "Pendente", startedAt: "2026-10-14", professional: "Dr. Rafael" },
    ],
    quotes: [
      { id: "ORC-115", date: "2026-10-14", title: "Extração + implante 38", value: 4200, status: "Pendente" },
    ],
    payments: [
      { date: "2026-10-14", method: "A definir", amount: 4200, status: "Em aberto" },
    ],
    interactions: [
      { date: "2026-10-14", channel: "Presencial", summary: "Entrou como passante após dor no siso." },
      { date: "2026-10-15", channel: "WhatsApp", summary: "Enviado orçamento e cuidados pré-cirúrgicos." },
    ],
    absences: [],
    followUps: [],
  },
];
