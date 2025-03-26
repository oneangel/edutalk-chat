import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { login, setToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  recaptcha: z.string().min(1, "Por favor, complete el captcha"),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      recaptcha: "",
    },
  });

  const handleRecaptchaChange = (token: string | null) => {
    if (token) {
      form.setValue("recaptcha", token);
    } else {
      form.setValue("recaptcha", "");
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const response = await login(values.email, values.password);
      setToken(response.token);
      toast({
        title: "¡Éxito!",
        description: "Has iniciado sesión correctamente",
      });
      navigate("/chat");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Credenciales inválidas",
      });
      // Reset recaptcha on error
      if (recaptchaRef.current) {
        (recaptchaRef.current as any).reset();
        form.setValue("recaptcha", "");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
                  <Input placeholder="ejemplo@correo.com" {...field} className="pl-10 border-purple-100" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    {...field} 
                    className="pl-10 pr-10 border-purple-100" 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 -translate-y-1/2 top-1/2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recaptcha"
          render={() => (
            <FormItem>
              <FormControl>
                <div className="flex justify-center">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey="6Lc-FOsqAAAAAIv-iRGEYYDMyTLHWlM8YlO2_d3q"
                    onChange={handleRecaptchaChange}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full text-white bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-800 hover:to-emerald-700" 
          disabled={isLoading || !form.watch("recaptcha")}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>
    </Form>
  );
}