import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "../components/ui/button";
import { auth } from "@/server/firebase-client";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  async function handleGoogleLogin() {
    try {
      await signInWithPopup(auth, provider);
      alert("Login realizado com sucesso!");
      navigate("/"); // Redireciona para a página inicial após o login
    } catch (error) {
      alert("Erro ao realizar login. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-lg p-14">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Seja bem-vindo
            </h1>
            <p className="text-gray-600">
              Entre para continuar suas conversas com a IA
            </p>
          </div>

          {/* Botão de login com Google */}
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center gap-3 transition-colors duration-200"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="font-medium">Continuar com Google</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
