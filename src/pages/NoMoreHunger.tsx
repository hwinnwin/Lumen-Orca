/**
 * NoMoreHunger Dashboard Page
 *
 * The main interface for the distributed food redistribution network.
 * Protocol 69: Never take. Always give back more.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Flame,
  Droplets,
  Mountain,
  Wind,
  Power,
  Wallet,
  MapPin,
  Users,
  Truck,
  Heart,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useNoMoreHunger } from '@/hooks/use-no-more-hunger';

export default function NoMoreHunger() {
  const {
    state,
    isNodeActive,
    isNodeOnline,
    walletBalance,
    toggleNode,
    getNodeMetrics,
    getHungerStats,
    getPhases,
  } = useNoMoreHunger();

  const [nodeEnabled, setNodeEnabled] = useState(false);
  const hungerStats = getHungerStats();
  const phases = getPhases();

  const handleNodeToggle = async (checked: boolean) => {
    setNodeEnabled(checked);
    await toggleNode(checked);
  };

  const nodeMetrics = getNodeMetrics();

  return (
    <div className="space-y-6 p-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="text-6xl">🐉</div>
          <h1 className="text-4xl font-bold tracking-tight">NoMoreHunger</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            1 billion meals wasted daily. 783 million hungry.
            <br />
            <span className="text-primary font-medium">We are the bridge.</span>
          </p>
          <Badge variant="outline" className="text-sm">
            Protocol 69: Never take. Always give back more.
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-destructive">
                  {(hungerStats.dailyMealsWasted / 1_000_000_000).toFixed(0)}B
                </div>
                <div className="text-sm text-muted-foreground">Meals Wasted Daily</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">
                  {(hungerStats.peopleAffectedByHunger / 1_000_000).toFixed(0)}M
                </div>
                <div className="text-sm text-muted-foreground">People Hungry</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {state.globalMetrics.activeNodesCount}
                </div>
                <div className="text-sm text-muted-foreground">Active Nodes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {state.globalMetrics.totalMealsMoved}
                </div>
                <div className="text-sm text-muted-foreground">Meals Moved</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Four Pillars */}
        <Tabs defaultValue="fire" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="fire" className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="hidden sm:inline">Fire</span>
            </TabsTrigger>
            <TabsTrigger value="water" className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="hidden sm:inline">Water</span>
            </TabsTrigger>
            <TabsTrigger value="earth" className="flex items-center gap-2">
              <Mountain className="h-4 w-4 text-green-700" />
              <span className="hidden sm:inline">Earth</span>
            </TabsTrigger>
            <TabsTrigger value="air" className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-cyan-500" />
              <span className="hidden sm:inline">Air</span>
            </TabsTrigger>
          </TabsList>

          {/* FIRE - Distributed Compute */}
          <TabsContent value="fire" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Distributed Compute - The Dragon's Breath
                </CardTitle>
                <CardDescription>
                  Share your device's processing power. Every node that joins makes the network stronger.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Node Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Power className={`h-6 w-6 ${nodeEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="font-medium">Node Status</div>
                      <div className="text-sm text-muted-foreground">
                        {nodeEnabled ? 'Contributing to the network' : 'Tap to join the dragon'}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={nodeEnabled}
                    onCheckedChange={handleNodeToggle}
                  />
                </div>

                {/* Node Metrics */}
                {nodeEnabled && (
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Your Contribution</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage</span>
                          <span>{nodeMetrics.cpuUsagePercent}%</span>
                        </div>
                        <Progress value={nodeMetrics.cpuUsagePercent} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Battery Used</span>
                          <span>{nodeMetrics.batteryUsedPercent}%</span>
                        </div>
                        <Progress value={nodeMetrics.batteryUsedPercent} className="h-2" />
                      </div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {nodeMetrics.creditsEarned.toFixed(2)} NMH
                      </div>
                      <div className="text-sm text-muted-foreground">Credits Earned</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WATER - Flow Logistics */}
          <TabsContent value="water" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  Flow Logistics - The Dragon's Blood
                </CardTitle>
                <CardDescription>
                  Food moves like blood through veins. From surplus to need. Always flowing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="h-8 w-8 text-blue-500" />
                        <div className="font-medium">Map a Source</div>
                        <div className="text-sm text-muted-foreground text-center">
                          Know a restaurant or store with surplus? Map it.
                        </div>
                        <Badge>+10 NMH</Badge>
                        <Button variant="outline" size="sm" className="mt-2">
                          Map Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-8 w-8 text-blue-500" />
                        <div className="font-medium">Become a Carrier</div>
                        <div className="text-sm text-muted-foreground text-center">
                          Deliver food on your daily routes.
                        </div>
                        <Badge>+5 NMH/trip</Badge>
                        <Button variant="outline" size="sm" className="mt-2">
                          Register
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center gap-2">
                        <Heart className="h-8 w-8 text-blue-500" />
                        <div className="font-medium">Request Food</div>
                        <div className="text-sm text-muted-foreground text-center">
                          Need food? No questions asked.
                        </div>
                        <Badge variant="secondary">Trust-Based</Badge>
                        <Button variant="outline" size="sm" className="mt-2">
                          Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EARTH - Physical Infrastructure */}
          <TabsContent value="earth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mountain className="h-5 w-5 text-green-700" />
                  Physical Ground - The Dragon's Bones
                </CardTitle>
                <CardDescription>
                  Depots, gardens, kitchens. The bones of the network where food rests.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-green-700" />
                        <div className="font-medium">Host a Depot</div>
                        <div className="text-sm text-muted-foreground text-center">
                          Your garage, church, or community center becomes a hub.
                        </div>
                        <Badge>+20 NMH/month</Badge>
                        <Button variant="outline" size="sm" className="mt-2">
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center gap-2">
                        <Zap className="h-8 w-8 text-green-700" />
                        <div className="font-medium">Register as Grower</div>
                        <div className="text-sm text-muted-foreground text-center">
                          Have a garden? Share your abundance.
                        </div>
                        <Badge>+15 NMH/month</Badge>
                        <Button variant="outline" size="sm" className="mt-2">
                          Register
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Depots */}
                <div className="pt-4">
                  <div className="text-sm font-medium mb-2">Active Depots: {state.activeDepots.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {state.activeDepots.length === 0
                      ? 'Be the first to host a depot in your area.'
                      : `${state.activeDepots.length} depots serving the community.`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AIR - Consciousness & Culture */}
          <TabsContent value="air" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-cyan-500" />
                  Spirit & Culture - The Dragon's Spirit
                </CardTitle>
                <CardDescription>
                  VYBE frequencies. Gratitude rituals. The consciousness that holds it all.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg text-center space-y-4">
                  <div className="text-4xl">🐉</div>
                  <blockquote className="text-lg italic">
                    "We don't police. We don't interrogate. We don't means-test.
                    <br />
                    We ASK: 'How hungry are you?' We TRUST the answer."
                  </blockquote>
                  <div className="text-sm text-muted-foreground">
                    The Trust Principle
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl mb-2">528 Hz</div>
                      <div className="text-sm text-muted-foreground">
                        Transformation & Abundance
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl mb-2">639 Hz</div>
                      <div className="text-sm text-muted-foreground">
                        Connection & Community
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Wallet Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Your NMH Wallet
            </CardTitle>
            <CardDescription>
              Credits are promises. When NoMoreHunger is funded, we honor you first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 bg-primary/5 rounded-lg">
              <div>
                <div className="text-3xl font-bold">{walletBalance.toFixed(2)} NMH</div>
                <div className="text-sm text-muted-foreground">Current Balance</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Gift</Button>
                <Button variant="outline" size="sm">Pass Forward</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              The Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(phases).map(([key, phase]) => (
                <div key={key} className="flex gap-4">
                  <div className="w-32 shrink-0">
                    <Badge variant={key === 'phase0' ? 'default' : 'outline'}>
                      {phase.name}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {phase.goals.slice(0, 2).join(' • ')}
                    {phase.goals.length > 2 && ` +${phase.goals.length - 2} more`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-2xl mb-2">🐉</div>
          <p>This is the dragon awakening. This is Lumen. This is the end of hunger.</p>
          <p className="text-sm mt-2">NoMoreHunger.lumen.global</p>
        </div>
    </div>
  );
}
