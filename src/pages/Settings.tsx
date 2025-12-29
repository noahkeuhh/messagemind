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
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.new.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
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
        title: "Password updated",
        description: "Your password has been successfully changed",
      });

      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not change password",
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
            <h1 className="text-2xl font-bold font-display text-foreground mb-6">Settings</h1>

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
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="privacy" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy
                </TabsTrigger>
              </TabsList>

              {/* Account tab */}
              <TabsContent value="account" className="space-y-6">
                <div className="card-elevated p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Profile Information</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={profileData.email}
                        disabled
                        className="mt-1.5 bg-muted" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="name">Name</Label>
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
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="card-elevated p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Change Password</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="new">New Password</Label>
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
                      <Label htmlFor="confirm">Confirm New Password</Label>
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
                          Changing...
                        </>
                      ) : (
                        "Change Password"
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
                    <p className="text-muted-foreground">Loading billing information...</p>
                  </div>
                ) : (
                  <>
                    <div className="card-elevated p-6">
                      <h2 className="text-lg font-bold text-foreground mb-4">Current Subscription</h2>
                      {subscriptionData ? (
                        <>
                          <div className="p-4 bg-accent/5 rounded-xl mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-bold text-foreground capitalize">
                                  {subscriptionData.subscription_tier === 'free' ? 'Free' :
                                   subscriptionData.subscription_tier === 'pro' ? 'Pro' :
                                   subscriptionData.subscription_tier === 'plus' ? 'Plus' :
                                   subscriptionData.subscription_tier === 'max' ? 'Max' : 'Free'} Plan
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {subscriptionData.subscription_info 
                                    ? `Active until ${new Date(subscriptionData.subscription_info.current_period_end * 1000).toLocaleDateString('en-US')}`
                                    : subscriptionData.subscription_tier === 'free' ? '1 analysis per month' : 'No active subscription'}
                                </p>
                              </div>
                              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                subscriptionData.subscription_tier === 'free' 
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-success/10 text-success'
                              }`}>
                                {subscriptionData.subscription_tier === 'free' ? 'Free' : 'Active'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {subscriptionData.subscription_tier === 'free' && (
                                <>
                                  <p>✓ 1 free analysis per month</p>
                                  <p>✓ Snapshot mode</p>
                                </>
                              )}
                              {subscriptionData.subscription_tier === 'pro' && (
                                <>
                                  <p>✓ 100 credits per day</p>
                                  <p>✓ Snapshot & Expanded modes</p>
                                </>
                              )}
                              {subscriptionData.subscription_tier === 'plus' && (
                                <>
                                  <p>✓ 180 credits per day</p>
                                  <p>✓ Auto mode selection</p>
                                  <p>✓ Expanded mode included</p>
                                  <p>✓ Deep analysis toggle (+12 credits)</p>
                                </>
                              )}
                              {subscriptionData.subscription_tier === 'max' && (
                                <>
                                  <p>✓ 300 credits per day</p>
                                  <p>✓ Auto mode selection</p>
                                  <p>✓ Deep mode included (×1.2)</p>
                                </>
                              )}
                            </div>
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
                                    title: "Subscription cancelled",
                                    description: "Your subscription will be cancelled at the end of the current period.",
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Fout",
                                      description: error.message || "Could not cancel subscription",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-muted-foreground">No subscription information available</p>
                      )}
                    </div>

                    <div className="card-elevated p-6">
                      <h2 className="text-lg font-bold text-foreground mb-4">Payment Method</h2>
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
                                Expires {subscriptionData.payment_method.card?.exp_month}/{subscriptionData.payment_method.card?.exp_year}
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
                            Change
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-muted-foreground">No payment method saved</p>
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
                                  title: "Error",
                                  description: error.message || "Could not open billing portal",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Add Payment Method
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="card-elevated p-6">
                      <h2 className="text-lg font-bold text-foreground mb-4">Usage Statistics</h2>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-2xl font-bold text-foreground">
                            {subscriptionData?.usage?.analyses_this_month || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Analyses this month</p>
                        </div>
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-2xl font-bold text-foreground">
                            {subscriptionData?.usage?.credits_used_this_month || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Credits used</p>
                        </div>
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-2xl font-bold text-foreground">
                            {subscriptionData?.subscription_tier === 'free' ? 'Free' :
                             subscriptionData?.subscription_tier === 'pro' ? '100' :
                             subscriptionData?.subscription_tier === 'plus' ? '180' :
                             subscriptionData?.subscription_tier === 'max' ? '300' : '0'}/day
                          </p>
                          <p className="text-sm text-muted-foreground">Daily limit</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Notifications tab */}
              <TabsContent value="notifications" className="space-y-6">
                <div className="card-elevated p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Notification Preferences</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about your account via email
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
                        <p className="font-medium text-foreground">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in your browser
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
                        <p className="font-medium text-foreground">Marketing Emails</p>
                        <p className="text-sm text-muted-foreground">
                          Tips, new features and special offers
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
                    Your privacy is important to us. All your chats and analyses are encrypted
                    and stored securely and never shared with third parties.
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
                            title: "Data downloaded",
                            description: "Your data was successfully downloaded",
                          });
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Could not export data",
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
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download my data
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
                    If you delete your account, all your data will be permanently erased.
                    This cannot be undone.
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
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
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and all data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsLoading(true);
                try {
                  await api.deleteAccount();
                  toast({
                    title: "Account deleted",
                    description: "Your account has been deleted. You will be logged out.",
                  });
                  setTimeout(() => {
                    signOut();
                    window.location.href = '/';
                  }, 2000);
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Could not delete account",
                    variant: "destructive",
                  });
                } finally {
                  setIsLoading(false);
                  setShowDeleteDialog(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
