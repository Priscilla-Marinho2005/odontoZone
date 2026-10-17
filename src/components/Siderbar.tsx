import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuLayoutDashboard, LuUsers, LuFilter, LuCalendarDays, LuStethoscope, LuFileText,
  LuSettings, LuHeadphones, LuLogOut, LuChevronsLeft, LuChevronsRight, LuMenu, LuX,
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function go(id: string) {
    onNavigate(id);
    setOpen(false);
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-4 text-ink lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="grid size-9 cursor-pointer place-items-center rounded-md hover:bg-surface"
        >
          <LuMenu size={20} />
        </button>
        <p className="text-[15px] font-semibold">
          Odonto<span className="font-medium text-muted">Zone</span>
        </p>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-navy/50 lg:hidden"
        />
      )}

    <aside
      className={`sidebar-bg sidebar-transition fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col overflow-hidden text-ink lg:static ${
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${collapsed ? "lg:w-18" : "lg:w-59"}`}
    >
      {/* Marca d'água */}
      <img
        src="/IconeLogoSemFundo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-26 w-110 max-w-none opacity-[0.2]"
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pb-4 pt-5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img src="/IconeLogoSemFundo.png" alt="OdontoZone" className="h-9 w-9 shrink-0 object-contain" />
          <div className={`leading-tight whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-[14px] font-semibold">
              Odonto<span className="font-medium text-muted">Zone</span>
            </p>
            <p className="text-[11px] text-muted">Plataforma</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
          className="grid size-7 cursor-pointer place-items-center rounded-md text-muted hover:bg-surface lg:hidden"
        >
          <LuX size={18} />
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted transition hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-sky lg:grid"
        >
          {collapsed ? <LuChevronsRight size={18} /> : <LuChevronsLeft size={18} />}
        </button>
      </div>

      {/* Navegação */}
      <nav className="relative flex-1 overflow-y-auto border-t border-line px-3 pt-4 pb-2">
        <ul className="space-y-1">
          {menuItems.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <button
                  onClick={() => go(id)}
                  title={label}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] transition focus-visible:outline-2 focus-visible:outline-sky ${
                    isActive
                      ? "bg-teal/10 font-medium text-teal"
                      : "font-normal text-muted hover:bg-surface hover:text-ink"
                  } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Rodapé */}
      <div className="relative border-t border-line px-3 py-3">
        <ul className="space-y-0.5">
          {footerItems.map(({ id, label, icon: Icon, danger }) => (
            <li key={id}>
              <button
                title={label}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition hover:bg-navy/20 focus-visible:outline-2 focus-visible:outline-sky ${
                  danger ? "text-danger" : "text-navy hover:text-ink"
                } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
              >
                <Icon size={16} className="shrink-0" />
                <span className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
    </>
  );
}