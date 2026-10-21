import { useMemo, useState } from "react";
import { LuLock, LuPlus, LuShield } from "react-icons/lu";
import type { ClinicUser, Patient } from "../data/clinicPatients";
import { clinicUsers, visitsOf } from "../data/clinicPatients";
import type {
  AnamnesisVersion,
  ChartAction,
  ChartPermission,
  ClinicalChart,
  CustomField,
  DocumentCategory,
  EvolutionEntry,
  PatientDocument,
} from "../data/clinicalRecord";
import {
  currentAnamnesis,
  documentCategories,
  emptyAnamnesis,
  emptyChart,
  permissionOf,
} from "../data/clinicalRecord";

const actionLabels: Record<ChartAction, string> = {
  viewClinical: "Ver clínico",
  editAnamnesis: "Editar anamnese",
  editEvolution: "Editar evolução",
  viewDocuments: "Ver documentos",
  manageDocuments: "Anexar/organizar",
  manageAccess: "Gerir acesso",
};

function nowIso() {
  return new Date().toISOString();
}

function fmt(iso: string) {
  const date = iso.slice(0, 10);
  const time = iso.includes("T") ? iso.slice(11, 16) : "";
  const [y, m, d] = date.split("-");
  return time ? `${d}/${m}/${y} ${time}` : `${d}/${m}/${y}`;
}

function audit(chart: ClinicalChart, user: ClinicUser, action: string): ClinicalChart {
  return {
    ...chart,
    audit: [{ id: `aud-${Date.now()}`, at: nowIso(), user, action }, ...chart.audit].slice(0, 80),
  };
}

