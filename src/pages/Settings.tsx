import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Trash2,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SettingsContent = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileData, setProfileData] = useState({
    email: "",
    name: "",
  });
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });

  // Fetch subscription data
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.getSubscription(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        email: user.email || "",
        name: user.user_metadata?.name || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: profileData.name },
      });

      if (error) throw error;

      toast({
        title: "Profiel bijgewerkt",
        description: "Je profiel is succesvol bijgewerkt",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Kon profiel niet bijwerken",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: "Fout",
        description: "Nieuwe wachtwoorden komen niet overeen",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.new.length < 6) {
      toast({
        title: "Fout",
        description: "Wachtwoord moet minimaal 6 tekens lang zijn",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });

      if (error) throw error;

      toast({
        title: "Wachtwoord bijgewerkt",
        description: "Je wachtwoord is succesvol gewijzigd",
      });

      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Kon wachtwoord niet wijzigen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold font-display text-foreground mb-6">Instellingen</h1>

            <Tabs defaultValue="account" className="space-y-6">
              <TabsList>
                <TabsTrigger value="account" className="gap-2">
                  <User className="h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaties
                </TabsTrigger>
                <TabsTrigger value="privacy" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy
                </TabsTrigger>
              </TabsList>

              {/* Account tab */}
              <TabsContent value="account" className="space-y-6">
                <div className="card-elevated p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Profiel informatie</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={profileData.email}
                        disabled
                        className="mt-1.5 bg-muted" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email kan niet worden gewijzigd</p>
                    </div>
                    <div>
                      <Label htmlFor="name">Naam</Label>
                      <Input 
                        id="name" 
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="mt-1.5"
                        disabled={isLoading}
                      />
                    </div>
                    <Button 
                      variant="accent"
                      onClick={handleProfileUpdate}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Opslaan...
                        </>
                      ) : (
                        "Opslaan"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="card-elevated p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Wachtwoord wijzigen</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="new">Nieuw wachtwoord</Label>
                      <Input 
                        id="new" 
                        type="password" 
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        className="mt-1.5"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm">Bevestig nieuw wachtwoord</Label>
                      <Input 
                        id="confirm" 
                        type="password" 
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        className="mt-1.5"
                        disabled={isLoading}
                      />
                    </div>
                    <Button 
                      variant="outline"
                      onClick={handlePasswordUpdate}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Wijzigen...
                        </>
                      ) : (
                        "Wachtwoord wijzigen"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Billing tab */}
              <TabsContent value="billing" className="space-y-6">
                {subscriptionLoading ? (
                  <div className="card-elevated p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
                    <p className="text-muted-foreground">Billing informatie laden...</p>
                  </div>
                ) : (
                  <>
                    <div className="card-elevated p-6">
                      <h2 className="text-lg font-bold text-foreground mb-4">Huidig abonnement</h2>
                      {subscriptionData ? (
                        <>
                          <div className="flex items-center justify-between p-4 bg-accent/5 rounded-xl mb-4">
                            <div>
                              <p className="font-bold text-foreground capitalize">
                                {subscriptionData.subscription_tier === 'free' ? 'Free' :
                                 subscriptionData.subscription_tier === 'pro' ? 'Pro' :
                                 subscriptionData.subscription_tier === 'plus' ? 'Plus' :
                                 subscriptionData.subscription_tier === 'max' ? 'Max' : 'Free'} Plan
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {subscriptionData.subscription_info 
                                  ? `Actief tot ${new Date(subscriptionData.subscription_info.current_period_end * 1000).toLocaleDateString('nl-NL')}`
                                  : 'Geen actief abonnement'}
                              </p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              subscriptionData.subscription_tier === 'free' 
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-success/10 text-success'
                            }`}>
                              {subscriptionData.subscription_tier === 'free' ? 'Free' : 'Actief'}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              variant="outline"
                              onClick={() => window.location.href = '/pricing'}
                            >
                              Upgrade plan
                            </Button>
                            {subscriptionData.subscription_tier !== 'free' && (
                              <Button 
                                variant="ghost" 
                                className="text-destructive"
                                onClick={async () => {
                                  try {
                                    await api.cancelSubscription(false);
                                    toast({
                                      title: "Abonnement opgezegd",
                                      description: "Je abonnement wordt opgezegd aan het einde van de huidige periode.",
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Fout",
                                      description: error.message || "Kon abonnement niet opzeggen",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Opzeggen
                              </Button>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Geen abonnement informatie beschikbaar</p>
                      )}
                    </div>

                    <div className="card-elevated p-6">
                      <h2 className="text-lg font-bold text-foreground mb-4">Betaalmethode</h2>
                      {subscriptionData?.payment_method ? (
                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-card rounded border border-border flex items-center justify-center text-xs uppercase">
                              {subscriptionData.payment_method.card?.brand || 'Card'}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                •••• •••• •••• {subscriptionData.payment_method.card?.last4}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Verloopt {subscriptionData.payment_method.card?.exp_month}/{subscriptionData.payment_method.card?.exp_year}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              try {
                                const { url } = await api.getBillingPortal();
                                window.location.href = url;
                              } catch (error: any) {
                                toast({
                                  title: "Fout",
                                  description: error.message || "Kon billing portal niet openen",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Wijzigen
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-muted-foreground">Geen betaalmethode opgeslagen</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={async () => {
                              try {
                                const { url } = await api.getBillingPortal();
                                window.location.href = url;
                              } catch (error: any) {
                                toast({
                                  title: "Fout",
                                  description: error.message || "Kon billing portal niet openen",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Betaalmethode toevoegen
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="card-elevated p-6">
                      <h2 className="text-lg font-bold text-foreground mb-4">Gebruik statistieken</h2>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-2xl font-bold text-foreground">
                            {subscriptionData?.usage?.analyses_this_month || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Analyses deze maand</p>
                        </div>
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-2xl font-bold text-foreground">
                            {subscriptionData?.usage?.credits_used_this_month || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Credits gebruikt</p>
                        </div>
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-2xl font-bold text-foreground">
                            {subscriptionData?.subscription_tier === 'free' ? 'Free' :
                             subscriptionData?.subscription_tier === 'pro' ? '100' :
                             subscriptionData?.subscription_tier === 'plus' ? '180' :
                             subscriptionData?.subscription_tier === 'max' ? '300' : '0'}/dag
                          </p>
                          <p className="text-sm text-muted-foreground">Dagelijks limiet</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Notifications tab */}
              <TabsContent value="notifications" className="space-y-6">
                <div className="card-elevated p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Notificatie voorkeuren</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Email notificaties</p>
                        <p className="text-sm text-muted-foreground">
                          Ontvang updates over je account via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, email: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Push notificaties</p>
                        <p className="text-sm text-muted-foreground">
                          Ontvang push notificaties in je browser
                        </p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, push: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Marketing emails</p>
                        <p className="text-sm text-muted-foreground">
                          Tips, nieuwe features en speciale aanbiedingen
                        </p>
                      </div>
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, marketing: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Privacy tab */}
              <TabsContent value="privacy" className="space-y-6">
                <div className="card-elevated p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Data & Privacy</h2>
                  <p className="text-muted-foreground mb-4">
                    Je privacy is belangrijk voor ons. Al je chats en analyses worden versleuteld
                    opgeslagen en nooit gedeeld met derden.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const data = await api.exportData();
                          // Create downloadable JSON file
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `message-mind-export-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast({
                            title: "Data gedownload",
                            description: "Je data is succesvol gedownload",
                          });
                        } catch (error: any) {
                          toast({
                            title: "Fout",
                            description: error.message || "Kon data niet exporteren",
                            variant: "destructive",
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Exporteren...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download mijn data
                        </>
                      )}
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/privacy" target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Privacy Policy
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="card-elevated p-6 border-destructive/20">
                  <h2 className="text-lg font-bold text-destructive mb-4">Danger Zone</h2>
                  <p className="text-muted-foreground mb-4">
                    Als je je account verwijdert, worden al je data permanent gewist.
                    Dit kan niet ongedaan worden gemaakt.
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Account verwijderen
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt. Dit zal permanent je account en alle data verwijderen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsLoading(true);
                try {
                  await api.deleteAccount();
                  toast({
                    title: "Account verwijderd",
                    description: "Je account is verwijderd. Je wordt uitgelogd.",
                  });
                  setTimeout(() => {
                    signOut();
                    window.location.href = '/';
                  }, 2000);
                } catch (error: any) {
                  toast({
                    title: "Fout",
                    description: error.message || "Kon account niet verwijderen",
                    variant: "destructive",
                  });
                } finally {
                  setIsLoading(false);
                  setShowDeleteDialog(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Settings = () => {
  return (
    <ProtectedRoute requireAuth={true}>
      <SettingsContent />
    </ProtectedRoute>
  );
};

export default Settings;
