import { Navigate } from "react-router-dom";
import { useConversations } from "../hooks/use-conversation";
import { useIsMobile } from "../hooks/use-mobile";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { userLogged, authLoading } = useConversations();
  const isMobile = useIsMobile();

  // Mostra loading com skeleton da sidebar
  if (authLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar Skeleton - apenas no desktop */}
        {!isMobile && (
          <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
            {/* Header */}
            <div className="p-4">
              <Button
                className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 rounded-lg"
                disabled
              >
                + Nova Conversa
              </Button>
            </div>

            <Separator className="bg-gray-700" />

            {/* Lista de chats skeleton */}
            <div className="flex-1 overflow-y-auto p-2">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="p-3 rounded-lg mb-2 bg-gray-800">
                  <Skeleton className="h-4 w-3/4 mb-2 bg-gray-700" />
                  <Skeleton className="h-3 w-1/2 mb-1 bg-gray-700" />
                  <Skeleton className="h-3 w-1/3 bg-gray-700" />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-8 h-8 rounded-full bg-gray-700" />
                <Skeleton className="h-4 w-16 bg-gray-700" />
              </div>
            </div>
          </div>
        )}

        {/* Área principal com loading */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600">Verificando autenticação...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se não está logado, redireciona para login
  if (!userLogged) {
    return <Navigate to="/login" replace />;
  }

  // Se está logado, renderiza o componente
  return <>{children}</>;
}
