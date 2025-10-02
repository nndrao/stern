import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { isOpenFin, createWindow } from "@/utils/openfin";
import { logger } from "@/utils/logger";

function App() {
  const isInOpenFin = isOpenFin();

  const handleTestBlotterWindow = async () => {
    if (isInOpenFin) {
      try {
        const window = await createWindow('http://localhost:5173', {
          name: 'test-blotter',
          bounds: { x: 200, y: 200, width: 1000, height: 600 }
        });
        logger.info('Blotter window created', window, 'App');
      } catch (error) {
        logger.error('Failed to create blotter window', error, 'App');
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
            {isInOpenFin ? '🚀 Running in OpenFin' : '🌐 Running in Browser'}
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Unified Configurable Trading Platform</CardTitle>
              <CardDescription>
                Replacing 40+ duplicate trading applications with a single configurable solution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Environment</h3>
                  <p className="text-muted-foreground">
                    {isInOpenFin ? 'OpenFin Runtime' : 'Browser Mode'}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Platform Features</h3>
                  <ul className="text-muted-foreground text-left">
                    <li>• AG-Grid Enterprise</li>
                    <li>• Multi-protocol data providers</li>
                    <li>• Dynamic configuration</li>
                  </ul>
                </div>
              </div>

              {isInOpenFin && (
                <div className="flex gap-4 justify-center pt-4">
                  <Button onClick={handleTestBlotterWindow}>
                    Create Blotter Window
                  </Button>
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

export default App;