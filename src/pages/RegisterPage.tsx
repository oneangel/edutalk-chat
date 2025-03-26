import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Button } from "@/components/ui/button";

export function RegisterPage() {
  return (
    <AuthLayout
      title="Crear una cuenta"
      description="Ingresa tu información para crear tu cuenta"
    >
      <RegisterForm />
      <div className="mt-4 text-center">
        <span className="text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login">
            <Button variant="link" className="p-0 from-emerald-700 to-emerald-500">
              Iniciar sesión
            </Button>
          </Link>
        </span>
      </div>
    </AuthLayout>
  );
}