import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  LuArrowLeft, LuCheck, LuDownload, LuEllipsis, LuEye, LuPencil, LuPlus, LuSearch, LuSlidersHorizontal, LuX,
} from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa";
import {
  defaultTagCatalog,
  emptyAddress,
  emptyClinicalExtras,
  emptyGuardian,
  funnelStages,
  initialPatients,
  initialTasks,
  origins,
  syncAgendaLinks,
  visitsOf,
  responsibles,
  stagesByTreatment,
  statuses,
  treatments,
} from "../data/clinicPatients";
import type {
  Address,
  ClinicTask,
  FunnelStage,
  Guardian,
  Interaction,
  Origin,
  Patient,
  Responsible,
  Status,
  TagDef,
  Treatment,
} from "../data/clinicPatients";
import { ensurePlanForTreatment, seedPlans } from "../data/treatmentPlan";
import PatientPlans from "./PatientPlans";

export { funnelStages };
export type { FunnelStage };

type Draft = {
  mode: "create" | "edit";
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
  guardian: Guardian;
  tagIds: string[];
  origin: Origin;
  notes: string;
  treatment: Treatment;
  stage: string;
  responsible: Responsible;
  status: Status;
  value: string;
  paid: string;
  lastVisit: string;
  nextAction: string;
};

type MenuState = {
  protocol: string;
  top: number;
  left: number;
};

const statusStyle: Record<Status, string> = {
  Ativo: "bg-st-confirmado/12 text-st-confirmado",
  "Em tratamento": "bg-st-atendimento/12 text-st-atendimento",
  "Aguardando retorno": "bg-st-atrasado/12 text-st-atrasado",
  Inativo: "bg-st-agendado/12 text-st-agendado",
};

const allStages = [...new Set(treatments.flatMap((treatment) => stagesByTreatment[treatment]))];

type ClinicContextValue = {
  patients: Patient[];
  setPatients: Dispatch<SetStateAction<Patient[]>>;
  tags: TagDef[];
  setTags: Dispatch<SetStateAction<TagDef[]>>;
  tasks: ClinicTask[];
  setTasks: Dispatch<SetStateAction<ClinicTask[]>>;
};

const ClinicContext = createContext<ClinicContextValue | null>(null);

export function PatientsProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() => seedPlans(initialPatients).map(syncAgendaLinks));
  const [tags, setTags] = useState<TagDef[]>(defaultTagCatalog);
  const [tasks, setTasks] = useState<ClinicTask[]>(initialTasks);
  return <ClinicContext.Provider value={{ patients, setPatients, tags, setTags, tasks, setTasks }}>{children}</ClinicContext.Provider>;
}

export function usePatients() {
  const value = useContext(ClinicContext);
  if (!value) throw new Error("usePatients deve ficar dentro de PatientsProvider");
  return value;
}

function isOrigin(value: string): value is Origin {
  return (origins as readonly string[]).includes(value);
}

function isTreatment(value: string): value is Treatment {
  return (treatments as readonly string[]).includes(value);
}

function isResponsible(value: string): value is Responsible {
  return (responsibles as readonly string[]).includes(value);
}

