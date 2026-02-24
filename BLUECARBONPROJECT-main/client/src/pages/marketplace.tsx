import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Leaf, MapPin, Building2, CheckCircle2, Download, Filter, X, FileText, Eye } from 'lucide-react';
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
  const { user } = useAuth();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['/api/credits/purchases'] });
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
      credits 
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {availableProjects.map((project: any) => (
                  <Card key={project.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedProject(project)} data-testid={`card-project-${project.id}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-primary/10 rounded-md">
                          <div className="text-xs text-muted-foreground mb-1">Ecosystem</div>
                          <div className="font-medium text-sm">{project.ecosystemType}</div>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-md">
                          <div className="text-xs text-muted-foreground mb-1">Area</div>
                          <div className="font-medium text-sm">{project.area} ha</div>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-md">
                          <div className="text-xs text-muted-foreground mb-1">Annual CO₂</div>
                          <div className="font-medium text-sm">{project.annualCO2.toFixed(2)} tons</div>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-md">
                          <div className="text-xs text-muted-foreground mb-1">Available Credits</div>
                          <div className="font-medium text-sm text-primary">{(project.creditsEarned || 0).toFixed(2)} tons</div>
                        </div>
                      </div>

                      <Button className="w-full" data-testid={`button-purchase-${project.id}`}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Purchase Credits
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {myPurchases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                My Purchases
              </CardTitle>
              <CardDescription>Your carbon credit purchase history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Project</th>
                      <th className="pb-3 font-medium">Contributor</th>
                      <th className="pb-3 font-medium">Credits</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPurchases.map((tx: any) => (
                      <tr key={tx.id} className="border-b hover-elevate" data-testid={`row-transaction-${tx.id}`}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{tx.projectName || 'Unknown Project'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{tx.contributorName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 text-primary font-medium">{tx.credits.toFixed(2)} tons</td>
                        <td className="py-3 text-sm text-muted-foreground">{format(new Date(tx.timestamp), 'MMM d, yyyy')}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewCertificate(tx)}
                              className="flex items-center gap-1"
                              data-testid={`btn-view-certificate-${tx.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadCertificate(tx)}
                              className="flex items-center gap-1"
                              data-testid={`btn-certificate-${tx.id}`}
                            >
                              <Download className="w-4 h-4" />
                              Download
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
          <DialogContent data-testid="dialog-purchase">
            <DialogHeader>
              <DialogTitle>Purchase Carbon Credits</DialogTitle>
              <DialogDescription>{selectedProject.name}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ecosystem:</span>
                  <span className="font-medium">{selectedProject.ecosystemType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{selectedProject.location}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available Credits:</span>
                  <span className="font-medium text-primary">{(selectedProject.creditsEarned || 0).toFixed(2)} tons</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase-amount">Credits to Purchase (tons CO₂)</Label>
                <Input
                  id="purchase-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedProject.creditsEarned || 0}
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="Enter amount"
                  data-testid="input-purchase-amount"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: {(selectedProject.creditsEarned || 0).toFixed(2)} tons
                </p>
              </div>

              {/* Retirement Notice - PRD Requirement */}
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Permanent Retirement:</strong> Upon purchase, these credits will be permanently retired and recorded in the immutable audit ledger. They cannot be resold or reused.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedProject(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePurchase} 
                disabled={purchaseMutation.isPending || !purchaseAmount}
                data-testid="button-confirm-purchase"
              >
                {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </DialogFooter>
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
