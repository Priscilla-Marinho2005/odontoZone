export const treatments = ["Avaliação", "Limpeza", "Clareamento", "Restauração", "Canal", "Implante", "Ortodontia"] as const;
export const responsibles = ["Dra. Priscila", "Dr. Rafael"] as const;
export const clinicUsers = ["Dra. Priscila", "Dr. Rafael", "Recepção", "Financeiro"] as const;
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
  { id: "task-1", title: "Confirmar sessão 3 de clareamento", date: "2026-10-19", time: "09:00", patientProtocol: "OZ-0006", assignee: "Dra. Priscila", notes: "Ligar pela manhã.", done: false },
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
  status?: "Agendado" | "Confirmado" | "Em atendimento" | "Concluído" | "Atrasado" | "Cancelado" | "Retorno" | "Falta";
  notes?: string;
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

export type Quote = {
  id: string;
  date: string;
  title: string;
  value: number;
  status: "Aprovado" | "Pendente" | "Recusado" | "Expirado";
};

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
  status: "Agendado" | "Realizado" | "Atrasado";
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
});

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
    responsible: "Dra. Priscila",
    status: "Ativo",
    value: 350,
    paid: 0,
    lastVisit: "2026-10-05",
    nextAction: "Enviar orçamento",
    history: [
      { date: "2026-10-05", procedure: "Avaliação inicial", professional: "Dra. Priscila", notes: "Queixa de sensibilidade. Exames solicitados." },
      { date: "2026-07-22", procedure: "Profilaxia", professional: "Dra. Priscila", notes: "Gengiva saudável. Orientação de higiene." },
    ],
    upcoming: [
      { date: "2026-10-16", time: "14:00", procedure: "Avaliação", professional: "Dra. Priscila", status: "Agendado" },
      { date: "2026-10-20", time: "15:00", procedure: "Retorno da avaliação", professional: "Dra. Priscila", status: "Confirmado" },
    ],
    consultations: [
      { date: "2026-07-22", time: "09:00", procedure: "Profilaxia", professional: "Dra. Priscila", status: "Concluído" },
      { date: "2026-10-05", time: "16:00", procedure: "Avaliação", professional: "Dra. Priscila", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-07-22", name: "Profilaxia e aplicação de flúor", tooth: "Arcada", professional: "Dra. Priscila", notes: "Sem intercorrências." },
      { date: "2026-10-05", name: "Exame clínico e periapicais", tooth: "15 e 16", professional: "Dra. Priscila", notes: "Sensibilidade ao frio." },
    ],
    treatments: [
      { name: "Avaliação estética", stage: "Triagem", status: "Em andamento", startedAt: "2026-10-05", professional: "Dra. Priscila" },
      { name: "Clareamento", stage: "Orçamento", status: "Pendente", startedAt: "2026-10-05", professional: "Dra. Priscila" },
    ],
    quotes: [
      { id: "ORC-104", date: "2026-10-06", title: "Clareamento em consultório (3 sessões)", value: 1800, status: "Pendente" },
      { id: "ORC-088", date: "2026-07-22", title: "Profilaxia", value: 220, status: "Aprovado" },
    ],
    payments: [
      { date: "2026-07-22", method: "Pix", amount: 220, status: "Pago" },
      { date: "2026-10-20", method: "Cartão", amount: 350, status: "Em aberto" },
    ],
    interactions: [
      { date: "2026-10-06", channel: "WhatsApp", summary: "Enviado lembrete da avaliação e pedido de fotos intraorais." },
      { date: "2026-10-05", channel: "Presencial", summary: "Orientação sobre clareamento e sensibilidade." },
      { date: "2026-09-12", channel: "WhatsApp", summary: "Lead convertido após anúncio de Instagram." },
    ],
    absences: [
      { date: "2026-08-03", type: "Cancelamento", procedure: "Limpeza", reason: "Viagem de trabalho. Reagendou." },
    ],
    followUps: [
      { date: "2026-10-20", type: "Retorno", procedure: "Retorno da avaliação", status: "Agendado" },
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
    responsible: "Dra. Priscila",
    status: "Aguardando retorno",
    value: 890,
    paid: 890,
    lastVisit: "2026-09-28",
    nextAction: "Agendar revisão",
    history: [
      { date: "2026-09-14", procedure: "Restauração", professional: "Dra. Priscila", notes: "Restauração em resina no dente 16." },
      { date: "2026-09-28", procedure: "Revisão", professional: "Dra. Priscila", notes: "Adaptação boa. Orientado retorno em 30 dias." },
      { date: "2026-03-11", procedure: "Urgência", professional: "Dr. Rafael", notes: "Dor aguda. Restauração provisória." },
    ],
    upcoming: [],
    consultations: [
      { date: "2026-03-11", time: "18:30", procedure: "Urgência", professional: "Dr. Rafael", status: "Concluído" },
      { date: "2026-09-14", time: "09:00", procedure: "Restauração", professional: "Dra. Priscila", status: "Concluído" },
      { date: "2026-09-28", time: "09:30", procedure: "Revisão", professional: "Dra. Priscila", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-03-11", name: "Restauração provisória", tooth: "16", professional: "Dr. Rafael", notes: "Alívio da dor." },
      { date: "2026-09-14", name: "Restauração em resina", tooth: "16", professional: "Dra. Priscila", notes: "Oclusão ajustada." },
    ],
    treatments: [
      { name: "Restauração 16", stage: "Revisão", status: "Em andamento", startedAt: "2026-09-14", professional: "Dra. Priscila" },
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
    responsible: "Dra. Priscila",
    status: "Ativo",
    value: 180,
    paid: 180,
    lastVisit: "2026-10-05",
    nextAction: "Profilaxia em 6 meses",
    history: [
      { date: "2026-10-05", procedure: "Limpeza", professional: "Dra. Priscila", notes: "Profilaxia concluída sem intercorrências." },
      { date: "2026-04-02", procedure: "Raspagem periodontal", professional: "Dra. Priscila", notes: "Bolsa de 4 mm no 46." },
    ],
    upcoming: [
      { date: "2027-04-05", time: "08:30", procedure: "Profilaxia", professional: "Dra. Priscila", status: "Agendado" },
    ],
    consultations: [
      { date: "2026-04-02", time: "08:00", procedure: "Periodontia", professional: "Dra. Priscila", status: "Concluído" },
      { date: "2026-10-05", time: "08:00", procedure: "Limpeza", professional: "Dra. Priscila", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-04-02", name: "Raspagem subgengival", tooth: "46", professional: "Dra. Priscila", notes: "Sangramento controlado." },
      { date: "2026-10-05", name: "Profilaxia", tooth: "Arcada", professional: "Dra. Priscila", notes: "Manutenção periodontal." },
    ],
    treatments: [
      { name: "Manutenção periodontal", stage: "Realizada", status: "Concluído", startedAt: "2026-04-02", professional: "Dra. Priscila" },
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
    responsible: "Dra. Priscila",
    status: "Em tratamento",
    value: 1400,
    paid: 700,
    lastVisit: "2026-10-05",
    nextAction: "Confirmar sessão 3",
    history: [
      { date: "2026-09-20", procedure: "Sessão 1 de clareamento", professional: "Dra. Priscila", notes: "Início do protocolo. Sem queixas." },
      { date: "2026-10-05", procedure: "Sessão 2 de clareamento", professional: "Dra. Priscila", notes: "Sensibilidade leve." },
    ],
    upcoming: [
      { date: "2026-10-19", time: "10:00", procedure: "Sessão 3 de clareamento", professional: "Dra. Priscila", status: "Confirmado" },
    ],
    consultations: [
      { date: "2026-09-20", time: "09:30", procedure: "Clareamento", professional: "Dra. Priscila", status: "Concluído" },
      { date: "2026-10-05", time: "10:00", procedure: "Clareamento", professional: "Dra. Priscila", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-09-20", name: "Clareamento em consultório", tooth: "Arcada", professional: "Dra. Priscila", notes: "Gel 35%." },
      { date: "2026-10-05", name: "Clareamento em consultório", tooth: "Arcada", professional: "Dra. Priscila", notes: "Dessensibilizante aplicado." },
    ],
    treatments: [
      { name: "Clareamento", stage: "Sessão 2", status: "Em andamento", startedAt: "2026-09-20", professional: "Dra. Priscila" },
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
    responsible: "Dra. Priscila",
    status: "Ativo",
    value: 280,
    paid: 280,
    lastVisit: "2026-10-10",
    nextAction: "Selantes nos molares",
    history: [
      { date: "2026-10-10", procedure: "Avaliação infantil", professional: "Dra. Priscila", notes: "Dentição mista. Higiene regular." },
    ],
    upcoming: [
      { date: "2026-11-05", time: "15:00", procedure: "Selantes", professional: "Dra. Priscila", status: "Agendado" },
    ],
    consultations: [
      { date: "2026-10-10", time: "15:00", procedure: "Avaliação infantil", professional: "Dra. Priscila", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-10-10", name: "Exame clínico infantil", tooth: "Arcada", professional: "Dra. Priscila", notes: "Sem cárie ativa." },
    ],
    treatments: [
      { name: "Odontopediatria", stage: "Triagem", status: "Em andamento", startedAt: "2026-10-10", professional: "Dra. Priscila" },
      { name: "Selantes", stage: "Agendada", status: "Pendente", startedAt: "2026-10-10", professional: "Dra. Priscila" },
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
    responsible: "Dra. Priscila",
    status: "Inativo",
    value: 7800,
    paid: 0,
    lastVisit: "2026-05-18",
    nextAction: "Reativar contato",
    history: [
      { date: "2026-05-18", procedure: "Avaliação de lentes", professional: "Dra. Priscila", notes: "Deseja 8 lentes. Pediu prazo para decidir." },
    ],
    upcoming: [],
    consultations: [
      { date: "2026-05-18", time: "17:00", procedure: "Avaliação estética", professional: "Dra. Priscila", status: "Concluído" },
    ],
    procedures: [
      { date: "2026-05-18", name: "Ensaio digital do sorriso", tooth: "11-22", professional: "Dra. Priscila", notes: "Mock-up apresentado." },
    ],
    treatments: [
      { name: "Lentes de contato", stage: "Orçamento", status: "Pausado", startedAt: "2026-05-18", professional: "Dra. Priscila" },
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
      { date: "2026-10-29", time: "16:00", procedure: "Restauração definitiva", professional: "Dra. Priscila", status: "Agendado" },
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
      { name: "Restauração definitiva", stage: "Agendada", status: "Pendente", startedAt: "2026-10-08", professional: "Dra. Priscila" },
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
