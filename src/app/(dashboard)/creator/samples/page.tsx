import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreatorSamplesPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Samples</h1>
        <p className="text-muted-foreground">Upload your sample works for brand review and matching.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature in progress</CardTitle>
          <CardDescription>
            The samples module is being prepared. You can continue completing channels, applications, and tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No action is required on this page right now.</p>
        </CardContent>
      </Card>
    </div>
  );
}
