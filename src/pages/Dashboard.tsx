import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuUsers, LuActivity, LuCircleDollarSign, LuMessageCircle, LuPlus } from "react-icons/lu";

/* ---------- Tipos ---------- */
type Stat = { label: string; value: string; sub: string; icon: IconType };
type FunnelItem = { label: string; value: number; highlight?: boolean };
type ScheduleItem = { time: string; name: string; type: string };

type Status =
  | "Agendado"
  | "Confirmado"
  | "Em atendimento"
  | "Concluído"
  | "Atrasado"
  | "Cancelado"
  | "Retorno";

type Appointment = {
  time: string;
  patient: string;
  treatment: string;
  responsible: string;
  status: Status;
};

/* Classes completas (o Tailwind precisa enxergá-las inteiras) */
const statusStyle: Record<Status, { badge: string; dot: string }> = {
  Agendado: { badge: "bg-st-agendado/12 text-st-agendado", dot: "bg-st-agendado" },
  Confirmado: { badge: "bg-st-confirmado/12 text-st-confirmado", dot: "bg-st-confirmado" },
  "Em atendimento": { badge: "bg-st-atendimento/12 text-st-atendimento", dot: "bg-st-atendimento" },
  Concluído: { badge: "bg-st-concluido/12 text-st-concluido", dot: "bg-st-concluido" },
  Atrasado: { badge: "bg-st-atrasado/12 text-st-atrasado", dot: "bg-st-atrasado" },
  Cancelado: { badge: "bg-st-cancelado/12 text-st-cancelado", dot: "bg-st-cancelado" },
  Retorno: { badge: "bg-st-retorno/12 text-st-retorno", dot: "bg-st-retorno" },
};

/* ---------- Dados ---------- */
const stats: Stat[] = [
  { label: "Total de pacientes", value: "248", sub: "+12 este mês", icon: LuUsers },
  { label: "Em tratamento", value: "68", sub: "27% da base", icon: LuActivity },
  { label: "Precisam de contato", value: "8", sub: "3 prioritários", icon: LuMessageCircle },
  { label: "A receber", value: "R$ 13.420", sub: "5 parcelas próximas", icon: LuCircleDollarSign },
];

const agenda: Appointment[] = [
  { time: "08:00", patient: "Fernanda Lima", treatment: "Limpeza", responsible: "Dra. Priscila", status: "Concluído" },
  { time: "09:00", patient: "Roberto Alves", treatment: "Canal", responsible: "Dr. Rafael", status: "Cancelado" },
  { time: "10:00", patient: "Maria Oliveira", treatment: "Clareamento", responsible: "Dra. Priscila", status: "Em atendimento" },
  { time: "11:00", patient: "Luciana Prado", treatment: "Ortodontia - manutenção", responsible: "Dr. Rafael", status: "Atrasado" },
  { time: "14:30", patient: "João Pedro Silva", treatment: "Implante", responsible: "Dr. Rafael", status: "Confirmado" },
  { time: "15:00", patient: "Ana Beatriz Santos", treatment: "Avaliação", responsible: "Dra. Priscila", status: "Agendado" },
  { time: "16:00", patient: "Carlos Henrique", treatment: "Revisão de restauração", responsible: "Dra. Priscila", status: "Retorno" },
];

const funnel: FunnelItem[] = [
  { label: "Novos leads", value: 32 },
  { label: "Avaliações realizadas", value: 24 },
  { label: "Orçamentos enviados", value: 18 },
  { label: "Tratamentos aprovados", value: 11, highlight: true },
];

const schedule: ScheduleItem[] = [
  { time: "10:00", name: "Maria Oliveira", type: "Clareamento" },
  { time: "14:30", name: "João Pedro Silva", type: "Implante" },
  { time: "16:00", name: "Ana Beatriz Santos", type: "Avaliação" },
];

/* ---------- Card base ---------- */
type CardProps = {
  className?: string;
  children: ReactNode;
};

function Card({ className = "", children }: CardProps) {
  return (
    <section className={`rounded-lg border border-line bg-white ${className}`}>{children}</section>
  );
}

