import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformProvider, usePlatform } from "@/contexts/PlatformContext";
import { useOpenFin } from "@/hooks/useOpenFin";
import { useOpenFinTheme } from "@/hooks/useOpenFinTheme";

function SternApp() {
  const { isOpenFin, settings } = usePlatform();
  const openFin = useOpenFin();

  // Initialize theme synchronization between OpenFin workspace and React app
  useOpenFinTheme();

  const handleTestBlotterWindow = async () => {
    if (openFin.isInitialized) {
      try {
        const window = await openFin.createBlotterWindow({
          name: 'test-blotter',
          url: 'http://localhost:5173',
          bounds: { x: 200, y: 200, width: 1000, height: 600 },
          configurationId: 'test-config'
        });
        console.log('Blotter window created:', window);
      } catch (error) {
        console.error('Failed to create blotter window:', error);
      }
    }
  };

  const handleTestDialog = async () => {
    if (openFin.isInitialized) {
      try {
        const result = await openFin.showDialog({
          id: 'test-dialog',
          title: 'Test Dialog',
          component: 'test',
          width: 400,
          height: 300,
          data: { message: 'Hello from main window!' }
        });
        console.log('Dialog result:', result);
      } catch (error) {
        console.error('Failed to show dialog:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-6">
            Stern Trading Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {isOpenFin ? '🚀 Running in OpenFin' : '🌐 Running in Browser'} •
            {openFin.isInitialized ? ' Platform Ready' : ' Initializing...'}
          </p>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>OpenFin Platform Status</CardTitle>
              <CardDescription>
                Test the OpenFin integration and window management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Environment</h3>
                  <p className="text-muted-foreground">
                    {isOpenFin ? 'OpenFin Runtime' : 'Browser Mode'}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Platform State</h3>
                  <p className="text-muted-foreground">
                    {openFin.isInitialized ? 'Ready' : 'Initializing...'}
                  </p>
                </div>
              </div>

              {settings && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Platform Settings</h3>
                  <pre className="text-xs text-muted-foreground">
                    {JSON.stringify(settings, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={handleTestBlotterWindow}
                  disabled={!openFin.isInitialized}
                >
                  {isOpenFin ? 'Create Blotter Window' : 'Test Blotter Window'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestDialog}
                  disabled={!openFin.isInitialized}
                >
                  {isOpenFin ? 'Show Dialog' : 'Test Dialog'}
                </Button>
              </div>

              {openFin.getOpenWindows().length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Open Windows</h3>
                  <ul className="text-sm text-muted-foreground">
                    {openFin.getOpenWindows().map(window => (
                      <li key={window}>{window}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
          <p className="text-sm text-muted-foreground">
            Start building by editing <code className="bg-muted px-2 py-1 rounded">src/App.tsx</code>
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <PlatformProvider>
      <SternApp />
    </PlatformProvider>
  );
}

export default App;