function isStatus(value: string): value is Status {
  return (statuses as readonly string[]).includes(value);
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function protocolNumber(protocol: string) {
  const number = Number(protocol.split("-").at(-1));
  return Number.isFinite(number) ? number : 0;
}

function formatProtocol(number: number) {
  return `OZ-${String(number).padStart(4, "0")}`;
}

function nextProtocol(list: Patient[]) {
  const used = new Set(list.map((patient) => patient.protocol));
  let number = list.reduce((max, patient) => Math.max(max, protocolNumber(patient.protocol)), 0) + 1;
  let protocol = formatProtocol(number);
  while (used.has(protocol)) {
    number += 1;
    protocol = formatProtocol(number);
  }
  return protocol;
}

const patientFunnelFilters = ["Todos", "Novos", "Em tratamento", "Retorno", "Financeiro"] as const;
const managementSegments = [
  "Todos",
  "Inativos",
  "Tratamentos pendentes",
  "Pagamentos em aberto",
  "Interrompidos",
] as const;
type ManagementSegment = (typeof managementSegments)[number];

function pendingTreatments(patient: Patient) {
  const plans = patient.plans ?? [];
  if (plans.length > 0) {
    return plans.filter((item) => item.status === "Planejado" || item.status === "Em andamento");
  }
  return patient.treatments.filter((item) => item.status === "Pendente" || item.status === "Em andamento");
}

function interruptedPlans(patient: Patient) {
  return (patient.plans ?? []).filter((item) => item.status === "Interrompido");
}

function hasOpenPayment(patient: Patient) {
  return pendingValue(patient) > 0 || patient.payments.some((item) => item.status === "Em aberto" || item.status === "Atrasado");
}

function matchesManagementSegment(patient: Patient, segment: ManagementSegment) {
  if (segment === "Todos") return true;
  if (segment === "Inativos") return patient.status === "Inativo";
  if (segment === "Tratamentos pendentes") return pendingTreatments(patient).length > 0;
  if (segment === "Interrompidos") return interruptedPlans(patient).length > 0;
  return hasOpenPayment(patient);
}

function matchesFunnelFilter(patient: Patient, filter: (typeof patientFunnelFilters)[number]) {
  if (filter === "Todos") return true;
  if (filter === "Novos") {
    return patient.funnelStage === "Avaliação"
      || patient.funnelStage === "Orçamento"
      || patient.funnelStage === "Aguardando aprovação";
  }
  if (filter === "Em tratamento") {
    return patient.funnelStage === "Tratamento iniciado" || patient.funnelStage === "Em tratamento";
  }
  if (filter === "Retorno") return patient.funnelStage === "Retorno";
  return pendingValue(patient) > 0;
}

function pendingValue(patient: Pick<Patient, "value" | "paid">) {
  return Math.max(patient.value - patient.paid, 0);
}

function ageFromBirth(iso: string) {
  if (!iso) return null;
  const birth = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function guardianSuggested(age: number | null) {
  return age !== null && (age < 18 || age > 65);
}

function formatAddress(address: Address) {
  const line = [address.street, address.number].filter(Boolean).join(", ");
  const city = [address.neighborhood, address.city, address.state].filter(Boolean).join(" · ");
  const zip = address.zip ? `CEP ${address.zip}` : "";
  return [line, city, zip].filter(Boolean).join(" — ") || "";
}

function buildRecordText(patient: Patient) {
  const lines = [
    "PRONTUÁRIO — ODONTOZONE",
    "",
    "PACIENTE",
    `Nome: ${patient.name}`,
    `Número do protocolo: ${patient.protocol}`,
    `CPF: ${patient.cpf || "—"}`,
    `Telefone: ${patient.phone || "—"}`,
    `WhatsApp: ${patient.whatsapp || "—"}`,
    `E-mail: ${patient.email || "—"}`,
    `Data de nascimento: ${formatDate(patient.birthDate)}`,
    `Endereço: ${formatAddress(patient.address) || "—"}`,
    `Origem: ${patient.origin}`,
    `Observações internas: ${patient.notes || "—"}`,
    "",
    "TRATAMENTO",
    `Tratamento atual: ${patient.treatment}`,
    `Etapa atual: ${patient.stage}`,
    `Responsável: ${patient.responsible}`,
    `Valor: ${formatMoney(patient.value)}`,
    `Status: ${patient.status}`,
    "",
    "HISTÓRICO",
    ...(patient.history.length === 0
      ? ["Nenhum atendimento registrado."]
      : patient.history.flatMap((item) => [
          `${formatDate(item.date)} — ${item.procedure}`,
          `Profissional: ${item.professional}`,
          `Observações: ${item.notes || "—"}`,
          "",
        ])),
    "AGENDA",
    "Próximos atendimentos:",
    ...(patient.upcoming.length === 0
      ? ["Nenhum horário futuro."]
      : patient.upcoming.map((item) => `${formatDate(item.date)} ${item.time} — ${item.procedure} — ${item.professional}`)),
    "",
    "Histórico de consultas:",
    ...(patient.consultations.length === 0
      ? ["Nenhuma consulta registrada."]
      : patient.consultations.map((item) => `${formatDate(item.date)} ${item.time} — ${item.procedure} — ${item.professional}`)),
    "",
    "FINANCEIRO",
    `Valor total: ${formatMoney(patient.value)}`,
    `Valor pago: ${formatMoney(patient.paid)}`,
    `Valor pendente: ${formatMoney(pendingValue(patient))}`,
  ];
  return lines.join("\n");
}

function downloadRecord(patient: Patient) {
  const blob = new Blob([buildRecordText(patient)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `prontuario-${patient.protocol}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function emptyDraft(protocol: string): Draft {
  const treatment: Treatment = "Avaliação";
  return {
    mode: "create",
    protocol,
    name: "",
    photo: "https://randomuser.me/api/portraits/lego/1.jpg",
    cpf: "",
    phone: "",
    whatsapp: "",
    email: "",
    birthDate: "",
    address: emptyAddress(),
    hasGuardian: false,
    guardian: emptyGuardian(),
    tagIds: [],
    origin: "Passante",
    notes: "",
    treatment,
    stage: stagesByTreatment[treatment][0],
    responsible: "Dra. Priscila",
    status: "Ativo",
    value: "",
    paid: "",
    lastVisit: "",
    nextAction: "",
  };
}

function draftFromPatient(patient: Patient): Draft {
  return {
    mode: "edit",
    protocol: patient.protocol,
    name: patient.name,
    photo: patient.photo,
    cpf: patient.cpf,
    phone: patient.phone,
    whatsapp: patient.whatsapp,
    email: patient.email,
    birthDate: patient.birthDate,
    address: patient.address,
    hasGuardian: patient.hasGuardian,
    guardian: patient.guardian ?? emptyGuardian(),
    tagIds: patient.tagIds,
    origin: patient.origin,
    notes: patient.notes,
    treatment: patient.treatment,
    stage: patient.stage,
    responsible: patient.responsible,
    status: patient.status,
    value: String(patient.value),
    paid: String(patient.paid),
    lastVisit: patient.lastVisit,
    nextAction: patient.nextAction,
  };
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${statusStyle[status]}`}>
      {status}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium wrap-break-word">{value || "—"}</p>
    </div>
  );
}

const controlClass = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-teal";

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  error,
  required,
  readOnly,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-[11px] font-medium text-muted">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        readOnly={readOnly}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} ${readOnly ? "bg-surface text-muted" : ""} ${error ? "border-danger" : ""}`}
      />
      {error && <span className="mt-1 block text-[11px] text-danger">{error}</span>}
    </label>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={controlClass}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TagChip({ tag, onRemove }: { tag: TagDef; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
      style={{ backgroundColor: tag.color }}
    >
      {tag.label}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remover ${tag.label}`} className="opacity-80 hover:opacity-100">
          <LuX size={12} />
        </button>
      )}
    </span>
  );
}

function PatientForm({
  draft,
  errors,
  tags,
  onAddTag,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: Draft;
  errors: Record<string, string>;
  tags: TagDef[];
  onAddTag: (tag: TagDef) => void;
  onChange: (next: Draft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState("#018295");
  const age = ageFromBirth(draft.birthDate);
  const suggestGuardian = guardianSuggested(age);

  useEffect(() => {
    document.getElementById("paciente-nome")?.focus();
  }, []);

  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  function toggleTag(id: string) {
    set({
      tagIds: draft.tagIds.includes(id)
        ? draft.tagIds.filter((tagId) => tagId !== id)
        : [...draft.tagIds, id],
    });
  }

  function createTag() {
    const label = newTagLabel.trim();
    if (!label) return;
    const id = `tag-${Date.now()}`;
    const tag: TagDef = { id, label, color: newTagColor };
    onAddTag(tag);
    set({ tagIds: [...draft.tagIds, id] });
    setNewTagLabel("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="paciente-form-titulo"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 shadow-xl sm:max-w-3xl sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="paciente-form-titulo" className="text-[20px] font-semibold">
              {draft.mode === "create" ? "Novo paciente" : "Editar paciente"}
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              Protocolo {draft.protocol}. Cadastro pessoal, contato e observações internas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink"
          >
            <LuX size={16} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 sm:col-span-2">
            <img src={draft.photo} alt="" className="size-16 rounded-full object-cover ring-1 ring-line" />
            <label className="text-[13px] font-medium text-teal">
              Alterar foto
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => set({ photo: String(reader.result) });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <TextField id="paciente-nome" label="Nome" value={draft.name} onChange={(name) => set({ name })} error={errors.name} required />
          </div>
          <TextField id="paciente-cpf" label="CPF" value={draft.cpf} onChange={(cpf) => set({ cpf })} />
          <TextField id="paciente-nascimento" label="Data de nascimento" type="date" value={draft.birthDate} onChange={(birthDate) => set({ birthDate })} />
          <TextField id="paciente-telefone" label="Telefone" value={draft.phone} onChange={(phone) => set({ phone, whatsapp: draft.whatsapp || phone })} />
          <TextField id="paciente-whatsapp" label="WhatsApp" value={draft.whatsapp} onChange={(whatsapp) => set({ whatsapp })} />
          <TextField id="paciente-email" label="E-mail" type="email" value={draft.email} onChange={(email) => set({ email })} error={errors.email} />
          <SelectField
            id="paciente-origem"
            label="Origem do paciente"
            value={draft.origin}
            options={origins}
            onChange={(value) => {
              if (isOrigin(value)) set({ origin: value });
            }}
          />
          <TextField id="paciente-protocolo" label="Número do protocolo" value={draft.protocol} onChange={() => undefined} readOnly />
          <TextField id="paciente-rua" label="Endereço" value={draft.address.street} onChange={(street) => set({ address: { ...draft.address, street } })} />
          <TextField id="paciente-numero" label="Número" value={draft.address.number} onChange={(number) => set({ address: { ...draft.address, number } })} />
          <TextField id="paciente-bairro" label="Bairro" value={draft.address.neighborhood} onChange={(neighborhood) => set({ address: { ...draft.address, neighborhood } })} />
          <TextField id="paciente-cidade" label="Cidade" value={draft.address.city} onChange={(city) => set({ address: { ...draft.address, city } })} />
          <TextField id="paciente-uf" label="UF" value={draft.address.state} onChange={(state) => set({ address: { ...draft.address, state } })} />
          <TextField id="paciente-cep" label="CEP" value={draft.address.zip} onChange={(zip) => set({ address: { ...draft.address, zip } })} />

          <div className="sm:col-span-2 rounded-lg border border-line px-4 py-3">
            <label className="flex items-start gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draft.hasGuardian}
                onChange={(event) => set({ hasGuardian: event.target.checked })}
                className="mt-0.5"
              />
              <span>
                Cadastrar responsável legal
                {suggestGuardian && (
                  <span className="mt-0.5 block text-[11px] text-muted">
                    Recomendado: paciente {age !== null && age < 18 ? "menor de 18 anos" : "maior de 65 anos"}.
                  </span>
                )}
              </span>
            </label>
            {draft.hasGuardian && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <TextField id="resp-nome" label="Nome do responsável" value={draft.guardian.name} onChange={(name) => set({ guardian: { ...draft.guardian, name } })} />
                <TextField id="resp-parentesco" label="Parentesco" value={draft.guardian.kinship} onChange={(kinship) => set({ guardian: { ...draft.guardian, kinship } })} />
                <TextField id="resp-telefone" label="Telefone" value={draft.guardian.phone} onChange={(phone) => set({ guardian: { ...draft.guardian, phone } })} />
                <TextField id="resp-cpf" label="CPF" value={draft.guardian.cpf} onChange={(cpf) => set({ guardian: { ...draft.guardian, cpf } })} />
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <p className="text-[11px] font-medium text-muted">Tags e categorias</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    draft.tagIds.includes(tag.id) ? "text-white" : "bg-surface text-muted ring-1 ring-line"
                  }`}
                  style={draft.tagIds.includes(tag.id) ? { backgroundColor: tag.color } : undefined}
                >
                  {tag.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={newTagLabel}
                onChange={(event) => setNewTagLabel(event.target.value)}
                placeholder="Nova tag"
                className="min-w-40 flex-1 rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
              />
              <input type="color" value={newTagColor} onChange={(event) => setNewTagColor(event.target.value)} aria-label="Cor da tag" className="h-9 w-12 cursor-pointer rounded border border-line" />
              <button type="button" onClick={createTag} className="rounded-md border border-line px-3 py-2 text-[13px] font-medium hover:bg-surface">
                Adicionar tag
              </button>
            </div>
          </div>

          <label htmlFor="paciente-observacoes" className="block sm:col-span-2">
            <span className="text-[11px] font-medium text-muted">Observações internas</span>
            <textarea
              id="paciente-observacoes"
              value={draft.notes}
              onChange={(event) => set({ notes: event.target.value })}
              rows={3}
              className={controlClass}
            />
          </label>
          <SelectField
            id="paciente-tratamento"
            label="Determinar tratamento"
            value={draft.treatment}
            options={treatments}
            onChange={(value) => {
              if (!isTreatment(value)) return;
              const stages = stagesByTreatment[value];
              set({ treatment: value, stage: stages.includes(draft.stage) ? draft.stage : stages[0] });
            }}
          />
          <SelectField
            id="paciente-etapa"
            label="Etapa do tratamento"
            value={draft.stage}
            options={stagesByTreatment[draft.treatment]}
            onChange={(stage) => set({ stage })}
          />
          <SelectField
            id="paciente-responsavel"
            label="Profissional responsável"
            value={draft.responsible}
            options={responsibles}
            onChange={(value) => {
              if (isResponsible(value)) set({ responsible: value });
            }}
          />
          <SelectField
            id="paciente-status"
            label="Status"
            value={draft.status}
            options={statuses}
            onChange={(value) => {
              if (isStatus(value)) set({ status: value });
            }}
          />
          <TextField id="paciente-valor" label="Valor total" type="number" value={draft.value} onChange={(value) => set({ value })} error={errors.value} />
          <TextField id="paciente-pago" label="Valor pago" type="number" value={draft.paid} onChange={(paid) => set({ paid })} error={errors.paid} />
          <TextField id="paciente-ultimo" label="Último atendimento" type="date" value={draft.lastVisit} onChange={(lastVisit) => set({ lastVisit })} />
          <TextField id="paciente-proxima" label="Próxima ação" value={draft.nextAction} onChange={(nextAction) => set({ nextAction })} />
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium hover:bg-surface">
            Cancelar
          </button>
          <button type="submit" className="rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">
            Salvar paciente
          </button>
        </div>
      </form>
    </div>
  );
}

const recordTabs = [
  "Resumo", "Histórico", "Consultas", "Procedimentos", "Tratamentos",
  "Orçamentos", "Pagamentos", "Mensagens", "Faltas", "Retornos", "Tarefas", "Anotações",
] as const;
type RecordTab = (typeof recordTabs)[number];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "P";
}

function shortDate(iso: string) {
  if (!iso) return "—";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const today = new Date();
  const sameDay = date.getDate() === today.getDate()
    && date.getMonth() === today.getMonth()
    && date.getFullYear() === today.getFullYear();
  if (sameDay) return "Hoje";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

function timelineLabel(iso: string) {
  if (!iso) return "—";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const today = new Date();
  const sameDay = date.getDate() === today.getDate()
    && date.getMonth() === today.getMonth()
    && date.getFullYear() === today.getFullYear();
  return sameDay ? "Hoje" : formatDate(iso);
}

function agendaAbsences(patient: Patient) {
  return visitsOf(patient)
    .filter((visit) => visit.status === "Cancelado" || visit.status === "Falta")
    .map((visit) => ({
      date: visit.date,
      time: visit.time,
      type: visit.status === "Falta" ? "Falta" : "Cancelamento",
      procedure: visit.procedure,
      reason: visit.notes || "Compromisso da agenda",
      professional: visit.professional,
    }));
}

function agendaFollowUps(patient: Patient) {
  return visitsOf(patient)
    .filter((visit) => (
      visit.status === "Retorno"
      || /retorno|manuten/i.test(visit.procedure)
    ))
    .map((visit) => ({
      date: visit.date,
      time: visit.time,
      type: /manuten/i.test(visit.procedure) ? "Manutenção" : "Retorno",
      procedure: visit.procedure,
      status: visit.status === "Concluído" ? "Realizado" : visit.status === "Atrasado" ? "Atrasado" : "Agendado",
      professional: visit.professional,
    }));
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

function RecordView({
  patient,
  tags,
  onBack,
  onEdit,
  onChange,
}: {
  patient: Patient;
  tags: TagDef[];
  onBack: () => void;
  onEdit: () => void;
  onChange: (next: Patient) => void;
}) {
  const pending = pendingValue(patient);
  const paidRatio = patient.value > 0 ? Math.min(patient.paid / patient.value, 1) : 0;
  const nextVisit = patient.upcoming[0];
  const [tab, setTab] = useState<RecordTab>("Resumo");
  const [actionDone, setActionDone] = useState(false);
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskDraft, setTaskDraft] = useState("");
  const [extraNotes, setExtraNotes] = useState<string[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [messageDate, setMessageDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [messageChannel, setMessageChannel] = useState<Interaction["channel"]>("WhatsApp");
  const [messageSummary, setMessageSummary] = useState("");
  const [absenceDate, setAbsenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [absenceTime, setAbsenceTime] = useState("09:00");
  const [absenceType, setAbsenceType] = useState<"Falta" | "Cancelamento">("Cancelamento");
  const [absenceProcedure, setAbsenceProcedure] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [returnTime, setReturnTime] = useState("10:00");
  const [returnType, setReturnType] = useState<"Retorno" | "Manutenção">("Retorno");
  const [returnProcedure, setReturnProcedure] = useState("");
  const chat = whatsappHref(patient.whatsapp || patient.phone);
  const patientTags = tags.filter((tag) => patient.tagIds.includes(tag.id));
  const age = ageFromBirth(patient.birthDate);

  const timeline = [
    ...(nextVisit
      ? [{ key: `next-${nextVisit.date}`, when: timelineLabel(nextVisit.date), title: `${nextVisit.procedure} agendado` }]
      : []),
    ...[...patient.history]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => ({
        key: `${item.date}-${item.procedure}`,
        when: timelineLabel(item.date),
        title: item.procedure,
      })),
    ...extraNotes.map((note, index) => ({ key: `note-${index}`, when: "Hoje", title: note })),
  ];

  function addTask() {
    const title = taskDraft.trim();
    if (!title) return;
    setTasks((current) => [title, ...current]);
    setTaskDraft("");
    setTab("Tarefas");
  }

  function addNote() {
    const title = noteDraft.trim();
    if (!title) return;
    setExtraNotes((current) => [title, ...current]);
    setNoteDraft("");
    setTab("Resumo");
  }

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-teal">
        <LuArrowLeft size={15} /> Voltar para pacientes
      </button>

      <header className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          {patient.photo ? (
            <img src={patient.photo} alt="" className="size-12 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-teal text-[15px] font-semibold text-white">
              {initials(patient.name)}
            </span>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-semibold leading-tight">{patient.name}</h1>
              <StatusBadge status={patient.status} />
            </div>
            <p className="mt-0.5 text-[13px] text-muted">
              {patient.phone || "Sem telefone"} · {patient.treatment} · {patient.stage}
              {age !== null ? ` · ${age} anos` : ""}
            </p>
            {patientTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {patientTags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-medium hover:bg-surface">
            <LuPencil size={15} /> Editar
          </button>
          {chat ? (
            <a href={chat} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#1fa855] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#188a46]">
              <FaWhatsapp size={15} /> WhatsApp
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-line px-4 py-2.5 text-[13px] font-medium text-muted">
              <FaWhatsapp size={15} /> WhatsApp
            </span>
          )}
          <button type="button" onClick={() => setTab("Tarefas")} className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">
            <LuPlus size={15} /> Nova tarefa
          </button>
        </div>
      </header>

      <section className="mt-5 grid overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Último atendimento", shortDate(patient.lastVisit)],
          ["Próximo retorno", nextVisit ? `${shortDate(nextVisit.date)}, ${nextVisit.time}` : "—"],
          ["Tratamento", patient.treatment],
          ["Valor", formatMoney(patient.value)],
          ["Pago", formatMoney(patient.paid)],
          ["Pendente", formatMoney(pending)],
        ].map(([label, value]) => (
          <div key={label} className="border-line px-4 py-3.5 not-last:border-b sm:not-last:border-r lg:not-last:border-b-0">
            <p className="text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">{label}</p>
            <p className="mt-1 text-[15px] font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 flex gap-5 overflow-x-auto border-b border-line">
        {recordTabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`shrink-0 border-b-2 pb-2.5 text-[13px] font-medium ${tab === item ? "border-teal text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Resumo" && (
        <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <section className="rounded-xl border border-line bg-white px-5 py-4">
            <h2 className="text-[15px] font-semibold">Linha do tempo</h2>
            {timeline.length === 0 ? (
              <p className="mt-4 text-[13px] text-muted">Nenhum registro ainda.</p>
            ) : (
              <ol className="mt-4 space-y-0">
                {timeline.map((item, index) => (
                  <li key={item.key} className="grid grid-cols-[88px_16px_1fr] gap-3">
                    <p className="pt-0.5 text-right text-[12px] text-muted">{item.when}</p>
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 size-2.5 rounded-full ${index === 0 ? "bg-teal" : "bg-line"}`} />
                      {index < timeline.length - 1 && <span className="w-px flex-1 bg-line" />}
                    </div>
                    <p className={`pb-5 text-[13px] ${index === 0 ? "font-semibold" : ""}`}>{item.title}</p>
                  </li>
                ))}
              </ol>
            )}
            <form
              className="mt-1 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addNote();
              }}
            >
              <input
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Novo registro"
                className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
              />
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] font-medium hover:bg-surface">
                <LuPlus size={14} /> Adicionar registro
              </button>
            </form>
          </section>

          <div className="grid gap-4">
            <section className="rounded-xl border border-line bg-white px-5 py-4">
              <h2 className="text-[15px] font-semibold">Próxima ação</h2>
              <p className={`mt-3 text-[14px] font-medium ${actionDone ? "text-muted line-through" : ""}`}>
                {patient.nextAction || "Nenhuma ação pendente"}
              </p>
              <p className="mt-1 text-[12px] text-muted">Responsável: {patient.responsible}</p>
              <button
                type="button"
                disabled={actionDone || !patient.nextAction}
                onClick={() => setActionDone(true)}
                className="mt-4 w-full rounded-lg bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy disabled:cursor-default disabled:bg-line disabled:text-muted"
              >
                {actionDone ? "Concluída" : "Marcar como concluída"}
              </button>
            </section>

            <section className="rounded-xl border border-line bg-white px-5 py-4">
              <h2 className="text-[15px] font-semibold">Financeiro</h2>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-teal" style={{ width: `${paidRatio * 100}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[12px] text-muted">
                <span>{formatMoney(patient.paid)} recebido</span>
                <span>{formatMoney(pending)} pendente</span>
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === "Histórico" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Histórico completo</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Info label="CPF" value={patient.cpf} />
            <Info label="Origem" value={patient.origin} />
            <Info label="Endereço" value={formatAddress(patient.address)} />
            {patient.hasGuardian && patient.guardian && (
              <Info label="Responsável legal" value={`${patient.guardian.name} (${patient.guardian.kinship})`} />
            )}
          </div>
          {patient.history.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhum atendimento registrado.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {patient.history.map((item) => (
                <li key={`${item.date}-${item.procedure}`} className="rounded-lg border border-line px-4 py-3">
                  <p className="text-[13px] font-semibold">{item.procedure}</p>
                  <p className="mt-1 text-[12px] text-muted">{formatDate(item.date)} · {item.professional}</p>
                  {item.notes && <p className="mt-2 text-[13px]">{item.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Consultas" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Consultas anteriores</h2>
          {patient.consultations.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhuma consulta registrada.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {patient.consultations.map((item) => (
                <li key={`${item.date}-${item.time}-${item.procedure}`} className="rounded-lg border border-line px-4 py-3">
                  <p className="text-[13px] font-semibold">{item.procedure}</p>
                  <p className="mt-1 text-[12px] text-muted">
                    {formatDate(item.date)} · {item.time} · {item.professional}
                    {item.status ? ` · ${item.status}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Procedimentos" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Procedimentos realizados</h2>
          {patient.procedures.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhum procedimento registrado.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {patient.procedures.map((item) => (
                <li key={`${item.date}-${item.name}`} className="rounded-lg border border-line px-4 py-3">
                  <p className="text-[13px] font-semibold">{item.name}</p>
                  <p className="mt-1 text-[12px] text-muted">{formatDate(item.date)} · Dente {item.tooth} · {item.professional}</p>
                  {item.notes && <p className="mt-2 text-[13px]">{item.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Tratamentos" && (
        <PatientPlans patient={patient} onChange={onChange} />
      )}

      {tab === "Orçamentos" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Orçamentos</h2>
          {patient.quotes.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhum orçamento registrado.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {patient.quotes.map((item) => (
                <li key={item.id} className="rounded-lg border border-line px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold">{item.title}</p>
                    <span className="text-[11px] font-semibold">{item.status}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{item.id} · {formatDate(item.date)} · {formatMoney(item.value)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Pagamentos" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Pagamentos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Info label="Valor total" value={formatMoney(patient.value)} />
            <Info label="Recebido" value={formatMoney(patient.paid)} />
            <Info label="Pendente" value={formatMoney(pending)} />
          </div>
          {patient.payments.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhum pagamento registrado.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {patient.payments.map((item) => (
                <li key={`${item.date}-${item.amount}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold">{formatMoney(item.amount)}</p>
                    <p className="text-[12px] text-muted">{formatDate(item.date)} · {item.method}</p>
                  </div>
                  <span className="text-[11px] font-semibold">{item.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Tarefas" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Tarefas</h2>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              addTask();
            }}
          >
            <input
              value={taskDraft}
              onChange={(event) => setTaskDraft(event.target.value)}
              placeholder="Descreva a tarefa"
              className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
            />
            <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-[13px] font-medium text-white hover:bg-navy">
              Adicionar
            </button>
          </form>
          <ul className="mt-4 space-y-2">
            {patient.nextAction && (
              <li className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[13px]">
                <LuCheck size={14} className="text-teal" />
                <span className={actionDone ? "text-muted line-through" : ""}>{patient.nextAction}</span>
              </li>
            )}
            {tasks.map((task) => (
              <li key={task} className="rounded-lg bg-surface px-3 py-2 text-[13px]">{task}</li>
            ))}
          </ul>
        </section>
      )}

      {tab === "Mensagens" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Mensagens e interações</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Info label="Telefone" value={patient.phone} />
            <Info label="WhatsApp" value={patient.whatsapp} />
            <Info label="E-mail" value={patient.email} />
          </div>
          <form
            className="mt-4 grid gap-3 rounded-lg border border-line px-4 py-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const summary = messageSummary.trim();
              if (!summary) return;
              onChange({
                ...patient,
                interactions: [
                  { date: messageDate, channel: messageChannel, summary },
                  ...patient.interactions,
                ],
              });
              setMessageSummary("");
            }}
          >
            <label className="block text-[11px] font-medium text-muted">
              Data
              <input
                type="date"
                value={messageDate}
                onChange={(event) => setMessageDate(event.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
              />
            </label>
            <label className="block text-[11px] font-medium text-muted">
              Canal
              <select
                value={messageChannel}
                onChange={(event) => setMessageChannel(event.target.value as Interaction["channel"])}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="E-mail">E-mail</option>
                <option value="Telefone">Telefone</option>
                <option value="Presencial">Presencial</option>
              </select>
            </label>
            <label className="block text-[11px] font-medium text-muted sm:col-span-2">
              Mensagem
              <textarea
                value={messageSummary}
                onChange={(event) => setMessageSummary(event.target.value)}
                rows={3}
                placeholder="Descreva o contato ou a mensagem enviada"
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal"
              />
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-teal px-4 py-2 text-[13px] font-medium text-white hover:bg-navy">
                <LuPlus size={14} /> Cadastrar mensagem
              </button>
            </div>
          </form>
          {patient.interactions.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhuma interação registrada.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {patient.interactions.map((item) => (
                <li key={`${item.date}-${item.summary}`} className="rounded-lg border border-line px-4 py-3">
                  <p className="text-[12px] font-semibold text-teal">{item.channel}</p>
                  <p className="mt-1 text-[13px]">{item.summary}</p>
                  <p className="mt-1 text-[12px] text-muted">{formatDate(item.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Faltas" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Faltas e cancelamentos</h2>
          <p className="mt-1 text-[12px] text-muted">Vinculados à agenda. Mudar o status na Agenda atualiza esta lista.</p>
          <form
            className="mt-4 grid gap-3 rounded-lg border border-line px-4 py-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const procedure = absenceProcedure.trim();
              if (!procedure) return;
              const visit = {
                date: absenceDate,
                time: absenceTime,
                procedure,
                professional: patient.responsible,
                status: absenceType === "Falta" ? "Falta" as const : "Cancelado" as const,
                notes: absenceReason.trim(),
              };
              onChange({
                ...patient,
                consultations: [visit, ...patient.consultations],
                absences: [{
                  date: absenceDate,
                  type: absenceType,
                  procedure,
                  reason: absenceReason.trim() || "Registrado no prontuário",
                }, ...patient.absences],
              });
              setAbsenceProcedure("");
              setAbsenceReason("");
            }}
          >
            <label className="block text-[11px] font-medium text-muted">
              Data
              <input type="date" value={absenceDate} onChange={(event) => setAbsenceDate(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="block text-[11px] font-medium text-muted">
              Horário
              <input type="time" value={absenceTime} onChange={(event) => setAbsenceTime(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="block text-[11px] font-medium text-muted">
              Tipo
              <select value={absenceType} onChange={(event) => setAbsenceType(event.target.value as "Falta" | "Cancelamento")} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
                <option value="Cancelamento">Cancelamento</option>
                <option value="Falta">Falta</option>
              </select>
            </label>
            <label className="block text-[11px] font-medium text-muted">
              Procedimento
              <input value={absenceProcedure} onChange={(event) => setAbsenceProcedure(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="block text-[11px] font-medium text-muted sm:col-span-2">
              Motivo
              <input value={absenceReason} onChange={(event) => setAbsenceReason(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-teal px-4 py-2 text-[13px] font-medium text-white hover:bg-navy">
                <LuPlus size={14} /> Registrar na agenda
              </button>
            </div>
          </form>
          {agendaAbsences(patient).length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhuma falta ou cancelamento na agenda.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {agendaAbsences(patient).map((item) => (
                <li key={`${item.date}-${item.time}-${item.procedure}`} className="rounded-lg border border-line px-4 py-3">
                  <p className="text-[13px] font-semibold">{item.type} · {item.procedure}</p>
                  <p className="mt-1 text-[12px] text-muted">{formatDate(item.date)} · {item.time} · {item.professional}</p>
                  {item.reason && <p className="mt-2 text-[13px]">{item.reason}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Retornos" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Retornos e manutenções</h2>
          <p className="mt-1 text-[12px] text-muted">Vinculados à agenda. Compromissos com status Retorno ou manutenção aparecem aqui.</p>
          <form
            className="mt-4 grid gap-3 rounded-lg border border-line px-4 py-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const procedure = returnProcedure.trim() || returnType;
              const visit = {
                date: returnDate,
                time: returnTime,
                procedure,
                professional: patient.responsible,
                status: "Retorno" as const,
                notes: returnType,
              };
              onChange({
                ...patient,
                upcoming: [visit, ...patient.upcoming],
                followUps: [{
                  date: returnDate,
                  type: returnType,
                  procedure,
                  status: "Agendado",
                }, ...patient.followUps],
              });
              setReturnProcedure("");
            }}
          >
            <label className="block text-[11px] font-medium text-muted">
              Data
              <input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="block text-[11px] font-medium text-muted">
              Horário
              <input type="time" value={returnTime} onChange={(event) => setReturnTime(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="block text-[11px] font-medium text-muted">
              Tipo
              <select value={returnType} onChange={(event) => setReturnType(event.target.value as "Retorno" | "Manutenção")} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
                <option value="Retorno">Retorno</option>
                <option value="Manutenção">Manutenção</option>
              </select>
            </label>
            <label className="block text-[11px] font-medium text-muted">
              Procedimento
              <input value={returnProcedure} onChange={(event) => setReturnProcedure(event.target.value)} placeholder="Ex.: Retorno da avaliação" className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-teal px-4 py-2 text-[13px] font-medium text-white hover:bg-navy">
                <LuPlus size={14} /> Agendar retorno
              </button>
            </div>
          </form>
          {agendaFollowUps(patient).length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhum retorno ou manutenção na agenda.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {agendaFollowUps(patient).map((item) => (
                <li key={`${item.date}-${item.time}-${item.procedure}`} className="rounded-lg border border-line px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold">{item.type} · {item.procedure}</p>
                    <span className="text-[11px] font-semibold">{item.status}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{formatDate(item.date)} · {item.time} · {item.professional}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Anotações" && (
        <section className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
          <h2 className="text-[15px] font-semibold">Observações internas</h2>
          <p className="mt-3 text-[13px]">{patient.notes || "Nenhuma anotação."}</p>
        </section>
      )}
    </div>
  );
}

function RowMenuButton({
  name,
  expanded,
  onOpen,
}: {
  name: string;
  expanded: boolean;
  onOpen: (anchor: HTMLButtonElement) => void;
}) {
  return (
    <button
      type="button"
      data-patient-menu
      aria-label={`Ações de ${name}`}
      aria-haspopup="menu"
      aria-expanded={expanded}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(event.currentTarget);
      }}
      className="grid size-8 cursor-pointer place-items-center rounded-md text-muted hover:bg-surface hover:text-ink"
    >
      <LuEllipsis size={16} />
    </button>
  );
}

function PatientIdentity({ patient, onOpen }: { patient: Patient; onOpen: () => void }) {
  return (
    <div className="flex items-center gap-3">
      {patient.photo ? (
        <img src={patient.photo} alt="" className="size-9 shrink-0 rounded-full object-cover" />
      ) : null}
      <div>
        <button type="button" onClick={onOpen} className="text-left font-semibold hover:text-teal">
          {patient.name}
        </button>
        <p className="text-[11px] text-muted">{patient.protocol}</p>
        <div className="mt-1">
          <StatusBadge status={patient.status} />
        </div>
      </div>
    </div>
  );
}

export default function Pacientes({
  openProtocol = null,
  onOpened,
}: {
  openProtocol?: string | null;
  onOpened?: () => void;
}) {
  const { patients, setPatients, tags, setTags } = usePatients();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [treatmentFilter, setTreatmentFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [funnelFilter, setFunnelFilter] = useState<(typeof patientFunnelFilters)[number]>("Todos");
  const [segment, setSegment] = useState<ManagementSegment>("Todos");
  const [customSegments, setCustomSegments] = useState<{ id: string; name: string }[]>([]);
  const [customSegment, setCustomSegment] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [viewingProtocol, setViewingProtocol] = useState<string | null>(openProtocol);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtersActive = Boolean(treatmentFilter || stageFilter || responsibleFilter || statusFilter || originFilter || tagFilter);
  const stageOptions = treatmentFilter && isTreatment(treatmentFilter)
    ? stagesByTreatment[treatmentFilter]
    : allStages;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return patients.filter((patient) => {
      const matchesQuery = !term
        || patient.name.toLowerCase().includes(term)
        || patient.protocol.toLowerCase().includes(term)
        || patient.cpf.includes(term)
        || patient.phone.replace(/\D/g, "").includes(term.replace(/\D/g, ""))
        || patient.email.toLowerCase().includes(term);
      return matchesQuery
        && matchesFunnelFilter(patient, funnelFilter)
        && matchesManagementSegment(patient, segment)
        && (!treatmentFilter || patient.treatment === treatmentFilter)
        && (!stageFilter || patient.stage === stageFilter)
        && (!responsibleFilter || patient.responsible === responsibleFilter)
        && (!statusFilter || patient.status === statusFilter)
        && (!originFilter || patient.origin === originFilter)
        && (!tagFilter || patient.tagIds.includes(tagFilter));
    });
  }, [patients, query, funnelFilter, segment, treatmentFilter, stageFilter, responsibleFilter, statusFilter, originFilter, tagFilter]);

  const viewing = patients.find((patient) => patient.protocol === viewingProtocol) ?? null;
  const menuPatient = patients.find((patient) => patient.protocol === menu?.protocol) ?? null;

  useEffect(() => {
    if (!openProtocol) return;
    setViewingProtocol(openProtocol);
    onOpened?.();
  }, [openProtocol]);

  useEffect(() => {
    if (!menu) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-patient-menu]")) return;
      setMenu(null);
    };
    const close = () => setMenu(null);
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (menu) {
        setMenu(null);
        return;
      }
      if (draft) setDraft(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu, draft]);

  function openMenu(protocol: string, anchor: HTMLButtonElement) {
    if (menu?.protocol === protocol) {
      setMenu(null);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const menuHeight = 132;
    const menuWidth = 196;
    const top = rect.bottom + 6 + menuHeight > window.innerHeight
      ? Math.max(8, rect.top - menuHeight - 6)
      : rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setMenu({ protocol, top, left });
  }

  function openRecord(protocol: string) {
    setMenu(null);
    setViewingProtocol(protocol);
  }

  function openCreate() {
    setMenu(null);
    setErrors({});
    setDraft(emptyDraft(nextProtocol(patients)));
  }

  function openEdit(patient: Patient) {
    setMenu(null);
    setErrors({});
    setDraft(draftFromPatient(patient));
  }

  function clearFilters() {
    setTreatmentFilter("");
    setStageFilter("");
    setResponsibleFilter("");
    setStatusFilter("");
    setOriginFilter("");
    setTagFilter("");
  }

  function savePatient() {
    if (!draft) return;
    const nextErrors: Record<string, string> = {};
    if (!draft.name.trim()) nextErrors.name = "Informe o nome do paciente.";
    if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      nextErrors.email = "Informe um e-mail válido.";
    }
    const value = draft.value.trim() === "" ? 0 : Number(draft.value);
    const paid = draft.paid.trim() === "" ? 0 : Number(draft.paid);
    if (!Number.isFinite(value) || value < 0) nextErrors.value = "Informe um valor válido.";
    if (!Number.isFinite(paid) || paid < 0) nextErrors.paid = "Informe um valor válido.";
    if (Number.isFinite(value) && Number.isFinite(paid) && paid > value) {
      nextErrors.paid = "O valor pago não pode ser maior que o valor total.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const protocol = draft.mode === "create" ? nextProtocol(patients) : draft.protocol;
    if (draft.mode === "create" && patients.some((patient) => patient.protocol === protocol)) {
      setErrors({ name: "Já existe um paciente com este protocolo." });
      return;
    }
    if (draft.mode === "edit" && patients.some((patient) => patient.protocol === protocol && patient.protocol !== draft.protocol)) {
      setErrors({ name: "Já existe um paciente com este protocolo." });
      return;
    }

    const current = patients.find((patient) => patient.protocol === draft.protocol);
    const extras = emptyClinicalExtras();
    const saved: Patient = {
      protocol,
      name: draft.name.trim(),
      photo: draft.photo,
      cpf: draft.cpf.trim(),
      phone: draft.phone.trim(),
      whatsapp: draft.whatsapp.trim() || draft.phone.trim(),
      email: draft.email.trim(),
      birthDate: draft.birthDate,
      address: draft.address,
      hasGuardian: draft.hasGuardian,
      guardian: draft.hasGuardian ? draft.guardian : null,
      tagIds: draft.tagIds,
      origin: draft.origin,
      notes: draft.notes.trim(),
      treatment: draft.treatment,
      stage: draft.stage,
      funnelStage: current?.funnelStage ?? "Avaliação",
      responsible: draft.responsible,
      status: draft.status,
      value,
      paid,
      lastVisit: draft.lastVisit,
      nextAction: draft.nextAction.trim(),
      history: current?.history ?? extras.history,
      upcoming: current?.upcoming ?? extras.upcoming,
      consultations: current?.consultations ?? extras.consultations,
      procedures: current?.procedures ?? extras.procedures,
      treatments: current?.treatments ?? extras.treatments,
      plans: current?.plans ?? extras.plans,
      quotes: current?.quotes ?? extras.quotes,
      payments: current?.payments ?? extras.payments,
      interactions: current?.interactions ?? extras.interactions,
      absences: current?.absences ?? extras.absences,
      followUps: current?.followUps ?? extras.followUps,
    };

    const withPlan = current?.treatment !== saved.treatment
      ? ensurePlanForTreatment(saved, saved.treatment, saved.responsible)
      : saved;

    setPatients((currentList) => (
      draft.mode === "create"
        ? [withPlan, ...currentList]
        : currentList.map((patient) => (patient.protocol === draft.protocol ? withPlan : patient))
    ));
    if (draft.mode === "create") {
      setQuery("");
      setTreatmentFilter("");
      setStageFilter("");
      setResponsibleFilter("");
      setStatusFilter("");
    }
    setDraft(null);
    setErrors({});
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      {viewing ? (
        <RecordView
          key={viewing.protocol}
          patient={viewing}
          tags={tags}
          onBack={() => setViewingProtocol(null)}
          onEdit={() => openEdit(viewing)}
          onChange={(next) => {
            setPatients((current) => current.map((item) => (item.protocol === next.protocol ? next : item)));
          }}
        />
      ) : (
        <div className="mx-auto max-w-7xl animate-fade-in">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
              <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Pacientes</h1>
              <p className="text-[13px] text-muted">Cadastro e gerenciamento dos pacientes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
                className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-[13px] font-medium ${
                  filtersActive ? "border-teal bg-white text-teal" : "border-line bg-white hover:bg-surface"
                }`}
              >
                <LuSlidersHorizontal size={15} /> Filtrar pacientes
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy"
              >
                <LuPlus size={15} /> Novo paciente
              </button>
            </div>
          </header>

          <label className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5">
            <LuSearch size={16} className="shrink-0 text-muted" />
            <span className="sr-only">Pesquisar paciente</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar por nome, protocolo, CPF, telefone ou e-mail"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted"
            />
          </label>

          {filtersOpen && (
            <div className="mt-3 rounded-lg border border-line bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SelectField
                  id="filtro-tratamento"
                  label="Tipo de tratamento"
                  value={treatmentFilter || "Todos"}
                  options={["Todos", ...treatments]}
                  onChange={(value) => {
                    const next = value === "Todos" ? "" : value;
                    setTreatmentFilter(next);
                    if (next && isTreatment(next) && stageFilter && !stagesByTreatment[next].includes(stageFilter)) {
                      setStageFilter("");
                    }
                  }}
                />
                <SelectField
                  id="filtro-etapa"
                  label="Etapa do tratamento"
                  value={stageFilter || "Todos"}
                  options={["Todos", ...stageOptions]}
                  onChange={(value) => setStageFilter(value === "Todos" ? "" : value)}
                />
                <SelectField
                  id="filtro-responsavel"
                  label="Responsável"
                  value={responsibleFilter || "Todos"}
                  options={["Todos", ...responsibles]}
                  onChange={(value) => setResponsibleFilter(value === "Todos" ? "" : value)}
                />
                <SelectField
                  id="filtro-status"
                  label="Status"
                  value={statusFilter || "Todos"}
                  options={["Todos", ...statuses]}
                  onChange={(value) => setStatusFilter(value === "Todos" ? "" : value)}
                />
                <SelectField
                  id="filtro-origem"
                  label="Origem"
                  value={originFilter || "Todas"}
                  options={["Todas", ...origins]}
                  onChange={(value) => setOriginFilter(value === "Todas" ? "" : value)}
                />
                <SelectField
                  id="filtro-tag"
                  label="Tag"
                  value={tagFilter ? (tags.find((tag) => tag.id === tagFilter)?.label ?? "Todas") : "Todas"}
                  options={["Todas", ...tags.map((tag) => tag.label)]}
                  onChange={(value) => {
                    if (value === "Todas") {
                      setTagFilter("");
                      return;
                    }
                    setTagFilter(tags.find((tag) => tag.label === value)?.id ?? "");
                  }}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <label className="block min-w-48 flex-1">
                  <span className="text-[11px] font-medium text-muted">Novo segmento</span>
                  <input
                    value={segmentName}
                    onChange={(event) => setSegmentName(event.target.value)}
                    placeholder="Ex.: Ortodontia VIP"
                    className={controlClass}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const name = segmentName.trim();
                    if (!name) return;
                    setCustomSegments((current) => [...current, { id: `seg-${Date.now()}`, name }]);
                    setCustomSegment(name);
                    setSegmentName("");
                  }}
                  className="rounded-md border border-line px-3 py-2 text-[13px] font-medium hover:bg-surface"
                >
                  Criar segmento
                </button>
              </div>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="mt-3 text-[12px] font-medium text-teal hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          <section className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
            <div className="flex flex-col gap-3 bg-linear-to-r from-navy to-navy-soft px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold tracking-tight text-white">Pacientes</h2>
                  <p className="text-[12px] text-white/70">{filtered.length} de {patients.length} pacientes</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {patientFunnelFilters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFunnelFilter(item)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium cursor-pointer transition ${
                      funnelFilter === item ? "bg-white text-teal" : "text-white hover:bg-white/20"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-line bg-surface px-5 py-3">
              {managementSegments.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSegment(item);
                    setCustomSegment("");
                  }}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                    segment === item && !customSegment ? "bg-teal text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink"
                  }`}
                >
                  {item}
                </button>
              ))}
              {customSegments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCustomSegment(item.name);
                    const tag = tags.find((entry) => entry.label.toLowerCase() === item.name.toLowerCase());
                    if (tag) setTagFilter(tag.id);
                  }}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                    customSegment === item.name ? "bg-navy text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[14px] font-medium">Nenhum paciente encontrado</p>
              <p className="mt-1 text-[12px] text-muted">Ajuste a pesquisa ou os filtros para ver outros cadastros.</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-245 text-left">
                    <thead>
                      <tr className="border-b border-line bg-surface text-[11px] font-medium text-muted">
                        <th className="px-5 py-2 font-medium">Paciente</th>
                        <th className="px-3 py-2 font-medium">Tratamento</th>
                        <th className="px-3 py-2 font-medium">Etapa atual</th>
                        <th className="px-3 py-2 font-medium">Último atendimento</th>
                        <th className="px-3 py-2 font-medium">Próxima ação</th>
                        <th className="px-3 py-2 font-medium">Responsável</th>
                        <th className="px-3 py-2 font-medium">Valor</th>
                        <th className="sticky right-0 bg-surface px-3 py-2 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((patient) => (
                        <tr
                          key={patient.protocol}
                          onClick={() => openRecord(patient.protocol)}
                          className="cursor-pointer border-t border-line text-[13px] hover:bg-surface/70"
                        >
                          <td className="px-5 py-3"><PatientIdentity patient={patient} onOpen={() => openRecord(patient.protocol)} /></td>
                          <td className="px-3 py-3">{patient.treatment}</td>
                          <td className="px-3 py-3">{patient.stage}</td>
                          <td className="px-3 py-3 tabular-nums">{formatDate(patient.lastVisit)}</td>
                          <td className="px-3 py-3">{patient.nextAction || "—"}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{patient.responsible}</td>
                          <td className="px-3 py-3 whitespace-nowrap tabular-nums">{formatMoney(patient.value)}</td>
                          <td className="px-3 py-3">
                            <RowMenuButton
                              name={patient.name}
                              expanded={menu?.protocol === patient.protocol}
                              onOpen={(anchor) => openMenu(patient.protocol, anchor)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <ul className="space-y-2 p-3 lg:hidden">
                {filtered.map((patient) => (
                  <li
                    key={patient.protocol}
                    onClick={() => openRecord(patient.protocol)}
                    className="cursor-pointer rounded-lg border border-line bg-white px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold">{patient.name}</p>
                        <p className="text-[11px] text-muted">{patient.protocol}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <StatusBadge status={patient.status} />
                        <RowMenuButton
                          name={patient.name}
                          expanded={menu?.protocol === patient.protocol}
                          onOpen={(anchor) => openMenu(patient.protocol, anchor)}
                        />
                      </div>
                    </div>
                    <p className="mt-2 truncate text-[12px] text-ink">
                      {patient.treatment}
                      <span className="text-muted"> · {patient.stage}</span>
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3 text-[12px] text-muted">
                      <span className="truncate">{patient.nextAction || "Sem próxima ação"}</span>
                      <span className="shrink-0 tabular-nums text-ink">{formatMoney(patient.value)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          </section>
        </div>
      )}

      {menu && menuPatient && (
        <div
          data-patient-menu
          role="menu"
          style={{ top: menu.top, left: menu.left }}
          className="fixed z-40 w-49 rounded-lg border border-line bg-white py-1 shadow-lg"
        >
          <button type="button" role="menuitem" onClick={() => openRecord(menuPatient.protocol)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-surface">
            <LuEye size={14} /> Ver paciente
          </button>
          <button type="button" role="menuitem" onClick={() => openEdit(menuPatient)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-surface">
            <LuPencil size={14} /> Editar paciente
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              downloadRecord(menuPatient);
              setMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-surface"
          >
            <LuDownload size={14} /> Baixar prontuário
          </button>
        </div>
      )}

      {draft && (
        <PatientForm
          draft={draft}
          errors={errors}
          tags={tags}
          onAddTag={(tag) => setTags((current) => [...current, tag])}
          onChange={setDraft}
          onClose={() => {
            setDraft(null);
            setErrors({});
          }}
          onSubmit={savePatient}
        />
      )}
    </main>
  );
}