/* ---------- Status ---------- */
function StatusBadge({ status }: { status: Status }) {
  const { badge, dot } = statusStyle[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${badge}`}>
      <span className={`size-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

/* ---------- Página ---------- */
export default function Dashboard() {
  return (
    <main className="flex-1 overflow-y-auto bg-surface px-8 py-6">
      <div className="mx-auto max-w-7xl animate-fade-in">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Bom dia, Priscila</h1>
            <p className="text-[13px] text-muted">
              Segunda-feira, 5 de outubro · Veja o que precisa da sua atenção hoje.
            </p>
          </div>
          <button className="mt-1 flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky">
            <LuPlus size={15} /> Novo paciente
          </button>
        </header>

        {/* Indicadores */}
        <Card className="mt-5 grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x">
          {stats.map(({ label, value, sub, icon: Icon }) => (
            <div key={label} className="relative px-5 py-4">
              <p className="text-[12px] text-teal">{label}</p>
              <p className="mt-1 text-[24px] font-semibold leading-none">{value}</p>
              <p className="mt-1.5 text-[11px] text-muted">{sub}</p>
              <Icon size={15} className="absolute right-5 top-4 text-teal" />
            </div>
          ))}
        </Card>

        {/* Agenda do dia */}
        <Card className="mt-5 overflow-hidden">
          <div className="flex items-start justify-between px-5 pb-3 pt-4">
            <div>
              <h2 className="text-[15px] font-semibold">Agenda do dia</h2>
              <p className="text-[11px] text-muted">{agenda.length} compromissos hoje</p>
            </div>
            <a href="#" className="text-[12px] font-medium text-teal hover:underline">Ver agenda completa</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-170 text-left">
              <thead>
                <tr className="border-t border-line bg-surface/60 text-[11px] font-medium text-muted">
                  <th className="px-5 py-2 font-medium">Horário</th>
                  <th className="px-3 py-2 font-medium">Paciente</th>
                  <th className="px-3 py-2 font-medium">Tratamento</th>
                  <th className="px-3 py-2 font-medium">Responsável</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {agenda.map((a) => (
                  <tr
                    key={`${a.time}-${a.patient}`}
                    className={`border-t border-line text-[13px] ${
                      a.status === "Em atendimento" ? "bg-teal/5" : ""
                    } ${a.status === "Cancelado" ? "text-muted" : ""}`}
                  >
                    <td className="px-5 py-3 text-[12px] font-semibold tabular-nums">{a.time}</td>
                    <td className={`px-3 py-3 font-semibold ${a.status === "Cancelado" ? "line-through" : ""}`}>
                      {a.patient}
                    </td>
                    <td className="px-3 py-3">{a.treatment}</td>
                    <td className="px-3 py-3">{a.responsible}</td>
                    <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Funil + Horários */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Card className="px-5 py-4">
            <h2 className="text-[15px] font-semibold">Funil de pacientes</h2>
            <ul className="mt-4 space-y-3.5">
              {funnel.map((f, i) => (
                <li key={f.label} className="grid grid-cols-[150px_1fr_28px] items-center gap-3">
                  <span className={`text-[12px] ${f.highlight ? "font-medium text-teal" : "text-ink"}`}>
                    {f.label}
                  </span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="bar-fill h-full rounded-full bg-teal"
                      style={{ width: `${(f.value / 32) * 100}%`, animationDelay: `${i * 120}ms` }}
                    />
                  </div>
                  <span className="text-right text-[12px] font-semibold">{f.value}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="px-5 py-4">
            <h2 className="text-[15px] font-semibold">Próximos horários</h2>
            <ul className="mt-4 space-y-3.5">
              {schedule.map((s) => (
                <li key={s.time} className="grid grid-cols-[44px_1fr] items-center gap-3">
                  <span className="text-[11px] font-medium text-muted">{s.time}</span>
                  <div className="border-l-2 border-line pl-3">
                    <p className="text-[13px] font-semibold leading-tight">{s.name}</p>
                    <p className="text-[11px] text-muted">{s.type}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}