"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Radio,
  Plus,
  Trash2,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code2,
  Eye,
  EyeOff,
  Send,
  Zap,
  Cpu,
  Database,
  Layers,
  Terminal,
  Server
} from "lucide-react";
import {
  fetchWebhookSubscriptions,
  createWebhookSubscription,
  deleteWebhookSubscription,
  fetchWebhookLogs,
  publishTestEvent,
  fetchSystemHealth,
  WebhookSubscription,
  WebhookLog,
  SystemHealth
} from "@/lib/webhooks";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function WebhooksPage() {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Subscription modal state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [secretToken, setSecretToken] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "billing.paid",
    "vitals.critical",
    "appointment.created",
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Event simulator state
  const [testEvent, setTestEvent] = useState("billing.paid");
  const [dispatching, setDispatching] = useState(false);

  // Payload inspector state
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [revealSecrets, setRevealSecrets] = useState<Record<number, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      const [subsData, logsData, healthData] = await Promise.all([
        fetchWebhookSubscriptions().catch(() => []),
        fetchWebhookLogs(30).catch(() => []),
        fetchSystemHealth().catch(() => null),
      ]);
      setSubscriptions(subsData);
      setLogs(logsData);
      if (healthData) setHealth(healthData);
    } catch (err: any) {
      console.error("Error loading webhooks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetUrl) {
      toast.warning("Validation Error", "Please provide a name and target URL.");
      return;
    }

    setSubmitting(true);
    try {
      await createWebhookSubscription({
        name,
        targetUrl,
        eventTypes: selectedEvents,
        secretToken: secretToken || undefined,
      });
      toast.success("Webhook Registered", `Endpoint ${name} subscribed to ${selectedEvents.length} events.`);
      setCreateDialogOpen(false);
      setName("");
      setTargetUrl("");
      setSecretToken("");
      loadData();
    } catch (err: any) {
      toast.error("Registration Failed", err.message || "Could not register webhook.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    try {
      await deleteWebhookSubscription(id);
      toast.success("Webhook Deleted", "Subscription removed from worker pool.");
      loadData();
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "Could not delete subscription.");
    }
  };

  const handleTriggerTestEvent = async () => {
    setDispatching(true);
    try {
      let sampleData: any = {};
      if (testEvent === "billing.paid") {
        sampleData = { billId: 104, patientId: 2, amount: 450.0, method: "Credit Card", timestamp: Date.now() };
      } else if (testEvent === "vitals.critical") {
        sampleData = { patientId: 1, admissionId: 2, anomaly: "Severe Hypoxia (SpO2 86%)", heartRate: 142 };
      } else {
        sampleData = { appointmentId: 42, patientId: 3, doctorId: 1, date: new Date().toISOString() };
      }

      await publishTestEvent(testEvent, sampleData);
      toast.success("Event Dispatched", `Queued "${testEvent}" to 10 Go background workers.`);
      setTimeout(() => {
        loadData();
      }, 800);
    } catch (err: any) {
      toast.error("Dispatch Failed", err.message || "Failed to trigger event.");
    } finally {
      setDispatching(false);
    }
  };

  const toggleEvent = (ev: string) => {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Microservice Health Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">Developer & Webhooks Hub</h1>
            <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 py-0.5">
              <Cpu className="h-3 w-3 mr-1" /> Go Microservice Engine
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Asynchronous 10-worker dispatch pool, HMAC-SHA256 signatures, and exponential backoff retry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            disabled={refreshing}
            className="cursor-pointer"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="cursor-pointer bg-primary text-primary-foreground"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Webhook Target
          </Button>
        </div>
      </div>

      {/* Backend Infrastructure Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-emerald-500 bg-muted/20">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Worker Pool</span>
              <p className="text-lg font-bold font-mono">10 Workers</p>
            </div>
            <Zap className="h-5 w-5 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-muted/20">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Queue Buffer</span>
              <p className="text-lg font-bold font-mono">500 Jobs</p>
            </div>
            <Layers className="h-5 w-5 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-muted/20">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Signatures</span>
              <p className="text-lg font-bold font-mono">HMAC SHA-256</p>
            </div>
            <Cpu className="h-5 w-5 text-purple-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-muted/20">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Microservice Health</span>
              <p className="text-lg font-bold font-mono text-emerald-500">
                {health?.status || "HEALTHY"}
              </p>
            </div>
            <Server className="h-5 w-5 text-amber-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Manual Event Trigger Sandbox */}
      <Card className="border-dashed border-border/80 bg-muted/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Live Event Ingestion Sandbox
              </CardTitle>
              <CardDescription className="text-xs">
                Trigger real hospital events to test worker queueing and delivery to active webhook targets.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={testEvent}
                onChange={(e) => setTestEvent(e.target.value)}
                className="h-8 px-2.5 rounded-md border border-border bg-background text-xs font-mono"
              >
                <option value="billing.paid">billing.paid</option>
                <option value="vitals.critical">vitals.critical</option>
                <option value="appointment.created">appointment.created</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTriggerTestEvent}
                disabled={dispatching}
                className="h-8 text-xs font-semibold cursor-pointer border-primary/40 hover:bg-primary/10"
              >
                <Play className={`mr-1.5 h-3.5 w-3.5 text-primary ${dispatching ? "animate-spin" : ""}`} />
                {dispatching ? "Publishing..." : "Publish Event"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subscriptions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Registered Webhook Endpoints</CardTitle>
            <CardDescription className="text-xs">Active third-party integrations receiving real-time hospital payloads.</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">{subscriptions.length} Active</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap">Target Endpoint</TableHead>
                <TableHead className="whitespace-nowrap">Subscribed Events</TableHead>
                <TableHead className="whitespace-nowrap">HMAC Secret</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-52" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <EmptyState
                      icon={Radio}
                      title="No webhook targets registered"
                      description="Create an endpoint above to stream events to pharmacy, insurance, or telemetry systems."
                      actionLabel="Register First Target"
                      onAction={() => setCreateDialogOpen(true)}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => {
                  const isRevealed = revealSecrets[sub.id];

                  return (
                    <TableRow key={sub.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-foreground">{sub.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{sub.targetUrl}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sub.eventTypes?.map((ev) => (
                            <Badge key={ev} variant="outline" className="text-[10px] font-mono py-0">
                              {ev}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                            {isRevealed ? sub.secretToken : "••••••••••••••••"}
                          </code>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealSecrets((prev) => ({ ...prev, [sub.id]: !isRevealed }))
                            }
                            className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                            title={isRevealed ? "Hide Secret" : "Reveal Secret"}
                          >
                            {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSubscription(sub.id)}
                          className="h-7 px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delivery Attempt Logs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Delivery Attempt Logs</CardTitle>
            <CardDescription className="text-xs">Historical audit trail of outgoing webhook dispatches and HTTP responses.</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">{logs.length} Logged Deliveries</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                <TableHead className="whitespace-nowrap">Event Type</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">HTTP Code</TableHead>
                <TableHead className="whitespace-nowrap">Attempts</TableHead>
                <TableHead className="text-right whitespace-nowrap">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-7 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <EmptyState
                      icon={Terminal}
                      title="No delivery logs recorded yet"
                      description="When events occur or are published in the sandbox, dispatch attempts will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === "SUCCESS" || (log.responseStatus && log.responseStatus >= 200 && log.responseStatus < 300);

                  return (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {log.eventType}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isSuccess ? "success" : "destructive"}
                          className="text-[10px] font-mono uppercase"
                        >
                          {log.status || (isSuccess ? "SUCCESS" : "FAILED")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold">
                        {log.responseStatus || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.attemptCount || 1}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 px-2 text-xs font-mono cursor-pointer hover:border-primary/50"
                        >
                          <Code2 className="mr-1 h-3.5 w-3.5 text-primary" /> View Payload
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Register Subscription Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogHeader>
          <DialogTitle>Register Webhook Target</DialogTitle>
          <DialogDescription>
            Configure an external system endpoint to receive signed JSON HTTP POST payloads.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateSubscription} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="sub-name">Integration Name</Label>
            <Input
              id="sub-name"
              placeholder="e.g. Pharmacy Fulfillment API"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-url">Target URL</Label>
            <Input
              id="sub-url"
              placeholder="https://example.com/api/hospital-events"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-secret">Secret Token (Optional - auto-generated if blank)</Label>
            <Input
              id="sub-secret"
              placeholder="Custom HMAC signing key"
              value={secretToken}
              onChange={(e) => setSecretToken(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Subscribed Event Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "billing.paid", label: "billing.paid" },
                { id: "vitals.critical", label: "vitals.critical" },
                { id: "appointment.created", label: "appointment.created" },
                { id: "admission.created", label: "admission.created" },
              ].map((ev) => {
                const checked = selectedEvents.includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => toggleEvent(ev.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                      checked
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/70 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{ev.label}</span>
                    {checked && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registering..." : "Register Webhook"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Payload Inspector Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Webhook Dispatch Details (Log #{selectedLog?.id})
          </DialogTitle>
          <DialogDescription>
            Raw JSON event payload and remote delivery response information.
          </DialogDescription>
        </DialogHeader>

        {selectedLog && (
          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border">
              <span>Event: <strong className="text-foreground">{selectedLog.eventType}</strong></span>
              <span>Status: <strong className={selectedLog.status === "SUCCESS" ? "text-emerald-500" : "text-rose-500"}>{selectedLog.status}</strong></span>
              <span>HTTP Code: <strong>{selectedLog.responseStatus || "N/A"}</strong></span>
            </div>

            <div>
              <span className="font-semibold block mb-1 text-muted-foreground">Outgoing JSON Payload:</span>
              <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed max-h-48">
                {typeof selectedLog.payload === "string"
                  ? selectedLog.payload
                  : JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            </div>

            {selectedLog.responseBody && (
              <div>
                <span className="font-semibold block mb-1 text-muted-foreground">Remote Response Body:</span>
                <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed max-h-32">
                  {selectedLog.responseBody}
                </pre>
              </div>
            )}

            <DialogFooter>
              <Button size="sm" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
