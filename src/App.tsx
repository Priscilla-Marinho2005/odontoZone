import { useCallback, useState } from "react";
import Sidebar from "./components/Siderbar";
import Dashboard from "./pages/Dashboard";
import Pacientes, { PatientsProvider } from "./pages/Pacientes";
import Funil from "./pages/Funil";
import Agenda from "./pages/Agenda";
import Tratamentos, { TreatmentsProvider } from "./pages/Tratamentos";
import Orcamentos from "./pages/Orcamentos";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [openProtocol, setOpenProtocol] = useState<string | null>(null);
  const clearOpen = useCallback(() => setOpenProtocol(null), []);

  return (
    <PatientsProvider>
      <TreatmentsProvider>
      <div className="flex h-screen">
        <Sidebar active={page} onNavigate={setPage} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-14 lg:pt-0">
        {page === "pacientes" ? (
          <Pacientes openProtocol={openProtocol} onOpened={clearOpen} />
        ) : page === "agenda" ? (
          <Agenda onOpenPatient={(protocol) => {
            setOpenProtocol(protocol);
            setPage("pacientes");
          }} />
        ) : page === "tratamentos" ? (
          <Tratamentos />
        ) : page === "orcamentos" ? (
          <Orcamentos />
        ) : page === "funil" ? (
          <Funil onOpenPatient={(protocol) => {
            setOpenProtocol(protocol);
            setPage("pacientes");
          }} />
        ) : (
          <Dashboard />
        )}
        </div>
      </div>
      </TreatmentsProvider>
    </PatientsProvider>
  );
}