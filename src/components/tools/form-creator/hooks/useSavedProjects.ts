import { useState, useEffect, useCallback } from 'react';
import { SavedProject, VisualField } from '../types';
import {
  getSavedProjects,
  saveProjectToStorage,
  deleteProjectFromStorage,
} from '../services/projectStorage';

export function useSavedProjects() {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  useEffect(() => {
    setSavedProjects(getSavedProjects());
  }, []);

  const saveProject = useCallback(
    (projectName: string, fileName: string, fields: VisualField[]) => {
      const updated = saveProjectToStorage(projectName, fileName, fields, savedProjects);
      setSavedProjects(updated);
    },
    [savedProjects]
  );

  const deleteProject = useCallback(
    (projectId: string) => {
      const updated = deleteProjectFromStorage(projectId, savedProjects);
      setSavedProjects(updated);
    },
    [savedProjects]
  );

  return {
    savedProjects,
    saveProject,
    deleteProject,
  };
}
