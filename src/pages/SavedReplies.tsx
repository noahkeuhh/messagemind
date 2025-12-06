import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Search,
  Bookmark,
  Copy,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

const SavedRepliesContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["savedReplies"],
    queryFn: () => api.getSavedReplies(),
    refetchInterval: false, // Disable auto-refresh to prevent flickering
    staleTime: 60000, // Consider data fresh for 60 seconds
  });

  const replies = data?.replies || [];

  const filteredReplies = replies.filter((reply) =>
    reply.reply_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Gekopieerd!",
      description: "Antwoord gekopieerd naar klembord",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit antwoord wilt verwijderen?")) {
      return;
    }

    try {
      await api.deleteSavedReply(id);
      queryClient.invalidateQueries({ queryKey: ["savedReplies"] });
      toast({
        title: "Verwijderd",
        description: "Antwoord is verwijderd",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Kon antwoord niet verwijderen",
        variant: "destructive",
      });
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">Opgeslagen antwoorden</h1>
                <p className="text-muted-foreground">Je favoriete replies voor later gebruik</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoeken..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Saved replies grid */}
            {isLoading ? (
              <div className="card-elevated p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
                <p className="text-muted-foreground">Opgeslagen antwoorden laden...</p>
              </div>
            ) : error ? (
              <div className="card-elevated p-12 text-center">
                <p className="text-destructive">Fout bij laden van opgeslagen antwoorden</p>
              </div>
            ) : filteredReplies.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredReplies.map((reply, index) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-elevated p-5 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-accent">
                        {reply.reply_type || "Algemeen"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: nl })}
                      </span>
                    </div>
                    
                    <p className="text-foreground mb-4 leading-relaxed">{reply.reply_text}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(reply.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(reply.id, reply.reply_text)}
                      >
                        {copiedId === reply.id ? (
                          <>
                            <Check className="h-4 w-4 text-success mr-2" />
                            Gekopieerd
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Kopieer
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="card-elevated p-12 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {searchQuery ? "Geen resultaten gevonden" : "Nog geen opgeslagen antwoorden"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Probeer een andere zoekterm."
                    : "Klik op de ster bij een antwoord om hem hier op te slaan."}
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

const SavedReplies = () => {
  return (
    <ProtectedRoute requireAuth={true}>
      <SavedRepliesContent />
    </ProtectedRoute>
  );
};

export default SavedReplies;
