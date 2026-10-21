import { useState } from "react";
import type { Patient } from "../data/clinicPatients";
import type { ToothEvent, ToothProcedure } from "../data/odontogram";
import {
  currentOf,
  deciduousLower,
  deciduousUpper,
  dentitionOf,
  historyOf,
  labelOf,
  permanentLower,
  permanentUpper,
  procedureColor,
  toothProcedures,
} from "../data/odontogram";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return iso.split("-").reverse().join("/");
}

function ToothButton({
  fdi,
  event,
  selected,
  onToggle,
}: {
  fdi: string;
  event: ToothEvent | null;
  selected: boolean;
  onToggle: () => void;
}) {
  const extracted = event?.kind === "Extração";
  const color = event ? procedureColor[event.kind] : "bg-white text-ink border-line";
  return (
    <button
      type="button"
      onClick={onToggle}
      title={`${fdi} · ${labelOf(event)}`}
      className={`flex h-12 w-8 flex-col items-center justify-end rounded-b-2xl rounded-t-md border text-[10px] font-semibold ${color} ${
        selected ? "ring-2 ring-teal" : ""
      } ${extracted ? "opacity-45 line-through" : ""}`}
    >
      <span className="mb-1">{fdi}</span>
    </button>
  );
}

function Arch({
  teeth,
  events,
  selected,
  onToggle,
}: {
  teeth: string[];
  events: ToothEvent[];
  selected: string[];
  onToggle: (fdi: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {teeth.map((fdi) => (
        <ToothButton
          key={fdi}
          fdi={fdi}
          event={currentOf(events, fdi)}
          selected={selected.includes(fdi)}
          onToggle={() => onToggle(fdi)}
        />
      ))}
    </div>
  );
}

export function OdontogramaChart({
  patient,
  onChange,
}: {
  patient: Patient;
  onChange: (next: Patient) => void;
}) {
  const events = patient.odontogram ?? [];
  const [dentition, setDentition] = useState<"permanente" | "deciduo" | "ambos">("permanente");
  const [selected, setSelected] = useState<string[]>([]);
  const [kind, setKind] = useState<ToothProcedure>("Cárie");
  const [customName, setCustomName] = useState("");
  const [notes, setNotes] = useState("");
  const [planId, setPlanId] = useState("");
  const [date, setDate] = useState(today);
  const [customKinds, setCustomKinds] = useState<string[]>([]);
  const focus = selected.at(-1) ?? null;
  const showPermanent = dentition !== "deciduo";
  const showDeciduous = dentition !== "permanente";

  function toggle(fdi: string) {
    setSelected((current) => current.includes(fdi) ? current.filter((item) => item !== fdi) : [...current, fdi]);
  }

  function register() {
    if (selected.length === 0) return;
    const name = kind === "Personalizado" ? customName.trim() : undefined;
    if (kind === "Personalizado" && !name) return;
    const created: ToothEvent[] = selected.map((fdi) => ({
      id: `od-${crypto.randomUUID()}`,
      fdi,
      date,
      kind,
      customName: name,
      notes: notes.trim(),
      planId: planId || undefined,
    }));
    onChange({
      ...patient,
      odontogram: [...created, ...events],
      procedures: [
        ...selected.map((fdi) => ({
          date,
          name: name || kind,
          tooth: fdi,
          professional: patient.responsible,
          notes: notes.trim(),
        })),
        ...patient.procedures,
      ],
    });
    if (name && !customKinds.includes(name)) setCustomKinds((current) => [name, ...current]);
    setNotes("");
    setSelected([]);
  }

  const history = focus ? historyOf(events, focus) : [];
  const current = focus ? currentOf(events, focus) : null;
  const previous = history[1] ?? null;
  const plans = patient.plans ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="rounded-xl border border-line bg-white px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">Odontograma</h2>
          <div className="inline-flex overflow-hidden rounded-lg border border-line">
            {(["permanente", "deciduo", "ambos"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDentition(item)}
                className={`px-3 py-1.5 text-[12px] font-medium ${dentition === item ? "bg-teal text-white" : "text-muted hover:bg-surface"}`}
              >
                {item === "permanente" ? "Permanentes" : item === "deciduo" ? "Decíduos" : "Ambos"}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[12px] text-muted">Clique nos dentes para selecionar. A cor mostra a condição atual.</p>
        <div className="mt-4 space-y-4">
          {showPermanent && (
            <div>
              <p className="mb-2 text-center text-[11px] font-medium text-muted">Arcada superior permanente</p>
              <Arch teeth={permanentUpper} events={events} selected={selected} onToggle={toggle} />
              <p className="mt-4 mb-2 text-center text-[11px] font-medium text-muted">Arcada inferior permanente</p>
              <Arch teeth={permanentLower} events={events} selected={selected} onToggle={toggle} />
            </div>
          )}
          {showDeciduous && (
            <div>
              <p className="mb-2 text-center text-[11px] font-medium text-muted">Decíduos superiores</p>
              <Arch teeth={deciduousUpper} events={events} selected={selected} onToggle={toggle} />
              <p className="mt-4 mb-2 text-center text-[11px] font-medium text-muted">Decíduos inferiores</p>
              <Arch teeth={deciduousLower} events={events} selected={selected} onToggle={toggle} />
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-line bg-white px-2 py-1 text-[11px]">Hígido</span>
          {toothProcedures.map((item) => (
            <span key={item} className={`rounded-full border px-2 py-1 text-[11px] ${procedureColor[item]}`}>{item}</span>
          ))}
        </div>
      </section>

      <aside className="rounded-xl border border-line bg-white px-4 py-4">
        <h3 className="text-[15px] font-semibold">Registrar</h3>
        <p className="mt-1 text-[12px] text-muted">
          {selected.length === 0 ? "Nenhum dente selecionado." : `Dentes: ${selected.join(", ")}`}
        </p>
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Procedimento
          <select value={kind} onChange={(event) => setKind(event.target.value as ToothProcedure)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
            {toothProcedures.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        {kind === "Personalizado" && (
          <label className="mt-3 block text-[11px] font-medium text-muted">
            Nome personalizado
            <input value={customName} onChange={(event) => setCustomName(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
          </label>
        )}
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Data
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
        </label>
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Plano de tratamento
          <select value={planId} onChange={(event) => setPlanId(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
            <option value="">Sem plano</option>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </select>
        </label>
        <label className="mt-3 block text-[11px] font-medium text-muted">
          Observações
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
        </label>
        <button type="button" onClick={register} className="mt-3 w-full rounded-md bg-teal px-3 py-2 text-[13px] font-medium text-white hover:bg-navy">
          Registrar nos dentes
        </button>

        {focus && (
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="text-[15px] font-semibold">Dente {focus}</h3>
            <p className="text-[12px] text-muted">{dentitionOf(focus) === "deciduo" ? "Decíduo" : "Permanente"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-lg border border-line px-3 py-2">
                <p className="text-muted">Anterior</p>
                <p className="mt-1 font-semibold">{labelOf(previous)}</p>
                <p className="text-muted">{previous ? formatDate(previous.date) : "—"}</p>
              </div>
              <div className="rounded-lg border border-line px-3 py-2">
                <p className="text-muted">Atual</p>
                <p className="mt-1 font-semibold">{labelOf(current)}</p>
                <p className="text-muted">{current ? formatDate(current.date) : "—"}</p>
              </div>
            </div>
            <h4 className="mt-4 text-[13px] font-semibold">Histórico</h4>
            {history.length === 0 ? (
              <p className="mt-2 text-[12px] text-muted">Sem alterações neste dente.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {history.map((item) => (
                  <li key={item.id} className="text-[12px]">
                    <p className="font-medium">{labelOf(item)}</p>
                    <p className="text-muted">
                      {formatDate(item.date)}
                      {item.planId ? ` · ${plans.find((plan) => plan.id === item.planId)?.name ?? "plano"}` : ""}
                    </p>
                    {item.notes && <p>{item.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
