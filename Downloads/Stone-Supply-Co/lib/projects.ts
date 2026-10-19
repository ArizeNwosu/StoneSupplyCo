/**
 * Saved Projects — localStorage persistence.
 * No auth required. Data lives in the browser only.
 */

export type SavedProject = {
  id: string;
  name: string;
  materialSlugs: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "ssc:projects";

function read(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedProject[]) : [];
  } catch {
    return [];
  }
}

function write(projects: SavedProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProjects(): SavedProject[] {
  return read();
}

export function getProject(id: string): SavedProject | null {
  return read().find((p) => p.id === id) ?? null;
}

export function createProject(name: string, notes = ""): SavedProject {
  const now = new Date().toISOString();
  const project: SavedProject = {
    id: crypto.randomUUID(),
    name: name.trim() || "My project",
    materialSlugs: [],
    notes,
    createdAt: now,
    updatedAt: now,
  };
  write([...read(), project]);
  return project;
}

export function updateProject(
  id: string,
  updates: Partial<Pick<SavedProject, "name" | "notes" | "materialSlugs">>
): SavedProject | null {
  const projects = read();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const updated: SavedProject = {
    ...projects[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  projects[idx] = updated;
  write(projects);
  return updated;
}

export function deleteProject(id: string): void {
  write(read().filter((p) => p.id !== id));
}

export function addMaterialToProject(
  projectId: string,
  slug: string
): SavedProject | null {
  const project = getProject(projectId);
  if (!project) return null;
  if (project.materialSlugs.includes(slug)) return project;
  return updateProject(projectId, {
    materialSlugs: [...project.materialSlugs, slug],
  });
}

export function removeMaterialFromProject(
  projectId: string,
  slug: string
): SavedProject | null {
  const project = getProject(projectId);
  if (!project) return null;
  return updateProject(projectId, {
    materialSlugs: project.materialSlugs.filter((s) => s !== slug),
  });
}

/** Saved (bookmarked) individual materials — single flat list across projects */
const SAVED_KEY = "ssc:saved";

export function getSavedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleSaved(slug: string): boolean {
  const slugs = getSavedSlugs();
  const isSaved = slugs.includes(slug);
  if (isSaved) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(slugs.filter((s) => s !== slug)));
    return false;
  } else {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...slugs, slug]));
    return true;
  }
}
