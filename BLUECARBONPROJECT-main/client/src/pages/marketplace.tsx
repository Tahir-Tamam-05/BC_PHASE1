import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Leaf, MapPin, Building2, CheckCircle2, Download, Filter, X, FileText, Eye, Award, Shield, Info, Activity, History, ExternalLink, Zap, XCircle } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { SubtleOceanBackground } from '@/components/ocean-background';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateCertificatePDFWithQR, prepareCertificateData } from '@/components/certificate-generator';
import type { Project, CreditTransaction } from '@shared/schema';

export default function Marketplace() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [previewCertificate, setPreviewCertificate] = useState<any>(null);

  // Filter state
  const [creditsMin, setCreditsMin] = useState('');
  const [creditsMax, setCreditsMax] = useState('');
  const [plantationType, setPlantationType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Build query params for filter
  const filterParams = new URLSearchParams();
  if (creditsMin) filterParams.append('credits_min', creditsMin);
  if (creditsMax) filterParams.append('credits_max', creditsMax);
  if (plantationType) filterParams.append('plantation_type', plantationType);
  const hasFilters = creditsMin || creditsMax || plantationType;

  const { data: availableProjects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: hasFilters ? ['/api/buyer/filter', filterParams.toString()] : ['/api/projects/marketplace'],
    enabled: !!user?.id,
  });

  const { data: myPurchases = [] } = useQuery<Array<CreditTransaction & { contributorName: string; projectName: string }>>({
    queryKey: ['/api/credits/purchases'],
    enabled: !!user?.id,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: { contributorId: string; projectId: string; credits: number }) => {
      const res = await apiRequest('POST', '/api/credits/purchase', data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['/api/credits/purchases'] });
      if (data.buyer) {
        updateUser(data.buyer);
      }
      setSelectedProject(null);
      setPurchaseAmount('');
      toast({ title: 'Purchase successful!', description: 'Carbon credits have been added to your account' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Purchase failed',
        description: error.message || 'Could not complete purchase',
      });
    },
  });

  const totalCredits = myPurchases.reduce((sum: number, tx: any) => sum + (tx.credits || 0), 0);
  const totalProjects = availableProjects.length;
  const availableCredits = availableProjects.reduce((sum: number, p: any) => sum + (p.creditsEarned || 0), 0);

  const handlePurchase = () => {
    if (!selectedProject || !purchaseAmount) return;
    const credits = parseFloat(purchaseAmount);
    if (isNaN(credits) || credits <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid credit amount' });
      return;
    }
    const availableCredits = selectedProject.creditsEarned || 0;
    if (credits > availableCredits) {
      toast({ variant: 'destructive', title: 'Insufficient credits', description: 'Project does not have enough credits available' });
      return;
    }
    purchaseMutation.mutate({
      contributorId: selectedProject.userId,
      projectId: selectedProject.id,
      credits: Number(credits)
    });
  };

  const handleDownloadCertificate = async (purchase: any) => {
    if (!user) return;
    const certData = prepareCertificateData(purchase, user.name || 'Buyer');
    await generateCertificatePDFWithQR(certData);
    toast({
      title: 'Certificate Downloaded',
      description: 'Your carbon offset certificate has been generated.',
    });
  };

  return (
    <div className="min-h-screen">
      <SubtleOceanBackground />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Carbon Credit Marketplace</h1>
            <p className="text-muted-foreground mt-1">Browse and purchase verified blue carbon credits</p>
          </div>
        </div>

        {/* Voluntary Credit Disclaimer - PRD Requirement */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Leaf className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Voluntary Carbon Credits
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Credits on this platform are voluntary digital representations for ESG and sustainability reporting.
                Upon purchase, credits are permanently retired and cannot be resold or reused.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="My Credits Purchased"
            value={`${totalCredits.toFixed(2)} tons`}
            icon={ShoppingCart}
            gradient
          />
          <StatsCard
            title="Available Projects"
            value={totalProjects}
            icon={Leaf}
          />
          <StatsCard
            title="Total Available Credits"
            value={`${availableCredits.toFixed(2)} tons`}
            icon={CheckCircle2}
          />
          {/* Dashboard Portfolio Summary - Task 8 */}
          <Card className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950 text-white">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Shield className="w-12 h-12" />
            </div>
            <CardContent className="p-4 pt-5">
              <p className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 mb-2">Portfolio Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Projects Owned</span>
                  <span className="text-sm font-bold">{new Set(myPurchases.map(p => p.projectId)).size}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Total CO₂ Offset</span>
                  <span className="text-sm font-bold text-emerald-400">{totalCredits.toFixed(2)} t</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5" />
                  Available Carbon Credits
                </CardTitle>
                <CardDescription>Verified blue carbon projects with credits available for purchase</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>

          {showFilters && (
            <CardContent className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="credits-min">Min Credits</Label>
                  <Input
                    id="credits-min"
                    type="number"
                    placeholder="e.g. 50"
                    value={creditsMin}
                    onChange={(e) => setCreditsMin(e.target.value)}
                    data-testid="input-credits-min"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits-max">Max Credits</Label>
                  <Input
                    id="credits-max"
                    type="number"
                    placeholder="e.g. 500"
                    value={creditsMax}
                    onChange={(e) => setCreditsMax(e.target.value)}
                    data-testid="input-credits-max"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plantation-type">Plantation Type</Label>
                  <Select value={plantationType || undefined} onValueChange={(val) => setPlantationType(val)}>
                    <SelectTrigger id="plantation-type" data-testid="select-plantation-type">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mangrove">Mangrove</SelectItem>
                      <SelectItem value="Seagrass">Seagrass</SelectItem>
                      <SelectItem value="Salt Marsh">Salt Marsh</SelectItem>
                      <SelectItem value="Coastal">Coastal</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreditsMin('');
                    setCreditsMax('');
                    setPlantationType('');
                  }}
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          )}

          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading marketplace...</div>
            ) : availableProjects.length === 0 ? (
              <div className="text-center py-12">
                <Leaf className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">No projects available</p>
                <p className="text-sm text-muted-foreground">Check back soon for new blue carbon projects</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableProjects.map((project: any) => {
                  const isAvailable = project.isListed !== false;
                  return (
                    <Card
                      key={project.id}
                      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-slate-200 dark:border-slate-800 ${!isAvailable ? 'grayscale-[0.5] opacity-80' : ''}`}
                      onClick={() => setSelectedProject(project)}
                      data-testid={`card-project-${project.id}`}
                    >
                      {/* Status Badges */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
                        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${project.status === 'verified'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                          Verified – Phase 1 (GIS)
                        </div>
                        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm ${isAvailable
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-slate-500 text-white border-slate-600'
                          }`}>
                          {isAvailable ? 'Available' : 'Unavailable by Admin'}
                        </div>
                      </div>

                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors pr-24">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-primary/60" />
                          {project.location}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-5">
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed h-10">
                          {project.description}
                        </p>

                        <div className="grid grid-cols-2 gap-3 pb-2">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Ecosystem</div>
                            <div className="font-semibold text-sm flex items-center gap-1.5">
                              <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                              {project.ecosystemType}
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Area Coverage</div>
                            <div className="font-semibold text-sm flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-blue-500" />
                              {project.area} ha
                            </div>
                          </div>
                        </div>

                        {/* Registry Info - Task 3 */}
                        <div className="p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10 flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Registry</span>
                            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                              <Shield className="w-3 h-3" /> BlueCarbon Ledger
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Verification</span>
                            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">GIS Phase 1</span>
                          </div>
                        </div>

                        {/* Purchase Transparency Panel - Task 4 */}
                        <div className="space-y-2 border-t pt-4">
                          <div className="flex items-center justify-between text-xs px-1">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Activity className="w-3 h-3" /> Available Credits:
                            </span>
                            <span className="font-bold text-primary">{(project.creditsEarned || 0).toFixed(1)} tCO₂</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] px-1">
                            <span className="text-slate-400">Minimum Purchase:</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">1 tCO₂</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] px-1">
                            <span className="text-slate-400">Credits Retired After Purchase:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Yes
                            </span>
                          </div>
                        </div>

                        <Button
                          className={`w-full font-bold shadow-lg shadow-primary/20 ${!isAvailable ? 'bg-slate-400 pointer-events-none' : 'bg-primary hover:bg-primary/90'}`}
                          disabled={!isAvailable}
                          data-testid={`button-purchase-${project.id}`}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Purchase Credits
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {myPurchases.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <History className="w-5 h-5 text-primary" />
                My Carbon Portfolio
              </CardTitle>
              <CardDescription>Verified purchase and retirement history on BlueCarbon Ledger</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      <th className="px-6 py-4 text-left">Project & Contributor</th>
                      <th className="px-6 py-4 text-left">Ledger ID</th>
                      <th className="px-6 py-4 text-left">Amount (tCO₂)</th>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-right">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myPurchases.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group" data-testid={`row-transaction-${tx.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{tx.projectName || 'Unknown Project'}</span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-tighter">
                              <Building2 className="w-2.5 h-2.5" /> {tx.contributorName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                            {(tx as any).txId || `TX-${tx.id.substring(0, 8)}`}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-primary font-bold">
                            <Zap className="w-3.5 h-3.5" />
                            {tx.credits.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {format(new Date(tx.timestamp), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-tight border border-emerald-500/10 shadow-sm">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Retired
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewCertificate(tx)}
                              className="h-8 px-2 text-xs text-slate-500 hover:text-primary"
                              data-testid={`btn-view-certificate-${tx.id}`}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadCertificate(tx)}
                              className="h-8 px-3 text-xs border-slate-200 dark:border-slate-800"
                              data-testid={`btn-certificate-${tx.id}`}
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-purchase">
            <DialogHeader className="border-b pb-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">BlueCarbon Ecosystem</span>
              </div>
              <DialogTitle className="text-3xl font-heading font-bold">{selectedProject.name}</DialogTitle>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider">Verified – Phase 1 (GIS)</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-bold border border-blue-500/20 uppercase tracking-wider">BlueCarbon Ledger Registry</span>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6">
              {/* Left Column: Project Stats and Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Project Metadata</h4>
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Contributor</span>
                      <span className="font-bold">Contributor #{(selectedProject as any).userId?.substring(0, 8) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Registry ID</span>
                      <span className="font-mono text-[11px] font-bold">{(selectedProject as any).id}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Verification</span>
                      <span className="font-bold text-emerald-600">GIS Phase 1</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ecosystem</p>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{selectedProject.ecosystemType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Area Covered</p>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{selectedProject.area} ha</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual CO₂</p>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{selectedProject.annualCO2.toFixed(2)} tons</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</p>
                    <p className="font-bold text-sm text-primary">{(selectedProject.creditsEarned || 0).toFixed(1)} tCO₂</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Descriptions & Impact */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">About The Project</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedProject.description}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <h5 className="text-xs font-bold text-primary uppercase">Environmental Impact</h5>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    This project captures carbon through natural sequestration, supporting local biodiversity and coastal resilience.
                  </p>
                </div>
              </div>
            </div>

            {/* Purchase Transparency Section - Task 4 */}
            <div className="border-t pt-6 mt-2">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-primary" /> Purchase Carbon Credits
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Acquire and permanently retire verified offsets</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Available Credits</p>
                    <p className="text-2xl font-black text-primary">{(selectedProject.creditsEarned || 0).toFixed(1)} <span className="text-xs font-normal">tCO₂</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                  <div className="space-y-3">
                    <Label htmlFor="purchase-amount" className="text-xs font-bold uppercase tracking-wider text-slate-500">Credits to Purchase (tons)</Label>
                    <div className="relative">
                      <Input
                        id="purchase-amount"
                        type="number"
                        step="0.01"
                        min="1"
                        max={selectedProject.creditsEarned || 0}
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                        placeholder="e.g. 50.0"
                        className="h-12 text-lg font-bold pr-16 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-all"
                        data-testid="input-purchase-amount"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">tCO₂</div>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <Info className="w-3 h-3" /> Min Purchase: 1.0 tCO₂
                      </div>
                      {selectedProject.isListed === false && (
                        <div className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Unavailable
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Credits Retired After Purchase:</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Yes
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium tracking-tight">Mutable Resale Possible:</span>
                        <span className="font-bold text-red-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> No
                        </span>
                      </div>
                    </div>

                    {purchaseAmount && parseFloat(purchaseAmount) > 0 && (
                      <div className="bg-primary/10 border border-primary/20 p-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Award className="w-6 h-6 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-primary">Blue Points Earned</p>
                          <p className="text-lg font-black text-primary">{(parseFloat(purchaseAmount) * 5).toFixed(0)} <span className="text-xs font-medium">pts</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <h5 className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-500">Legal Retirement Disclaimer</h5>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Credits are permanently retired upon purchase and recorded as a public ESG claim on the BlueCarbon
                    Ledger. <strong>Resale is prohibited.</strong> This action is strictly irreversible and recorded in the immutable audit ledger.
                  </p>
                </div>

                <DialogFooter className="pt-2">
                  <Button variant="ghost" onClick={() => setSelectedProject(null)} className="font-bold">
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePurchase}
                    disabled={purchaseMutation.isPending || !purchaseAmount || parseFloat(purchaseAmount) < 1 || selectedProject.isListed === false}
                    className="h-12 px-8 font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-primary/20"
                    data-testid="button-confirm-purchase"
                  >
                    {purchaseMutation.isPending ? 'Processing Ledger...' : 'Finalize Purchase'}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {previewCertificate && (
        <Dialog open={!!previewCertificate} onOpenChange={() => setPreviewCertificate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Carbon Offset Certificate Preview
              </DialogTitle>
              <DialogDescription>Review your certificate before downloading</DialogDescription>
            </DialogHeader>

            {(() => {
              const certData = prepareCertificateData(previewCertificate, user?.name || 'Buyer');
              return (
                <div className="space-y-4 py-4 text-sm">
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <h2 className="text-lg font-bold text-primary">BlueCarbon Ledger</h2>
                    <p className="text-xs text-muted-foreground">Verified Nature-Based Carbon Credit Platform</p>
                    <h3 className="text-xl font-bold mt-3">CARBON OFFSET CERTIFICATE</h3>
                    <p className="text-xs text-muted-foreground">(Voluntary Carbon Offset)</p>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground border-b pb-2">
                    <span>Certificate ID: {certData.certificateId}</span>
                    <span>Issued On: {format(certData.issuedDate, 'dd MMMM yyyy')}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium">
                      1. Certificate Holder
                    </div>
                    <div className="grid grid-cols-2 gap-4 px-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Issued To (Buyer)</p>
                        <p className="font-medium">{certData.buyerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Purpose of Offset</p>
                        <p className="font-medium">Voluntary offset for ESG and sustainability reporting</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium">
                      2. Offset Details
                    </div>
                    <div className="grid grid-cols-2 gap-4 px-2 bg-muted/50 p-3 rounded">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Credits Retired</p>
                        <p className="font-medium text-primary">{certData.credits.toFixed(2)} tCO2e</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Credit Type</p>
                        <p className="font-medium">Nature-Based (Blue Carbon)</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Credit Status</p>
                        <p className="font-medium text-green-600">Retired</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Retirement Date</p>
                        <p className="font-medium">{format(certData.retirementDate, 'dd MMMM yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium">
                      3. Project Information
                    </div>
                    <div className="grid grid-cols-2 gap-4 px-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Project Name</p>
                        <p className="font-medium">{certData.projectName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ecosystem Type</p>
                        <p className="font-medium">{certData.ecosystemType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Project Location</p>
                        <p className="font-medium">{certData.projectLocation}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Project Area</p>
                        <p className="font-medium">{certData.projectArea.toFixed(2)} hectares</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium">
                      4. Traceability & Ledger Record
                    </div>
                    <div className="grid grid-cols-2 gap-4 px-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Ledger Transaction ID</p>
                        <p className="font-mono text-xs">{certData.transactionId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ledger System</p>
                        <p className="font-medium">BlueCarbon Ledger (Immutable)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded text-xs">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Important Disclaimer</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      This certificate does not constitute compliance-market carbon credits. BlueCarbon Ledger operates as a technology platform and is not a government-recognized carbon registry.
                    </p>
                  </div>
                </div>
              );
            })()}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setPreviewCertificate(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  handleDownloadCertificate(previewCertificate);
                  setPreviewCertificate(null);
                }}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
