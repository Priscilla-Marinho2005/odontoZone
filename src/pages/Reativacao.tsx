import { useMemo, useState } from "react";
import { LuPlus, LuSend, LuX } from "react-icons/lu";
import type { Patient } from "../data/clinicPatients";
import { visitsOf } from "../data/clinicPatients";
import { usePatients } from "./Pacientes";

export type RecoveryFilter =
  | "sem-retorno"
  | "inativo-3"
  | "inativo-6"
  | "inativo-12"
  | "faltaram"
  | "cancelaram"
  | "orcamento"
  | "abandonaram";

type Campaign = {
  id: string;
  name: string;
  filter: RecoveryFilter;
  message: string;
  createdAt: string;
  protocols: string[];
  sent: string[];
  responses: { protocol: string; text: string; date: string }[];
  recovered: string[];
};

const filters: { id: RecoveryFilter; label: string }[] = [
  { id: "sem-retorno", label: "Sem retorno" },
  { id: "inativo-3", label: "Inativos há 3 meses" },
  { id: "inativo-6", label: "Inativos há 6 meses" },
  { id: "inativo-12", label: "Inativos há 12 meses" },
  { id: "faltaram", label: "Faltaram" },
  { id: "cancelaram", label: "Cancelaram" },
  { id: "orcamento", label: "Orçamento não aprovado" },
  { id: "abandonaram", label: "Abandonaram tratamento" },
];

