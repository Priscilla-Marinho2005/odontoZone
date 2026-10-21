import type { ClinicUser, Patient } from "./clinicPatients";
import { clinicUsers } from "./clinicPatients";

export const documentCategories = ["Documento", "Exame", "Radiografia", "Imagem", "Outro"] as const;
export type DocumentCategory = (typeof documentCategories)[number];

export type ChartAction =
  | "viewClinical"
  | "editAnamnesis"
  | "editEvolution"
  | "viewDocuments"
  | "manageDocuments"
  | "manageAccess";

export type ChartPermission = Record<ChartAction, boolean>;

export type CustomField = { id: string; label: string; value: string };

export type AnamnesisVersion = {
  id: string;
  savedAt: string;
  author: ClinicUser;
  medicalHistory: string;
  allergies: string[];
  medications: string[];
  conditions: string;
  observations: string;
  customFields: CustomField[];
};

export type EvolutionChange = {
  at: string;
  author: ClinicUser;
  summary: string;
};

export type EvolutionEntry = {
  id: string;
  date: string;
  author: ClinicUser;
  visitDate: string;
  visitTime: string;
  visitProcedure: string;
  diagnosis: string;
  proceduresDone: string;
  observations: string;
  changes: EvolutionChange[];
};

export type PatientDocument = {
  id: string;
  name: string;
  category: DocumentCategory;
  uploadedAt: string;
  uploadedBy: ClinicUser;
  note: string;
  dataUrl: string;
  mime: string;
  allowedUsers: ClinicUser[];
};

export type ChartAudit = {
  id: string;
  at: string;
  user: ClinicUser;
  action: string;
};

export type ClinicalChart = {
  anamnesis: AnamnesisVersion[];
  evolutions: EvolutionEntry[];
  documents: PatientDocument[];
  permissions: Partial<Record<ClinicUser, ChartPermission>>;
  audit: ChartAudit[];
};

export const emptyAnamnesis = (author: ClinicUser): AnamnesisVersion => ({
  id: `anm-${Date.now()}`,
  savedAt: new Date().toISOString(),
  author,
  medicalHistory: "",
  allergies: [],
  medications: [],
  conditions: "",
  observations: "",
  customFields: [],
});

export function emptyChart(): ClinicalChart {
  return { anamnesis: [], evolutions: [], documents: [], permissions: {}, audit: [] };
}

export function defaultPermission(user: ClinicUser): ChartPermission {
  const dentist = user.startsWith("Dr");
  return {
    viewClinical: dentist || user === "Recepção",
    editAnamnesis: dentist,
    editEvolution: dentist,
    viewDocuments: dentist || user === "Recepção",
    manageDocuments: dentist,
    manageAccess: user === "Dra. Amanda",
  };
}

export function permissionOf(chart: ClinicalChart | undefined, user: ClinicUser): ChartPermission {
  return chart?.permissions[user] ?? defaultPermission(user);
}

export function currentAnamnesis(chart?: ClinicalChart) {
  const list = chart?.anamnesis ?? [];
  return list[0] ?? null;
}

export function seedClinicalCharts(patients: Patient[]): Patient[] {
  return patients.map((patient) => {
    if ((patient.chart?.anamnesis.length ?? 0) > 0 || (patient.chart?.evolutions.length ?? 0) > 0) return patient;
    const author = patient.responsible;
    const allergies = /ansiedade/i.test(patient.notes) ? ["Ansiedade em procedimentos longos"] : [];
    const anamnesis: AnamnesisVersion[] = [{
      id: `anm-${patient.protocol}-1`,
      savedAt: `${patient.lastVisit || "2026-10-01"}T16:00:00`,
      author,
      medicalHistory: patient.notes || "Sem relatos relevantes na primeira consulta.",
      allergies,
      medications: [],
      conditions: patient.notes,
      observations: "Ficha inicial gerada a partir do cadastro.",
      customFields: [{ id: "cf-habito", label: "Hábitos", value: "Escovação 2x/dia" }],
    }];
    const evolutions: EvolutionEntry[] = patient.history.slice(0, 3).map((item, index) => ({
      id: `evo-${patient.protocol}-${index}`,
      date: item.date,
      author: (item.professional as ClinicUser) || author,
      visitDate: item.date,
      visitTime: "09:00",
      visitProcedure: item.procedure,
      diagnosis: item.procedure,
      proceduresDone: item.procedure,
      observations: item.notes,
      changes: [{ at: `${item.date}T12:00:00`, author: author, summary: "Registro inicial da evolução." }],
    }));
    const documents: PatientDocument[] = patient.procedures.slice(0, 1).map((item) => ({
      id: `doc-${patient.protocol}-1`,
      name: `Pedido de exame — ${item.name}`,
      category: "Exame",
      uploadedAt: `${item.date}T10:00:00`,
      uploadedBy: author,
      note: item.notes,
      dataUrl: "",
      mime: "application/pdf",
      allowedUsers: [...clinicUsers],
    }));
    return {
      ...patient,
      chart: {
        anamnesis,
        evolutions,
        documents,
        permissions: {},
        audit: [{
          id: `aud-${patient.protocol}-1`,
          at: `${patient.lastVisit || "2026-10-01"}T16:05:00`,
          user: author,
          action: "Abriu o prontuário clínico e gerou a ficha inicial.",
        }],
      },
    };
  });
}
