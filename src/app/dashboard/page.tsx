import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CookingPot, Carrot, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Welcome, Chef!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s a quick overview of your restaurant&apos;s profitability.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <CookingPot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Ready for costing and analysis
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Raw Materials
            </CardTitle>
            <Carrot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              Items in your inventory
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Highest Cost Recipe
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$10.38</div>
            <p className="text-xs text-muted-foreground">
              Simple Burger has the highest cost
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Welcome to Profit Palate! Here are the next steps to calculate your menu&apos;s profit margins:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Add Your Raw Materials:</strong> Navigate to the{' '}
                <a href="/dashboard/materials" className="underline">Raw Materials</a> section to input all your ingredients, their purchase prices, and units.
              </li>
              <li>
                <strong>Create Your Recipes:</strong> Go to the{' '}
                <a href="/dashboard/recipes" className="underline">Recipes</a> section to build your menu items by selecting ingredients from your material list.
              </li>
              <li>
                <strong>Analyze Costs:</strong> As you build recipes, we&apos;ll automatically calculate the cost per recipe and per portion.
              </li>
            </ul>
             <p>Use these insights to price your menu effectively and maximize your profits!</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
