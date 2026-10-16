import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuLayoutDashboard, LuUsers, LuFilter, LuCalendarDays, LuStethoscope, LuFileText,
  LuSettings, LuHeadphones, LuLogOut, LuChevronsLeft, LuChevronsRight,
} from "react-icons/lu";

type NavItem = {
  id: string;
  label: string;
  icon: IconType;
  danger?: boolean;
};

const menuItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { id: "pacientes", label: "Pacientes", icon: LuUsers },
  { id: "funil", label: "Funil", icon: LuFilter },
  { id: "agenda", label: "Agenda", icon: LuCalendarDays },
  { id: "tratamentos", label: "Tratamentos", icon: LuStethoscope },
  { id: "orcamentos", label: "Orçamentos", icon: LuFileText },
];

const footerItems: NavItem[] = [
  { id: "config", label: "Configurações", icon: LuSettings },
  { id: "suporte", label: "Suporte técnico", icon: LuHeadphones },
  { id: "sair", label: "Sair da conta", icon: LuLogOut, danger: true },
];

type SidebarProps = {
  active: string;
  onNavigate: (id: string) => void;
};

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [narrow, setNarrow] = useState(false);
  const compact = narrow || collapsed;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <aside
      className={`sidebar-bg sidebar-transition relative flex h-screen shrink-0 flex-col overflow-hidden text-white ${
        compact ? "w-18" : "w-59"
      }`}
    >
      {/* Marca d'água */}
      <img
        src="/IconeLogoSemFundo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 w-72 opacity-10"
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pb-4 pt-5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img src="/IconeLogoSemFundo.png" alt="OdontoZone" className="h-9 w-9 shrink-0 object-contain" />
          {!compact && (
            <div className="leading-tight whitespace-nowrap">
              <p className="text-[15px] font-semibold">
                Odonto<span className="font-light text-white/70">Zone</span>
              </p>
              <p className="text-[11px] text-white/60">Plataforma</p>
            </div>
          )}
        </div>
        {!narrow && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={compact ? "Expandir menu" : "Recolher menu"}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky"
          >
            {compact ? <LuChevronsRight size={18} /> : <LuChevronsLeft size={18} />}
          </button>
        )}
      </div>

      {/* Navegação */}
      <nav className="relative flex-1 overflow-y-auto border-t border-white/10 px-3 pt-4 pb-2">
        <ul className="space-y-1">
          {menuItems.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <button
                  onClick={() => onNavigate(id)}
                  title={compact ? label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] transition focus-visible:outline-2 focus-visible:outline-sky ${
                    isActive
                      ? "bg-active font-semibold text-navy"
                      : "font-medium text-white/80 hover:bg-white/8 hover:text-white"
                  } ${compact ? "justify-center px-0" : ""}`}
                >
                  <Icon size={18} className="shrink-0" />
                  {!compact && <span className="whitespace-nowrap">{label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Rodapé */}
      <div className="relative border-t border-white/10 px-3 py-3">
        <ul className="space-y-0.5">
          {footerItems.map(({ id, label, icon: Icon, danger }) => (
            <li key={id}>
              <button
                title={compact ? label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-sky ${
                  danger ? "text-[#ff7b7f]" : "text-white/75 hover:text-white"
                } ${compact ? "justify-center px-0" : ""}`}
              >
                <Icon size={16} className="shrink-0" />
                {!compact && <span className="whitespace-nowrap">{label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}