export function ClinicalRecord({
  patient,
  onChange,
  currentUser,
}: {
  patient: Patient;
  onChange: (next: Patient) => void;
  currentUser: ClinicUser;
}) {
  const chart = patient.chart ?? emptyChart();
  const perm = permissionOf(chart, currentUser);
  const [tab, setTab] = useState<"Anamnese" | "Evolução" | "Documentos" | "Segurança">("Anamnese");

  function saveChart(next: ClinicalChart, action: string) {
    onChange({ ...patient, chart: audit(next, currentUser, action) });
  }

  if (!perm.viewClinical) {
    return (
      <section className="mt-5 rounded-xl border border-line bg-white px-5 py-10 text-center">
        <LuLock className="mx-auto text-muted" size={28} />
        <p className="mt-3 text-[15px] font-semibold">Acesso restrito</p>
        <p className="mt-1 text-[13px] text-muted">Seu perfil ({currentUser}) não visualiza informações clínicas deste paciente.</p>
      </section>
    );
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto">
          {(["Anamnese", "Evolução", "Documentos", "Segurança"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${tab === item ? "bg-navy text-white" : "border border-line bg-white text-muted hover:text-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted">Usuário: {currentUser}</p>
      </div>
      {tab === "Anamnese" && <AnamnesisPanel chart={chart} perm={perm} user={currentUser} onSave={saveChart} />}
      {tab === "Evolução" && <EvolutionPanel patient={patient} chart={chart} perm={perm} user={currentUser} onSave={saveChart} />}
      {tab === "Documentos" && <DocumentsPanel chart={chart} perm={perm} user={currentUser} onSave={saveChart} />}
      {tab === "Segurança" && <SecurityPanel chart={chart} perm={perm} user={currentUser} onSave={saveChart} />}
    </div>
  );
}

function AnamnesisPanel({
  chart, perm, user, onSave,
}: {
  chart: ClinicalChart;
  perm: ChartPermission;
  user: ClinicUser;
  onSave: (next: ClinicalChart, action: string) => void;
}) {
  const current = currentAnamnesis(chart);
  const [draft, setDraft] = useState<AnamnesisVersion>(() => current ?? emptyAnamnesis(user));
  const [compareId, setCompareId] = useState(chart.anamnesis[1]?.id ?? "");
  const previous = chart.anamnesis.find((item) => item.id === compareId) ?? chart.anamnesis[1];

  function save() {
    const version: AnamnesisVersion = { ...draft, id: `anm-${Date.now()}`, savedAt: nowIso(), author: user };
    onSave({ ...chart, anamnesis: [version, ...chart.anamnesis] }, "Atualizou a ficha de anamnese.");
    setDraft(version);
  }

  function addCustom() {
    const field: CustomField = { id: `cf-${Date.now()}`, label: "Campo personalizado", value: "" };
    setDraft({ ...draft, customFields: [...draft.customFields, field] });
  }

  const listField = (label: string, values: string[], key: "allergies" | "medications") => (
    <label className="block text-[11px] font-medium text-muted">
      {label} (separar por vírgula)
      <input
        disabled={!perm.editAnamnesis}
        value={values.join(", ")}
        onChange={(event) => setDraft({
          ...draft,
          [key]: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
        })}
        className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-teal disabled:bg-surface"
      />
    </label>
  );

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
      <section className="rounded-xl border border-line bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold">Ficha de anamnese</h3>
          {perm.editAnamnesis && (
            <button type="button" onClick={save} className="rounded-lg bg-teal px-3 py-1.5 text-[12px] font-medium text-white hover:bg-navy">
              Salvar versão
            </button>
          )}
        </div>
        <div className="mt-3 grid gap-3">
          <label className="block text-[11px] font-medium text-muted">
            Histórico médico
            <textarea disabled={!perm.editAnamnesis} value={draft.medicalHistory} onChange={(event) => setDraft({ ...draft, medicalHistory: event.target.value })} rows={3} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-teal disabled:bg-surface" />
          </label>
          {listField("Alergias", draft.allergies, "allergies")}
          {listField("Medicamentos utilizados", draft.medications, "medications")}
          <label className="block text-[11px] font-medium text-muted">
            Condições clínicas
            <textarea disabled={!perm.editAnamnesis} value={draft.conditions} onChange={(event) => setDraft({ ...draft, conditions: event.target.value })} rows={2} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-teal disabled:bg-surface" />
          </label>
          <label className="block text-[11px] font-medium text-muted">
            Observações clínicas
            <textarea disabled={!perm.editAnamnesis} value={draft.observations} onChange={(event) => setDraft({ ...draft, observations: event.target.value })} rows={2} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-teal disabled:bg-surface" />
          </label>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted">Campos personalizados</p>
              {perm.editAnamnesis && (
                <button type="button" onClick={addCustom} className="inline-flex items-center gap-1 text-[12px] font-medium text-teal">
                  <LuPlus size={14} /> Campo
                </button>
              )}
            </div>
            <div className="mt-2 space-y-2">
              {draft.customFields.map((field, index) => (
                <div key={field.id} className="grid gap-2 sm:grid-cols-2">
                  <input disabled={!perm.editAnamnesis} value={field.label} onChange={(event) => setDraft({
                    ...draft,
                    customFields: draft.customFields.map((item, i) => i === index ? { ...item, label: event.target.value } : item),
                  })} className="rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal disabled:bg-surface" />
                  <input disabled={!perm.editAnamnesis} value={field.value} onChange={(event) => setDraft({
                    ...draft,
                    customFields: draft.customFields.map((item, i) => i === index ? { ...item, value: event.target.value } : item),
                  })} className="rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal disabled:bg-surface" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <section className="rounded-xl border border-line bg-white px-5 py-4">
          <h3 className="text-[15px] font-semibold">Histórico das informações</h3>
          {chart.anamnesis.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">Nenhuma versão salva.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {chart.anamnesis.map((item) => (
                <li key={item.id} className="rounded-lg border border-line px-3 py-2 text-[12px]">
                  <p className="font-medium">{fmt(item.savedAt)} · {item.author}</p>
                  <p className="mt-1 text-muted line-clamp-2">{item.medicalHistory || item.observations}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        {previous && (
          <section className="rounded-xl border border-line bg-white px-5 py-4">
            <h3 className="text-[15px] font-semibold">Comparar versões</h3>
            <select value={previous.id} onChange={(event) => setCompareId(event.target.value)} className="mt-2 w-full rounded-md border border-line px-3 py-2 text-[13px]">
              {chart.anamnesis.slice(1).map((item) => (
                <option key={item.id} value={item.id}>{fmt(item.savedAt)}</option>
              ))}
            </select>
            <dl className="mt-3 space-y-2 text-[12px]">
              <div><dt className="text-muted">Alergias (anterior)</dt><dd>{previous.allergies.join(", ") || "—"}</dd></div>
              <div><dt className="text-muted">Alergias (atual)</dt><dd>{draft.allergies.join(", ") || "—"}</dd></div>
              <div><dt className="text-muted">Medicamentos (anterior)</dt><dd>{previous.medications.join(", ") || "—"}</dd></div>
              <div><dt className="text-muted">Medicamentos (atual)</dt><dd>{draft.medications.join(", ") || "—"}</dd></div>
            </dl>
          </section>
        )}
      </aside>
    </div>
  );
}

function EvolutionPanel({
  patient, chart, perm, user, onSave,
}: {
  patient: Patient;
  chart: ClinicalChart;
  perm: ChartPermission;
  user: ClinicUser;
  onSave: (next: ClinicalChart, action: string) => void;
}) {
  const visits = useMemo(() => visitsOf(patient), [patient]);
  const [visitKey, setVisitKey] = useState(() => visits[0] ? `${visits[0].date}|${visits[0].time}|${visits[0].procedure}` : "");
  const [diagnosis, setDiagnosis] = useState("");
  const [proceduresDone, setProceduresDone] = useState("");
  const [observations, setObservations] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  function add() {
    if (!perm.editEvolution) return;
    const [visitDate = "", visitTime = "", visitProcedure = ""] = visitKey.split("|");
    const entry: EvolutionEntry = {
      id: `evo-${Date.now()}`,
      date: visitDate || nowIso().slice(0, 10),
      author: user,
      visitDate,
      visitTime,
      visitProcedure,
      diagnosis: diagnosis.trim(),
      proceduresDone: proceduresDone.trim(),
      observations: observations.trim(),
      changes: [{ at: nowIso(), author: user, summary: "Evolução registrada." }],
    };
    onSave({ ...chart, evolutions: [entry, ...chart.evolutions] }, `Registrou evolução${visitProcedure ? ` do atendimento ${visitProcedure}` : ""}.`);
    setDiagnosis("");
    setProceduresDone("");
    setObservations("");
  }

  function applyEdit(id: string) {
    const summary = editText.trim();
    if (!summary) return;
    onSave({
      ...chart,
      evolutions: chart.evolutions.map((item) => item.id !== id ? item : {
        ...item,
        observations: `${item.observations}\n${summary}`.trim(),
        changes: [{ at: nowIso(), author: user, summary: `Alteração: ${summary}` }, ...item.changes],
      }),
    }, "Alterou uma evolução clínica.");
    setEditing(null);
    setEditText("");
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="rounded-xl border border-line bg-white px-5 py-4">
        <h3 className="text-[15px] font-semibold">Nova evolução</h3>
        {!perm.editEvolution && <p className="mt-2 text-[12px] text-muted">Sem permissão para registrar evolução.</p>}
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Atendimento associado
          <select value={visitKey} onChange={(event) => setVisitKey(event.target.value)} disabled={!perm.editEvolution} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal disabled:bg-surface">
            <option value="">Sem vínculo</option>
            {visits.map((visit) => (
              <option key={`${visit.date}-${visit.time}-${visit.procedure}`} value={`${visit.date}|${visit.time}|${visit.procedure}`}>
                {visit.date} {visit.time} · {visit.procedure}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Diagnóstico
          <input value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} disabled={!perm.editEvolution} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal disabled:bg-surface" />
        </label>
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Procedimentos realizados
          <input value={proceduresDone} onChange={(event) => setProceduresDone(event.target.value)} disabled={!perm.editEvolution} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal disabled:bg-surface" />
        </label>
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Observações do atendimento
          <textarea value={observations} onChange={(event) => setObservations(event.target.value)} disabled={!perm.editEvolution} rows={3} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal disabled:bg-surface" />
        </label>
        {perm.editEvolution && (
          <button type="button" onClick={add} className="mt-3 rounded-lg bg-teal px-3 py-2 text-[12px] font-medium text-white hover:bg-navy">Registrar</button>
        )}
      </section>
      <section className="rounded-xl border border-line bg-white px-5 py-4">
        <h3 className="text-[15px] font-semibold">Histórico de evolução</h3>
        {chart.evolutions.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">Nenhuma evolução registrada.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {chart.evolutions.map((item) => (
              <li key={item.id} className="rounded-lg border border-line px-3 py-3">
                <p className="text-[13px] font-semibold">{item.visitProcedure || "Evolução"} · {item.author}</p>
                <p className="text-[11px] text-muted">{fmt(item.date)}{item.visitTime ? ` · ${item.visitTime}` : ""}</p>
                {item.diagnosis && <p className="mt-2 text-[12px]"><span className="text-muted">Diagnóstico:</span> {item.diagnosis}</p>}
                {item.proceduresDone && <p className="text-[12px]"><span className="text-muted">Procedimentos:</span> {item.proceduresDone}</p>}
                {item.observations && <p className="mt-1 text-[13px]">{item.observations}</p>}
                {item.changes.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-line pt-2 text-[11px] text-muted">
                    {item.changes.map((change) => (
                      <li key={change.at}>{fmt(change.at)} · {change.author}: {change.summary}</li>
                    ))}
                  </ul>
                )}
                {perm.editEvolution && (
                  editing === item.id ? (
                    <div className="mt-2 flex gap-2">
                      <input value={editText} onChange={(event) => setEditText(event.target.value)} className="flex-1 rounded-md border border-line px-2 py-1.5 text-[12px]" placeholder="Complemento / correção" />
                      <button type="button" onClick={() => applyEdit(item.id)} className="text-[12px] font-medium text-teal">Salvar</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setEditing(item.id); setEditText(""); }} className="mt-2 text-[12px] font-medium text-teal">Registrar alteração</button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DocumentsPanel({
  chart, perm, user, onSave,
}: {
  chart: ClinicalChart;
  perm: ChartPermission;
  user: ClinicUser;
  onSave: (next: ClinicalChart, action: string) => void;
}) {
  const [category, setCategory] = useState<DocumentCategory>("Documento");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<DocumentCategory | "Todos">("Todos");
  const visible = chart.documents.filter((doc) => {
    if (!perm.viewDocuments) return false;
    if (doc.allowedUsers.length > 0 && !doc.allowedUsers.includes(user) && !perm.manageAccess) return false;
    if (filter !== "Todos" && doc.category !== filter) return false;
    return true;
  });

  function onFiles(files: FileList | null) {
    if (!files || !perm.manageDocuments) return;
    const readers = Array.from(files).map((file) => new Promise<PatientDocument>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: `doc-${Date.now()}-${file.name}`,
        name: file.name,
        category,
        uploadedAt: nowIso(),
        uploadedBy: user,
        note: note.trim(),
        dataUrl: String(reader.result ?? ""),
        mime: file.type,
        allowedUsers: [...clinicUsers],
      });
      reader.readAsDataURL(file);
    }));
    void Promise.all(readers).then((docs) => {
      onSave({ ...chart, documents: [...docs, ...chart.documents] }, `Anexou ${docs.length} arquivo(s) (${category}).`);
      setNote("");
    });
  }

  function setAccess(id: string, allowedUsers: ClinicUser[]) {
    onSave({
      ...chart,
      documents: chart.documents.map((doc) => doc.id === id ? { ...doc, allowedUsers } : doc),
    }, "Atualizou o acesso de um documento.");
  }

  return (
    <div className="mt-4 space-y-4">
      {perm.manageDocuments && (
        <section className="rounded-xl border border-line bg-white px-5 py-4">
          <h3 className="text-[15px] font-semibold">Anexar ao prontuário</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-[11px] font-medium text-muted">
              Categoria
              <select value={category} onChange={(event) => setCategory(event.target.value as DocumentCategory)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px]">
                {documentCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-[11px] font-medium text-muted sm:col-span-2">
              Observação
              <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px]" />
            </label>
          </div>
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={(event) => onFiles(event.target.files)} className="mt-3 text-[13px]" />
        </section>
      )}
      <section className="rounded-xl border border-line bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold">Arquivos do paciente</h3>
          <select value={filter} onChange={(event) => setFilter(event.target.value as DocumentCategory | "Todos")} className="rounded-md border border-line px-3 py-1.5 text-[12px]">
            <option value="Todos">Todas as categorias</option>
            {documentCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        {!perm.viewDocuments ? (
          <p className="mt-3 text-[13px] text-muted">Sem permissão para ver documentos.</p>
        ) : visible.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">Nenhum documento nesta categoria.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {visible.map((doc) => (
              <li key={doc.id} className="rounded-lg border border-line p-3">
                <p className="text-[11px] font-semibold tracking-wide text-teal uppercase">{doc.category}</p>
                <p className="mt-1 text-[13px] font-semibold">{doc.name}</p>
                <p className="text-[11px] text-muted">{fmt(doc.uploadedAt)} · {doc.uploadedBy}</p>
                {doc.note && <p className="mt-1 text-[12px]">{doc.note}</p>}
                {doc.dataUrl.startsWith("data:image") && (
                  <img src={doc.dataUrl} alt="" className="mt-2 max-h-40 w-full rounded-md object-cover" />
                )}
                {doc.dataUrl && !doc.dataUrl.startsWith("data:image") && (
                  <a href={doc.dataUrl} download={doc.name} className="mt-2 inline-block text-[12px] font-medium text-teal">Baixar</a>
                )}
                {perm.manageAccess && (
                  <label className="mt-2 block text-[11px] text-muted">
                    Quem pode ver
                    <select
                      multiple
                      value={doc.allowedUsers}
                      onChange={(event) => setAccess(doc.id, Array.from(event.target.selectedOptions).map((opt) => opt.value as ClinicUser))}
                      className="mt-1 h-20 w-full rounded-md border border-line px-2 py-1 text-[12px]"
                    >
                      {clinicUsers.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SecurityPanel({
  chart, perm, user, onSave,
}: {
  chart: ClinicalChart;
  perm: ChartPermission;
  user: ClinicUser;
  onSave: (next: ClinicalChart, action: string) => void;
}) {
  function toggle(target: ClinicUser, action: ChartAction) {
    if (!perm.manageAccess) return;
    const current = permissionOf(chart, target);
    const nextPerm: ChartPermission = { ...current, [action]: !current[action] };
    onSave({
      ...chart,
      permissions: { ...chart.permissions, [target]: nextPerm },
    }, `Alterou permissão ${actionLabels[action]} de ${target}.`);
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
      <section className="overflow-x-auto rounded-xl border border-line bg-white px-5 py-4">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold"><LuShield size={16} /> Permissões do prontuário</h3>
        {!perm.manageAccess && <p className="mt-2 text-[12px] text-muted">Somente quem gerencia acesso altera esta tabela. Você está como {user}.</p>}
        <table className="mt-3 w-full min-w-140 text-left text-[12px]">
          <thead>
            <tr className="text-muted">
              <th className="pb-2 pr-3 font-medium">Usuário</th>
              {(Object.keys(actionLabels) as ChartAction[]).map((action) => (
                <th key={action} className="pb-2 pr-2 font-medium">{actionLabels[action]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clinicUsers.map((item) => {
              const row = permissionOf(chart, item);
              return (
                <tr key={item} className="border-t border-line">
                  <td className="py-2 pr-3 font-medium">{item}</td>
                  {(Object.keys(actionLabels) as ChartAction[]).map((action) => (
                    <td key={action} className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={row[action]}
                        disabled={!perm.manageAccess}
                        onChange={() => toggle(item, action)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-muted">Padrão: dentistas editam o clínico; recepção visualiza; financeiro não acessa. A Dra. Amanda gerencia o acesso.</p>
      </section>
      <section className="rounded-xl border border-line bg-white px-5 py-4">
        <h3 className="text-[15px] font-semibold">Auditoria</h3>
        {chart.audit.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">Nenhuma ação registrada.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-[12px]">
            {chart.audit.map((item) => (
              <li key={item.id} className="rounded-lg border border-line px-3 py-2">
                <p className="font-medium">{item.user}</p>
                <p className="text-muted">{fmt(item.at)}</p>
                <p className="mt-1">{item.action}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
