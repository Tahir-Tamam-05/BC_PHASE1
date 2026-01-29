import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Coins, Clock, Download, Plus, FileCheck, ShoppingCart, User } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { SubtleOceanBackground } from '@/components/ocean-background';
import { useAuth } from '@/lib/auth-context';
import { HashDisplay } from '@/components/hash-display';
import { format } from 'date-fns';
import { useState } from 'react';
import { ProjectSubmissionForm } from '@/components/project-submission-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects/my'],
    enabled: !!user?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions/my'],
    enabled: !!user?.id,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['/api/credits/sales'],
    enabled: !!user?.id,
  });

  const creditsAvailable = projects
    .filter((p: any) => p.status === 'verified')
    .reduce((sum: number, p: any) => sum + (p.creditsEarned || 0), 0);

  const creditsSold = sales.reduce((sum: number, sale: any) => sum + sale.credits, 0);

  const pendingCount = projects.filter((p: any) => p.status === 'pending').length;
  const verifiedCount = projects.filter((p: any) => p.status === 'verified').length;

  const downloadCertificate = useMutation({
    mutationFn: (projectId: string) => apiRequest('GET', `/api/projects/${projectId}/certificate`),
    onSuccess: (data: any, projectId: string) => {
      const project = projects.find((p: any) => p.id === projectId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'project'}-certificate.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Certificate downloaded', description: 'Project certificate saved successfully' });
    },
  });

  return (
    <div className="min-h-screen">
      <SubtleOceanBackground />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Contributor Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your blue carbon projects and credits</p>
          </div>
          <Button onClick={() => setShowSubmitForm(true)} data-testid="button-submit-project">
            <Plus className="w-4 h-4 mr-2" />
            Submit Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Credits Available"
            value={`${creditsAvailable.toFixed(2)} tons`}
            icon={Coins}
            gradient
          />
          <StatsCard
            title="Credits Sold"
            value={`${creditsSold.toFixed(2)} tons`}
            icon={ShoppingCart}
          />
          <StatsCard
            title="Verified Projects"
            value={verifiedCount}
            icon={FileCheck}
          />
          <StatsCard
            title="Pending Review"
            value={pendingCount}
            icon={Clock}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              My Projects
            </CardTitle>
            <CardDescription>All your submitted blue carbon projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={() => setShowSubmitForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Project
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Project Name</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Annual CO₂</th>
                      <th className="pb-3 font-medium">Credits Available</th>
                      <th className="pb-3 font-medium">Submitted</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project: any) => (
                      <tr key={project.id} className="border-b hover-elevate" data-testid={`row-project-${project.id}`}>
                        <td className="py-4 font-medium">{project.name}</td>
                        <td className="py-4">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="py-4">
                          <div className="text-sm">
                            <div className="font-medium">{project.annualCO2?.toFixed(2) || '0.00'} t/yr</div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-sm">
                            <div className="font-medium text-primary">{(project.creditsEarned || 0).toFixed(2)} tons</div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {format(new Date(project.submittedAt), 'PP')}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProject(project)}
                              data-testid={`button-view-${project.id}`}
                            >
                              View Details
                            </Button>
                            {project.status === 'verified' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadCertificate.mutate(project.id)}
                                disabled={downloadCertificate.isPending}
                                data-testid={`button-download-${project.id}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {sales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Sales History
              </CardTitle>
              <CardDescription>Buyers who purchased your carbon credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Buyer</th>
                      <th className="pb-3 font-medium">Project</th>
                      <th className="pb-3 font-medium">Credits Sold</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale: any) => (
                      <tr key={sale.id} className="border-b hover-elevate" data-testid={`row-sale-${sale.id}`}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{sale.buyerName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{sale.projectName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 text-primary font-medium">{sale.credits.toFixed(2)} tons</td>
                        <td className="py-3 text-sm text-muted-foreground">{format(new Date(sale.timestamp), 'MMM d, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              My Transactions
            </CardTitle>
            <CardDescription>Blockchain transactions from verified projects</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet. Submit and verify projects to earn carbon credits.
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx: any, index: number) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-lg border hover-elevate"
                    data-testid={`transaction-${index}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">{tx.credits} tons CO₂</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(tx.timestamp), 'PPp')}
                      </span>
                    </div>
                    <HashDisplay hash={tx.txId} label="Transaction ID" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSubmitForm} onOpenChange={setShowSubmitForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">Submit New Project</DialogTitle>
          </DialogHeader>
          <ProjectSubmissionForm
            onSuccess={() => {
              setShowSubmitForm(false);
              queryClient.invalidateQueries({ queryKey: ['/api/projects/my'] });
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading">{selectedProject.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <StatusBadge status={selectedProject.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <p className="text-muted-foreground">{selectedProject.location || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Area</h3>
                    <p className="text-muted-foreground">{selectedProject.area || 'N/A'} hectares</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Ecosystem Type</h3>
                    <p className="text-muted-foreground">{selectedProject.ecosystemType || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                  <div>
                    <h3 className="font-semibold mb-2">Annual CO₂ Sequestration</h3>
                    <p className="text-2xl font-bold text-primary">{selectedProject.annualCO2?.toFixed(2) || '0.00'} tons/year</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">20-Year Total CO₂</h3>
                    <p className="text-2xl font-bold text-primary">{selectedProject.lifetimeCO2?.toFixed(2) || selectedProject.co2Captured?.toFixed(2) || '0.00'} tons</p>
                  </div>
                </div>
                {selectedProject.rejectionReason && (
                  <div>
                    <h3 className="font-semibold mb-2">Rejection Reason</h3>
                    <p className="text-destructive">{selectedProject.rejectionReason}</p>
                  </div>
                )}
                {selectedProject.proofFileUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">Proof Document</h3>
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedProject.proofFileUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        View Proof
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
