import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { LuPencil, LuPlus, LuX } from "react-icons/lu";
import { usePatients } from "./Pacientes";

export type ClinicTreatment = {
  id: string;
  name: string;
  patientKey: string;
  description: string;
  price: string;
  duration: string;
  stages: string;
  actions: string;
  active: boolean;
};

const initialTreatments: ClinicTreatment[] = [
  { id: "avaliacao", name: "Avaliação", patientKey: "Avaliação", description: "Consulta inicial para diagnóstico e plano.", price: "350", duration: "40 min", stages: "Triagem\nConcluída", actions: "Enviar orçamento\nSolicitar exames\nAgendar retorno da avaliação", active: true },
  { id: "limpeza", name: "Limpeza", patientKey: "Limpeza", description: "Profilaxia e orientação de higiene.", price: "180", duration: "50 min", stages: "Agendada\nRealizada", actions: "Profilaxia em 6 meses\nOrientar higiene\nAgendar retorno", active: true },
  { id: "clareamento", name: "Clareamento", patientKey: "Clareamento", description: "Protocolo de clareamento em consultório.", price: "1400", duration: "1 h", stages: "Avaliação\nSessão 1\nSessão 2\nFinalização", actions: "Confirmar sessão 3\nEntregar moldeira\nAvaliar sensibilidade", active: true },
  { id: "restauracao", name: "Restauração", patientKey: "Restauração", description: "Restauração em resina e revisão.", price: "890", duration: "1 h", stages: "Preparo\nRestauração\nRevisão", actions: "Agendar revisão\nEnviar orçamento\nConfirmar adaptação", active: true },
  { id: "canal", name: "Canal", patientKey: "Canal", description: "Tratamento endodôntico.", price: "1600", duration: "1 h 30", stages: "Diagnóstico\nTratamento\nObturação\nAcompanhamento", actions: "Agendar obturação\nSolicitar radiografia\nSem retorno previsto", active: true },
  { id: "implante", name: "Implante dentário", patientKey: "Implante", description: "Do planejamento à prótese sobre implante.", price: "8500", duration: "Conforme etapa", stages: "Planejamento\nCirurgia\nOsseointegração\nPrótese", actions: "Definir próximo atendimento\nConsulta de controle\nAgendar cirurgia", active: true },
  { id: "ortodontia", name: "Ortodontia", patientKey: "Ortodontia", description: "Aparelho e manutenções periódicas.", price: "6200", duration: "40 min", stages: "Avaliação\nInstalação\nManutenção\nContenção", actions: "Troca de arco\nAgendar manutenção\nAjustar aparelho", active: true },
];

const TreatmentsContext = createContext<{
  treatments: ClinicTreatment[];
  setTreatments: (value: ClinicTreatment[] | ((current: ClinicTreatment[]) => ClinicTreatment[])) => void;
} | null>(null);

export function TreatmentsProvider({ children }: { children: ReactNode }) {
  const [treatments, setTreatments] = useState(initialTreatments);
  return <TreatmentsContext.Provider value={{ treatments, setTreatments }}>{children}</TreatmentsContext.Provider>;
}

export function useTreatments() {
  const value = useContext(TreatmentsContext);
  if (!value) throw new Error("useTreatments deve ficar dentro de TreatmentsProvider");
  return value;
}

export function actionsForTreatment(treatments: ClinicTreatment[], patientTreatment: string) {
  const found = treatments.find((item) => item.patientKey === patientTreatment || item.name === patientTreatment);
  return (found?.actions ?? "").split("\n").map((action) => action.trim()).filter(Boolean);
}

const emptyDraft = (): ClinicTreatment => ({
  id: "",
  name: "",
  patientKey: "",
  description: "",
  price: "",
  duration: "",
  stages: "",
  actions: "",
  active: true,
});

