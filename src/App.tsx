import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Siderbar";
import Dashboard from "./pages/Dashboard";
import Pacientes, { PatientsProvider } from "./pages/Pacientes";
import Funil from "./pages/Funil";
import Agenda from "./pages/Agenda";
import Tratamentos, { TreatmentsProvider } from "./pages/Tratamentos";
import Orcamentos, { QuotePublicView } from "./pages/Orcamentos";
import Treinamento from "./pages/Treinamento";
import Reativacao from "./pages/Reativacao";
import Acompanhamentos from "./pages/Acompanhamentos";
import Odontograma from "./pages/Odontograma";

function publicQuoteToken() {
  const match = window.location.hash.match(/^#\/orcamento\/([^/]+)/);
  return match?.[1] ?? null;
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [openProtocol, setOpenProtocol] = useState<string | null>(null);
  const [quoteToken, setQuoteToken] = useState<string | null>(() => publicQuoteToken());
  const clearOpen = useCallback(() => setOpenProtocol(null), []);
  const openPatient = useCallback((protocol: string) => {
    setOpenProtocol(protocol);
    setPage("pacientes");
  }, []);

  useEffect(() => {
    const onHash = () => setQuoteToken(publicQuoteToken());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <PatientsProvider>
      {quoteToken ? (
        <QuotePublicView token={quoteToken} />
      ) : (
      <TreatmentsProvider>
      <div className="flex h-screen">
        <Sidebar active={page} onNavigate={setPage} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-14 lg:pt-0">
        {page === "pacientes" ? (
          <Pacientes openProtocol={openProtocol} onOpened={clearOpen} />
        ) : page === "agenda" ? (
          <Agenda onOpenPatient={openPatient} />
        ) : page === "tratamentos" ? (
          <Tratamentos onOpenPatient={openPatient} />
        ) : page === "orcamentos" ? (
          <Orcamentos onOpenPatient={openPatient} />
        ) : page === "treinamento" ? (
          <Treinamento />
        ) : page === "reativacao" ? (
          <Reativacao onOpenPatient={openPatient} />
        ) : page === "acompanhamentos" ? (
          <Acompanhamentos onOpenPatient={openPatient} />
        ) : page === "odontograma" ? (
          <Odontograma onOpenPatient={openPatient} />
        ) : page === "funil" ? (
          <Funil onOpenPatient={openPatient} />
        ) : (
          <Dashboard />
        )}
        </div>
      </div>
      </TreatmentsProvider>
      )}
    </PatientsProvider>
  );
}
