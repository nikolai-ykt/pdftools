import { SavedProject, VisualField } from '../types';

const STORAGE_KEY = 'formCreator_savedProjects';

export function getSavedProjects(): SavedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Failed to load saved projects:', err);
    return [];
  }
}

export function saveProjectToStorage(
  projectName: string,
  fileName: string,
  fields: VisualField[],
  currentProjects: SavedProject[]
): SavedProject[] {
  const projectId = `project_${Date.now()}`;
  const newProject: SavedProject = {
    id: projectId,
    name: projectName || `Form Project ${currentProjects.length + 1}`,
    fileName,
    fields,
    savedAt: Date.now(),
  };

  const updatedProjects = [...currentProjects, newProject];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  } catch (err) {
    console.error('Failed to save project:', err);
  }

  return updatedProjects;
}

export function deleteProjectFromStorage(
  projectId: string,
  currentProjects: SavedProject[]
): SavedProject[] {
  const updatedProjects = currentProjects.filter((p) => p.id !== projectId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  } catch (err) {
    console.error('Failed to delete project:', err);
  }
  return updatedProjects;
}
