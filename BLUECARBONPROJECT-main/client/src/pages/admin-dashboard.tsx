import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Layers, TrendingUp, Download, UserCheck, ShoppingCart, Leaf } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { SubtleOceanBackground } from '@/components/ocean-background';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const { data: verifiers = [] } = useQuery({
    queryKey: ['/api/users/verifiers'],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['/api/blocks'],
  });

  const buyers = allUsers
    .filter((u: any) => u.role === 'buyer')
    .sort((a: any, b: any) => (b.creditsPurchased || 0) - (a.creditsPurchased || 0));

  const contributors = allUsers
    .filter((u: any) => u.role === 'contributor')
    .sort((a: any, b: any) => {
      const aCredits = projects
        .filter((p: any) => p.userId === a.id && p.status === 'verified')
        .reduce((sum: number, p: any) => sum + (p.creditsEarned || 0), 0);
      const bCredits = projects
        .filter((p: any) => p.userId === b.id && p.status === 'verified')
        .reduce((sum: number, p: any) => sum + (p.creditsEarned || 0), 0);
      return bCredits - aCredits;
    });

  const assignVerifier = useMutation({
    mutationFn: ({ projectId, verifierId }: { projectId: string; verifierId: string }) =>
      apiRequest('PUT', `/api/projects/${projectId}/assign`, { verifierId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Verifier assigned', description: 'Project has been assigned to verifier' });
    },
  });

  const exportBlockchain = useMutation({
    mutationFn: () => apiRequest('GET', '/api/blockchain/export'),
    onSuccess: (data: any) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blockchain-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Blockchain exported', description: 'Complete blockchain data downloaded' });
    },
  });

  const filteredProjects = statusFilter === 'all'
    ? projects
    : projects.filter((p: any) => p.status === statusFilter);

  return (
    <div className="min-h-screen">
      <SubtleOceanBackground />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">System-wide overview and management</p>
          </div>
          <Button onClick={() => exportBlockchain.mutate()} data-testid="button-export-blockchain">
            <Download className="w-4 h-4 mr-2" />
            Export Blockchain
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Projects"
            value={stats?.totalProjects || 0}
            icon={FileText}
          />
          <StatsCard
            title="Total CO₂ Captured"
            value={`${(stats?.totalCO2Captured || 0).toFixed(2)}t`}
            icon={TrendingUp}
            gradient
          />
          <StatsCard
            title="Verified Projects"
            value={stats?.verifiedProjects || 0}
            icon={UserCheck}
          />
          <StatsCard
            title="Blockchain Blocks"
            value={blocks.length}
            icon={Layers}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Projects
                </CardTitle>
                <CardDescription>Manage and monitor all submitted projects</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No projects found with selected filter
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Project</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">CO₂</th>
                      <th className="pb-3 font-medium">Submitted</th>
                      <th className="pb-3 font-medium">Verifier</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project: any) => (
                      <tr key={project.id} className="border-b hover-elevate" data-testid={`row-project-${project.id}`}>
                        <td className="py-4 font-medium max-w-xs truncate">{project.name}</td>
                        <td className="py-4 text-sm">{project.userId}</td>
                        <td className="py-4">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="py-4">{project.co2Captured.toFixed(2)}t</td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {format(new Date(project.submittedAt), 'PP')}
                        </td>
                        <td className="py-4 text-sm">
                          {project.verifierId ? (
                            <span className="text-xs bg-muted px-2 py-1 rounded">{project.verifierId}</span>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4">
                          {project.status === 'pending' && (
                            <Select
                              value={project.verifierId || ''}
                              onValueChange={(verifierId) => {
                                if (verifierId) {
                                  assignVerifier.mutate({ projectId: project.id, verifierId });
                                }
                              }}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs" data-testid={`select-verifier-${project.id}`}>
                                <SelectValue placeholder="Assign..." />
                              </SelectTrigger>
                              <SelectContent>
                                {verifiers.map((v: any) => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.username}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Top Buyers
              </CardTitle>
              <CardDescription>Buyers sorted by credits purchased</CardDescription>
            </CardHeader>
            <CardContent>
              {buyers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No buyers registered</div>
              ) : (
                <div className="space-y-3">
                  {buyers.slice(0, 5).map((buyer: any) => (
                    <div
                      key={buyer.id}
                      className="p-3 rounded-lg border hover-elevate"
                      data-testid={`buyer-${buyer.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{buyer.name || buyer.username}</p>
                            <p className="text-xs text-muted-foreground">{buyer.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{(buyer.creditsPurchased || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">tons</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                Top Contributors
              </CardTitle>
              <CardDescription>Contributors sorted by credits earned</CardDescription>
            </CardHeader>
            <CardContent>
              {contributors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No contributors registered</div>
              ) : (
                <div className="space-y-3">
                  {contributors.slice(0, 5).map((contributor: any) => {
                    const creditsEarned = projects
                      .filter((p: any) => p.userId === contributor.id && p.status === 'verified')
                      .reduce((sum: number, p: any) => sum + (p.creditsEarned || 0), 0);
                    return (
                      <div
                        key={contributor.id}
                        className="p-3 rounded-lg border hover-elevate"
                        data-testid={`contributor-${contributor.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Leaf className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{contributor.name || contributor.username}</p>
                              <p className="text-xs text-muted-foreground">{contributor.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">{creditsEarned.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">tons</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Verifiers
            </CardTitle>
            <CardDescription>Authorized verifiers in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {verifiers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No verifiers registered</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {verifiers.map((verifier: any) => (
                  <div
                    key={verifier.id}
                    className="p-4 rounded-lg border hover-elevate"
                    data-testid={`verifier-${verifier.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{verifier.username}</p>
                        <p className="text-xs text-muted-foreground">Verifier</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
