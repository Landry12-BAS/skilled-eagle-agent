"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Folder, FolderGit2, Pin, Plus, Search, Trash2 } from "lucide-react";

export interface ProjectSummary {
  id: string;
  name: string;
  source: string;
  updated: string;
  fileCount: number;
  pinned: boolean;
}

interface ProjectsViewProps {
  projects: ProjectSummary[];
  onNewProject: () => void;
  onOpenFolder: () => void;
  onOpenProject: (project: ProjectSummary) => void;
  onTogglePin: (id: string) => void;
  onRemoveProject: (id: string) => void;
}

export function ProjectsView({ projects, onNewProject, onOpenFolder, onOpenProject, onTogglePin, onRemoveProject }: ProjectsViewProps) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects
      .filter((project) => !normalized || project.name.toLowerCase().includes(normalized))
      .sort((left, right) => Number(right.pinned) - Number(left.pinned));
  }, [projects, query]);

  return (
    <div className="h-full flex-1 overflow-y-auto bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <div className="relative">
            <button onClick={() => setMenuOpen((open) => !open)} className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
              <Plus className="w-4 h-4" /> New
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                <button onClick={() => { setMenuOpen(false); onNewProject(); }} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">Start from scratch</button>
                <button onClick={() => { setMenuOpen(false); onOpenFolder(); }} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">Open local folder</button>
              </div>
            )}
          </div>
        </div>

        <div className="relative mt-7">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" className="w-full rounded-xl border border-border bg-muted/40 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-foreground/30" />
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <div className="hidden grid-cols-[2fr_1.2fr_0.8fr_auto] gap-4 border-b border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:grid">
            <span>Name</span><span>Source</span><span className="flex items-center gap-1">Updated <ChevronDown className="h-3 w-3" /></span><span className="w-20" />
          </div>
          {filteredProjects.length ? filteredProjects.map((project) => (
            <div key={project.id} className="group grid gap-2 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-accent/40 sm:grid-cols-[2fr_1.2fr_0.8fr_auto] sm:items-center sm:gap-4">
              <button onClick={() => onOpenProject(project)} className="flex min-w-0 items-center gap-3 text-left">
                <Folder className="h-4 w-4 shrink-0 text-blue-400" />
                <span className="truncate text-sm font-medium">{project.name}</span>
                {project.pinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />}
              </button>
              <span className="truncate text-xs text-muted-foreground">{project.source} · {project.fileCount} files</span>
              <span className="text-xs text-muted-foreground">{project.updated}</span>
              <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 sm:w-20 sm:opacity-60">
                <button onClick={() => onTogglePin(project.id)} className="rounded-md p-1.5 hover:bg-accent" aria-label={project.pinned ? "Unpin project" : "Pin project"}><Pin className="h-3.5 w-3.5" /></button>
                <button onClick={() => onRemoveProject(project.id)} className="rounded-md p-1.5 hover:bg-red-500/10 hover:text-red-400" aria-label="Remove project"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center py-16 text-center">
              <FolderGit2 className="h-8 w-8 text-muted-foreground/50" />
              <h2 className="mt-4 text-sm font-medium">{query ? "No matching projects" : "No projects yet"}</h2>
              {!query && <button onClick={onNewProject} className="mt-4 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">Create project</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
