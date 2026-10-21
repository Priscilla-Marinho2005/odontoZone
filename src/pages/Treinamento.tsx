import { useMemo, useState } from "react";
import { LuImage, LuLink, LuMessageSquareText, LuPlus, LuTrash2, LuX } from "react-icons/lu";

type Kind = "script" | "link" | "image";

type Material = {
  id: string;
  kind: Kind;
  title: string;
  category: string;
  body: string;
  image: string;
};

const categories = [
  "Primeiro contato",
  "Agendamento",
  "Orçamento",
  "Objeção",
  "Pós-atendimento",
  "Clínico",
];

const initialMaterials: Material[] = [
  {
    id: "mat-1",
    kind: "script",
    title: "Primeiro contato no WhatsApp",
    category: "Primeiro contato",
    body: "Olá, [nome]! Aqui é da Áurea Odonto.\nVi que você demonstrou interesse em [tratamento].\nPosso te ajudar a agendar uma avaliação com a Dra. Amanda?",
    image: "",
  },
  {
    id: "mat-2",
    kind: "script",
    title: "Envio de orçamento",
    category: "Orçamento",
    body: "Segue o plano combinado na avaliação.\nValor: [valor]\nCondições: [pagamento]\nQualquer dúvida, estou por aqui para explicar cada etapa.",
    image: "",
  },
  {
    id: "mat-3",
    kind: "link",
    title: "Vídeo: como explicar clareamento",
    category: "Clínico",
    body: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    image: "",
  },
  {
    id: "mat-4",
    kind: "image",
    title: "Antes e depois — referência estética",
    category: "Orçamento",
    body: "Usar apenas com autorização do paciente. Exemplo de comunicação visual.",
    image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80",
  },
];

const kindLabel: Record<Kind, string> = {
  script: "Script",
  link: "Link",
  image: "Imagem",
};

const emptyDraft = (): Omit<Material, "id"> => ({
  kind: "script",
  title: "",
  category: "Primeiro contato",
  body: "",
  image: "",
});

export default function Treinamento() {
  const [items, setItems] = useState(initialMaterials);
  const [filter, setFilter] = useState<"todos" | Kind>("todos");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [error, setError] = useState("");

  const visible = useMemo(
    () => (filter === "todos" ? items : items.filter((item) => item.kind === filter)),
    [items, filter],
  );

  function save() {
    if (!draft.title.trim()) {
      setError("Informe um título.");
      return;
    }
    if (draft.kind === "link" && !draft.body.trim()) {
      setError("Informe o link.");
      return;
    }
    if (draft.kind === "script" && !draft.body.trim()) {
      setError("Cole o script da conversa.");
      return;
    }
    if (draft.kind === "image" && !draft.image) {
      setError("Envie uma imagem.");
      return;
    }
    setItems((current) => [{ ...draft, id: `mat-${crypto.randomUUID()}` }, ...current]);
    setDraft(emptyDraft());
    setError("");
    setOpen(false);
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Treinamento</h1>
            <p className="text-[13px] text-muted">
              Scripts de conversa, links e imagens para treinar a equipe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setError(""); setDraft(emptyDraft()); setOpen(true); }}
            className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy"
          >
            <LuPlus size={15} /> Novo material
          </button>
        </header>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["todos", "script", "link", "image"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                filter === item ? "bg-teal text-white" : "border border-line bg-white text-muted"
              }`}
            >
              {item === "todos" ? "Todos" : kindLabel[item]}
            </button>
          ))}
        </div>

        <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id} className="flex flex-col rounded-xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold text-teal">{kindLabel[item.kind]} · {item.category}</p>
                  <h2 className="mt-1 text-[15px] font-semibold">{item.title}</h2>
                </div>
                <button
                  type="button"
                  aria-label={`Excluir ${item.title}`}
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                  className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-danger"
                >
                  <LuTrash2 size={15} />
                </button>
              </div>
              {item.kind === "script" && (
                <pre className="mt-3 flex-1 whitespace-pre-wrap rounded-lg bg-surface px-3 py-3 text-[12px] leading-relaxed">{item.body}</pre>
              )}
              {item.kind === "link" && (
                <a href={item.body} target="_blank" rel="noreferrer" className="mt-3 break-all text-[13px] font-medium text-teal hover:underline">
                  {item.body}
                </a>
              )}
              {item.kind === "image" && (
                <div className="mt-3">
                  <img src={item.image} alt={item.title} className="h-40 w-full rounded-lg object-cover" />
                  {item.body && <p className="mt-2 text-[12px] text-muted">{item.body}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
        {visible.length === 0 && (
          <p className="mt-8 text-center text-[13px] text-muted">Nenhum material neste filtro.</p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            onSubmit={(event) => { event.preventDefault(); save(); }}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white px-5 py-5 sm:max-w-lg sm:rounded-xl"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-[20px] font-semibold">Novo material</h2>
              <button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface">
                <LuX size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {([
                ["script", "Script", LuMessageSquareText],
                ["link", "Link", LuLink],
                ["image", "Imagem", LuImage],
              ] as const).map(([kind, label, Icon]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, kind }))}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-[12px] font-medium ${
                    draft.kind === kind ? "border-teal bg-teal/8 text-teal" : "border-line text-muted"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-[11px] font-medium text-muted">
              Título
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
            </label>
            <label className="mt-3 block text-[11px] font-medium text-muted">
              Categoria
              <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal">
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            {draft.kind === "script" && (
              <label className="mt-3 block text-[11px] font-medium text-muted">
                Script da conversa
                <textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} rows={7} placeholder="Cole o roteiro que a equipe deve seguir" className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
              </label>
            )}
            {draft.kind === "link" && (
              <label className="mt-3 block text-[11px] font-medium text-muted">
                Link
                <input type="url" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="https://" className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
              </label>
            )}
            {draft.kind === "image" && (
              <>
                <label className="mt-3 block text-[11px] font-medium text-muted">
                  Imagem
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full text-[13px]"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setDraft((current) => ({ ...current, image: String(reader.result) }));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {draft.image && <img src={draft.image} alt="" className="mt-2 h-32 w-full rounded-lg object-cover" />}
                <label className="mt-3 block text-[11px] font-medium text-muted">
                  Legenda (opcional)
                  <textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} rows={3} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-teal" />
                </label>
              </>
            )}
            {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-line px-4 py-2.5 text-[13px] font-medium">Cancelar</button>
              <button type="submit" className="rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white hover:bg-navy">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
