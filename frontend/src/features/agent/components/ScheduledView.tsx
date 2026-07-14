"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Pause, Play, Plus, Trash2 } from "lucide-react";

export interface ScheduledTask {
  id: string;
  name: string;
  prompt: string;
  cadence: "daily" | "weekly" | "monthly";
  enabled: boolean;
}

const STORAGE_KEY = "sea-scheduled-tasks";

export function ScheduledView({ onRun }: { onRun: (prompt: string) => void }) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cadence, setCadence] = useState<ScheduledTask["cadence"]>("daily");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setTasks(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { setTasks([]); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function update(next: ScheduledTask[]) {
    setTasks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !prompt.trim()) return;
    update([...tasks, { id: crypto.randomUUID(), name: name.trim(), prompt: prompt.trim(), cadence, enabled: true }]);
    setName(""); setPrompt(""); setFormOpen(false);
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl px-8 py-8">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-semibold">Scheduled</h1><p className="mt-1 text-sm text-muted-foreground">Save recurring tasks and launch them into SEA.</p></div>
          <button onClick={() => setFormOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background"><Plus className="h-4 w-4" /> New schedule</button>
        </div>
        <div className="mt-7 space-y-3">
          {tasks.length ? tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><CalendarClock className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.name}</p><p className="truncate text-xs text-muted-foreground">{task.cadence} · {task.prompt}</p></div>
              <button onClick={() => onRun(task.prompt)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">Run now</button>
              <button onClick={() => update(tasks.map((item) => item.id === task.id ? { ...item, enabled: !item.enabled } : item))} className="rounded-md p-2 hover:bg-accent" aria-label={task.enabled ? "Pause schedule" : "Enable schedule"}>{task.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <button onClick={() => update(tasks.filter((item) => item.id !== task.id))} className="rounded-md p-2 hover:bg-red-500/10 hover:text-red-400" aria-label="Delete schedule"><Trash2 className="h-4 w-4" /></button>
            </div>
          )) : <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No scheduled tasks</div>}
        </div>
      </div>
      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
          <form onSubmit={createTask} className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl">
            <h2 className="font-semibold">New schedule</h2>
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none" />
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What should SEA do?" rows={4} className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none" />
            <select value={cadence} onChange={(event) => setCadence(event.target.value as ScheduledTask["cadence"])} className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-accent">Cancel</button><button type="submit" className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">Create</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
