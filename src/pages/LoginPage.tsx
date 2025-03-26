import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  return (
    <AuthLayout
      title="¡Bienvenido de nuevo!"
      description="Ingresa tus credenciales para acceder a tu cuenta"
    >
      <LoginForm />
      <div className="mt-4 text-center">
        <span className="text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <Link to="/register">
            <Button variant="link" className="p-0 text-emerald-700 hover:text-emerald-500">
              Crear una
            </Button>
          </Link>
        </span>
      </div>
    </AuthLayout>
  );
}