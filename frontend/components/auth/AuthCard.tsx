import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-md border-none shadow-2xl shadow-black/10">
      <CardHeader className="space-y-1 pb-2 text-center">
        <CardTitle className="text-3xl font-semibold">{title}</CardTitle>
        {description && (
          <p className="text-md text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}