function monthsAgo(iso: string) {
  if (!iso) return 999;
  const [year, month, day] = iso.split("-").map(Number);
  const then = new Date(year, (month ?? 1) - 1, day ?? 1);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

function matchesFilter(patient: Patient, filter: RecoveryFilter) {
  const visits = visitsOf(patient);
  if (filter === "sem-retorno") {
    return patient.status === "Aguardando retorno"
      || patient.funnelStage === "Retorno"
      || patient.followUps.some((item) => item.status === "Atrasado");
  }
  if (filter === "inativo-3") return monthsAgo(patient.lastVisit) >= 3 || patient.status === "Inativo";
  if (filter === "inativo-6") return monthsAgo(patient.lastVisit) >= 6;
  if (filter === "inativo-12") return monthsAgo(patient.lastVisit) >= 12;
  if (filter === "faltaram") {
    return patient.absences.some((item) => item.type === "Falta")
      || visits.some((visit) => visit.status === "Falta");
  }
  if (filter === "cancelaram") {
    return patient.absences.some((item) => item.type === "Cancelamento")
      || visits.some((visit) => visit.status === "Cancelado");
  }
  if (filter === "orcamento") {
    return patient.quotes.some((item) => (
      item.status === "Pendente"
      || item.status === "Enviado"
      || item.status === "Visualizado"
      || item.status === "Em negociação"
      || item.status === "Recusado"
      || item.status === "Expirado"
    )) || patient.funnelStage === "Aguardando aprovação";
  }
  return (patient.plans ?? []).some((item) => item.status === "Interrompido")
    || patient.treatments.some((item) => item.status === "Pausado");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function personalize(template: string, patient: Patient) {
  return template
    .replaceAll("[nome]", patient.name.split(" ")[0])
    .replaceAll("[tratamento]", patient.treatment)
    .replaceAll("[valor]", patient.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
}

export default function Reativacao({ onOpenPatient }: { onOpenPatient: (protocol: string) => void }) {
  const { patients, setPatients } = usePatients();
  const [filter, setFilter] = useState<RecoveryFilter>("sem-retorno");
  const [selected, setSelected] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [compose, setCompose] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("Olá, [nome]! Sentimos sua falta na Áurea Odonto. Que tal retomarmos o [tratamento]? Posso agendar um horário?");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const identified = useMemo(() => patients.filter((patient) => matchesFilter(patient, filter)), [patients, filter]);
  const campaign = campaigns.find((item) => item.id === activeId) ?? null;

  const stats = useMemo(() => {
    const contacted = new Set(campaigns.flatMap((item) => item.sent));
    const recovered = new Set(campaigns.flatMap((item) => item.recovered));
    const rate = contacted.size === 0 ? 0 : Math.round((recovered.size / contacted.size) * 100);
    return { lists: campaigns.length, contacted: contacted.size, recovered: recovered.size, rate };
  }, [campaigns]);

  function toggle(protocol: string) {
    setSelected((current) => current.includes(protocol) ? current.filter((item) => item !== protocol) : [...current, protocol]);
  }

  function createCampaign() {
    const protocols = selected.length > 0 ? selected : identified.map((patient) => patient.protocol);
    if (protocols.length === 0) return;
    const created: Campaign = {
      id: `camp-${crypto.randomUUID()}`,
      name: name.trim() || `Reativação · ${filters.find((item) => item.id === filter)?.label}`,
      filter,
      message,
      createdAt: today(),
      protocols,
      sent: [],
      responses: [],
      recovered: [],
    };
    setCampaigns((current) => [created, ...current]);
    setActiveId(created.id);
    setSelected([]);
    setCompose(false);
    setName("");
  }

  function sendAll() {
    if (!campaign) return;
    const pending = campaign.protocols.filter((protocol) => !campaign.sent.includes(protocol));
    setPatients((current) => current.map((patient) => {
      if (!pending.includes(patient.protocol)) return patient;
      return {
        ...patient,
        interactions: [{
          date: today(),
          channel: "WhatsApp",
          summary: `Campanha ${campaign.name}: ${personalize(campaign.message, patient)}`,
        }, ...patient.interactions],
      };
    }));
    setCampaigns((current) => current.map((item) => (
      item.id === campaign.id ? { ...item, sent: [...item.sent, ...pending] } : item
    )));
  }

  function addReply(protocol: string) {
    const text = reply.trim();
    if (!campaign || !text) return;
    setPatients((current) => current.map((patient) => (
      patient.protocol === protocol
        ? { ...patient, interactions: [{ date: today(), channel: "WhatsApp", summary: `Resposta à campanha: ${text}` }, ...patient.interactions] }
        : patient
    )));
    setCampaigns((current) => current.map((item) => (
      item.id === campaign.id
        ? { ...item, responses: [{ protocol, text, date: today() }, ...item.responses] }
        : item
    )));
    setReply("");
  }

  function markRecovered(protocol: string) {
    if (!campaign) return;
    setPatients((current) => current.map((patient) => (
      patient.protocol === protocol
        ? { ...patient, status: "Ativo", funnelStage: "Retorno", nextAction: "Paciente recuperado — agendar retorno" }
        : patient
    )));
    setCampaigns((current) => current.map((item) => (
      item.id === campaign.id && !item.recovered.includes(protocol)
        ? { ...item, recovered: [...item.recovered, protocol] }
        : item
    )));
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Reativação</h1>
            <p className="text-[13px] text-muted">Identifique quem parou de interagir e recupere oportunidades.</p>
          </div>
          <button type="button" onClick={() => setCompose(true)} className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">
            <LuPlus size={15} /> Criar campanha
          </button>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Listas / campanhas", String(stats.lists)],
            ["Pacientes contatados", String(stats.contacted)],
            ["Recuperados", String(stats.recovered)],
            ["Taxa de recuperação", `${stats.rate}%`],
          ].map(([label, value]) => (
            <article key={label} className="rounded-lg border border-line bg-white px-4 py-3">
              <p className="text-[12px] text-muted">{label}</p>
              <p className="mt-1 text-[22px] font-semibold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-5">
          <h2 className="text-[15px] font-semibold">Identificação</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setFilter(item.id); setSelected([]); }}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                  filter === item.id ? "bg-teal text-white" : "border border-line bg-white text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="text-[13px] font-medium">{identified.length} pacientes nesta identificação</p>
            <button type="button" onClick={() => setSelected(identified.map((patient) => patient.protocol))} className="text-[12px] font-medium text-teal hover:underline">
              Selecionar todos
            </button>
          </div>
          {identified.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted">Nenhum paciente neste critério.</p>
          ) : (
            <ul>
              {identified.map((patient) => (
                <li key={patient.protocol} className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
                  <input type="checkbox" checked={selected.includes(patient.protocol)} onChange={() => toggle(patient.protocol)} />
                  <button type="button" onClick={() => onOpenPatient(patient.protocol)} className="min-w-0 flex-1 text-left">
                    <p className="text-[14px] font-semibold hover:text-teal">{patient.name}</p>
                    <p className="text-[12px] text-muted">
                      {patient.protocol} · {patient.status} · última visita {patient.lastVisit.split("-").reverse().join("/")} · {patient.treatment}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-[15px] font-semibold">Campanhas de recuperação</h2>
          {campaigns.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Crie uma lista a partir da identificação para enviar mensagens e acompanhar respostas.</p>
          ) : (
            <div className="mt-3 grid gap-3 lg:grid-cols-[240px_1fr]">
              <ul className="space-y-2">
                {campaigns.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left ${
                        item.id === activeId ? "border-teal bg-teal/8" : "border-line bg-white"
                      }`}
                    >
                      <p className="text-[13px] font-semibold">{item.name}</p>
                      <p className="mt-1 text-[11px] text-muted">{item.protocols.length} pacientes · {item.recovered.length} recuperados</p>
                    </button>
                  </li>
                ))}
              </ul>
              {campaign && (
                <div className="rounded-lg border border-line bg-white px-4 py-4">
                  <p className="text-[12px] text-muted">{filters.find((item) => item.id === campaign.filter)?.label}</p>
                  <h3 className="text-[16px] font-semibold">{campaign.name}</h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-surface px-3 py-2 text-[13px]">{campaign.message}</p>
                  <button type="button" onClick={sendAll} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-teal px-3 py-2 text-[12px] font-medium text-white hover:bg-navy">
                    <LuSend size={14} /> Enviar mensagens personalizadas
                  </button>
                  <ul className="mt-4 space-y-3">
                    {campaign.protocols.map((protocol) => {
                      const patient = patients.find((item) => item.protocol === protocol);
                      if (!patient) return null;
                      const sent = campaign.sent.includes(protocol);
                      const recovered = campaign.recovered.includes(protocol);
                      const answers = campaign.responses.filter((item) => item.protocol === protocol);
                      return (
                        <li key={protocol} className="rounded-lg border border-line px-3 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <button type="button" onClick={() => onOpenPatient(protocol)} className="text-[13px] font-semibold hover:text-teal">{patient.name}</button>
                              <p className="text-[11px] text-muted">
                                {sent ? "Mensagem enviada" : "Na lista"} · {recovered ? "Recuperado" : "Pendente"}
                              </p>
                            </div>
                            {!recovered && (
                              <button type="button" onClick={() => markRecovered(protocol)} className="text-[12px] font-medium text-teal hover:underline">
                                Marcar recuperado
                              </button>
                            )}
                          </div>
                          {answers.map((item, index) => (
                            <p key={`${item.date}-${index}`} className="mt-2 text-[12px]">{item.date.split("-").reverse().join("/")} · {item.text}</p>
                          ))}
                          {sent && !recovered && (
                            <form
                              className="mt-2 flex gap-2"
                              onSubmit={(event) => { event.preventDefault(); addReply(protocol); }}
                            >
                              <input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Registrar resposta" className="min-w-0 flex-1 rounded-md border border-line px-2 py-1.5 text-[12px] outline-none focus:border-teal" />
                              <button type="submit" className="rounded-md border border-line px-2 py-1.5 text-[12px] font-medium">Salvar</button>
                            </form>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {compose && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            onSubmit={(event) => { event.preventDefault(); createCampaign(); }}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 sm:max-w-lg sm:rounded-xl"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-[20px] font-semibold">Campanha de recuperação</h2>
              <button type="button" aria-label="Fechar" onClick={() => setCompose(false)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface">
                <LuX size={16} />
              </button>
            </div>
            <p className="mt-2 text-[12px] text-muted">
              Usa {selected.length > 0 ? `${selected.length} selecionados` : `todos os ${identified.length} da identificação atual`}.
            </p>
            <label className="mt-4 block text-[11px] font-medium text-muted">
              Nome da campanha
              <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Mensagem personalizada
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <p className="mt-1 text-[11px] text-muted">Use [nome], [tratamento] e [valor] para personalizar.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setCompose(false)} className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium">Cancelar</button>
              <button type="submit" className="rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">Criar lista</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