function money(value: string) {
  const number = Number(value);
  if (!value.trim() || !Number.isFinite(number)) return "Sem valor padrão";
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Tratamentos() {
  const { patients } = usePatients();
  const { treatments: items, setTreatments: setItems } = useTreatments();
  const [draft, setDraft] = useState<ClinicTreatment | null>(null);
  const [error, setError] = useState("");

  function openCreate() {
    setError("");
    setDraft(emptyDraft());
  }

  function openEdit(item: ClinicTreatment) {
    setError("");
    setDraft({ ...item });
  }

  function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError("Informe o nome do tratamento.");
      return;
    }
    const saved = { ...draft, name: draft.name.trim(), patientKey: draft.patientKey || draft.name.trim() };
    setItems((current) => {
      if (!saved.id) return [{ ...saved, id: crypto.randomUUID(), patientKey: saved.name }, ...current];
      return current.map((item) => (item.id === saved.id ? saved : item));
    });
    setDraft(null);
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Tratamentos</h1>
            <p className="text-[13px] text-muted">Tipos de tratamento oferecidos pela clínica e o fluxo de cada um.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">
            <LuPlus size={15} /> Cadastrar tratamento
          </button>
        </header>

        <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const related = patients.filter((patient) => patient.treatment === item.patientKey);
            const avaliacao = related.filter((patient) => patient.funnelStage === "Avaliação").length;
            const orcamento = related.filter((patient) => patient.funnelStage === "Orçamento" || patient.funnelStage === "Aguardando aprovação").length;
            const tratamento = related.filter((patient) => patient.funnelStage === "Tratamento iniciado" || patient.funnelStage === "Em tratamento").length;
            const retorno = related.filter((patient) => patient.funnelStage === "Retorno").length;
            return (
              <li key={item.id} className={`rounded-lg border bg-white p-4 ${item.active ? "border-line" : "border-line opacity-70"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-semibold">{item.name}</h2>
                    <p className="text-[12px] text-muted">{related.length} {related.length === 1 ? "paciente" : "pacientes"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.active ? "bg-st-concluido/12 text-st-concluido" : "bg-st-agendado/12 text-st-agendado"}`}>
                    {item.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-muted">{item.description}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div><dt className="text-muted">Em avaliação</dt><dd className="font-semibold">{avaliacao}</dd></div>
                  <div><dt className="text-muted">Aguardando orçamento</dt><dd className="font-semibold">{orcamento}</dd></div>
                  <div><dt className="text-muted">Em tratamento</dt><dd className="font-semibold">{tratamento}</dd></div>
                  <div><dt className="text-muted">Em retorno</dt><dd className="font-semibold">{retorno}</dd></div>
                </dl>
                <p className="mt-3 text-[12px]">{money(item.price)}{item.duration ? ` · ${item.duration}` : ""}</p>
                <p className="mt-2 text-[11px] font-medium text-muted">Ações</p>
                <ul className="mt-1 list-disc pl-4 text-[12px]">
                  {item.actions.split("\n").map((action) => action.trim()).filter(Boolean).map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
                <button type="button" onClick={() => openEdit(item)} className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-teal hover:underline">
                  <LuPencil size={13} /> Editar
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="tratamento-titulo"
            onSubmit={(event) => { event.preventDefault(); save(); }}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 sm:max-w-lg sm:rounded-xl"
          >
            <div className="flex items-start justify-between">
              <h2 id="tratamento-titulo" className="text-[20px] font-semibold">{draft.id ? "Editar tratamento" : "Cadastrar tratamento"}</h2>
              <button type="button" aria-label="Fechar" onClick={() => setDraft(null)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface">
                <LuX size={16} />
              </button>
            </div>
            <label className="mt-4 block text-[11px] font-medium text-muted">
              Nome do tratamento
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Descrição
              <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-[11px] font-medium text-muted">
                Valor padrão
                <input type="number" min={0} value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
              </label>
              <label className="block text-[11px] font-medium text-muted">
                Duração estimada
                <input value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} placeholder="40 min" className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
              </label>
            </div>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Ações
              <textarea value={draft.actions} onChange={(event) => setDraft({ ...draft, actions: event.target.value })} rows={4} placeholder="Uma ação por linha" className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Etapas do tratamento
              <textarea value={draft.stages} onChange={(event) => setDraft({ ...draft, stages: event.target.value })} rows={4} placeholder="Uma etapa por linha" className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="mt-3 flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
              Tratamento ativo
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDraft(null)} className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium">Cancelar</button>
              <button type="submit" className="rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
