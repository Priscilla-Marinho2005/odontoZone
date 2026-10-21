import type { Patient } from "./clinicPatients";

export const toothProcedures = [
  "Cárie",
  "Restauração",
  "Extração",
  "Canal",
  "Implante",
  "Prótese",
  "Coroa",
  "Faceta",
  "Aparelho",
  "Personalizado",
] as const;

export type ToothProcedure = (typeof toothProcedures)[number];
export type Dentition = "permanente" | "deciduo";

export type ToothEvent = {
  id: string;
  fdi: string;
  date: string;
  kind: ToothProcedure;
  customName?: string;
  notes: string;
  planId?: string;
};

export const permanentUpper = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"];
export const permanentLower = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"];
export const deciduousUpper = ["55", "54", "53", "52", "51", "61", "62", "63", "64", "65"];
export const deciduousLower = ["85", "84", "83", "82", "81", "71", "72", "73", "74", "75"];

export const procedureColor: Record<ToothProcedure, string> = {
  Cárie: "bg-danger/15 text-danger border-danger/40",
  Restauração: "bg-sky/15 text-sky border-sky/40",
  Extração: "bg-muted/20 text-muted border-line",
  Canal: "bg-st-atrasado/15 text-st-atrasado border-st-atrasado/40",
  Implante: "bg-teal/15 text-teal border-teal/40",
  Prótese: "bg-navy/10 text-navy border-navy/30",
  Coroa: "bg-mint/15 text-navy border-mint/40",
  Faceta: "bg-st-retorno/15 text-st-retorno border-st-retorno/40",
  Aparelho: "bg-st-atendimento/15 text-st-atendimento border-st-atendimento/40",
  Personalizado: "bg-surface text-ink border-line",
};

export function dentitionOf(fdi: string): Dentition {
  const n = Number(fdi);
  return n >= 51 && n <= 85 ? "deciduo" : "permanente";
}

export function currentOf(events: ToothEvent[], fdi: string): ToothEvent | null {
  return events.filter((item) => item.fdi === fdi).sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

export function historyOf(events: ToothEvent[], fdi: string) {
  return events.filter((item) => item.fdi === fdi).sort((a, b) => b.date.localeCompare(a.date));
}

export function labelOf(event: ToothEvent | null) {
  if (!event) return "Hígido";
  return event.kind === "Personalizado" ? (event.customName || "Personalizado") : event.kind;
}

function kindFromName(name: string): ToothProcedure {
  const text = name.toLowerCase();
  if (/cárie|carie/.test(text)) return "Cárie";
  if (/restaur/.test(text)) return "Restauração";
  if (/extraç|exodont/.test(text)) return "Extração";
  if (/canal|endod/.test(text)) return "Canal";
  if (/implant/.test(text)) return "Implante";
  if (/prótese|protese|overdenture/.test(text)) return "Prótese";
  if (/coroa/.test(text)) return "Coroa";
  if (/faceta|lente/.test(text)) return "Faceta";
  if (/aparelho|bráquete|braquete|ortod/.test(text)) return "Aparelho";
  return "Personalizado";
}

function parseFdi(tooth: string) {
  if (!tooth || /arcada/i.test(tooth)) return [] as string[];
  return tooth.match(/\d{2}/g) ?? [];
}

export function seedOdontogram(patients: Patient[]): Patient[] {
  return patients.map((patient) => {
    if ((patient.odontogram ?? []).length > 0) return patient;
    const events: ToothEvent[] = [];
    patient.procedures.forEach((item) => {
      const teeth = parseFdi(item.tooth);
      const kind = kindFromName(item.name);
      teeth.forEach((fdi) => {
        events.push({
          id: `od-${patient.protocol}-${item.date}-${fdi}-${item.name}`,
          fdi,
          date: item.date,
          kind,
          customName: kind === "Personalizado" ? item.name : undefined,
          notes: item.notes,
        });
      });
    });
    return { ...patient, odontogram: events };
  });
}
