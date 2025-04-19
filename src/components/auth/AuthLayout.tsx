import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-950 dark:via-gray-900 dark:to-emerald-950">
      <Card className="w-full max-w-md shadow-xl border-emerald-100">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-transparent bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text">
            {title}
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}