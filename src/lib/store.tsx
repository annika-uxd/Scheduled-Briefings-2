"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { BRIEFINGS } from "@/lib/data/briefings";
import { TEMPLATES } from "@/lib/data/templates";
import type { Briefing, Edition, Template } from "@/lib/types";

/**
 * All mutable prototype state lives here: briefings, templates and toasts.
 * Local state only — there is no backend, and every interaction resolves
 * synchronously so the prototype behaves the same way every time.
 */

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: "success" | "info";
}

interface StoreValue {
  briefings: Briefing[];
  templates: Template[];
  toasts: Toast[];

  getBriefing: (id: string) => Briefing | undefined;
  getTemplate: (id: string) => Template | undefined;
  /** How many briefings currently run on a template. */
  briefingCountFor: (templateId: string) => number;

  addBriefing: (briefing: Briefing) => void;
  deleteBriefing: (id: string) => void;
  updateEdition: (briefingId: string, next: Edition) => void;

  addTemplate: (template: Template) => void;
  duplicateTemplate: (id: string) => Template | undefined;

  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let idSeq = 0;
function uid(prefix: string) {
  idSeq += 1;
  return `${prefix}-${idSeq}-${Date.now().toString(36)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [briefings, setBriefings] = useState<Briefing[]>(BRIEFINGS);
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addBriefing = useCallback((briefing: Briefing) => {
    setBriefings((prev) => [briefing, ...prev]);
  }, []);

  const deleteBriefing = useCallback((id: string) => {
    setBriefings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateEdition = useCallback((briefingId: string, next: Edition) => {
    setBriefings((prev) =>
      prev.map((b) => (b.id === briefingId ? { ...b, edition: next } : b)),
    );
  }, []);

  const addTemplate = useCallback((template: Template) => {
    setTemplates((prev) => [template, ...prev]);
  }, []);

  const duplicateTemplate = useCallback(
    (id: string) => {
      const source = templates.find((t) => t.id === id);
      if (!source) return undefined;
      const copy: Template = {
        ...structuredClone(source),
        id: uid("tpl"),
        name: `${source.name} (copy)`,
        updatedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
      setTemplates((prev) => {
        const index = prev.findIndex((t) => t.id === id);
        const next = [...prev];
        next.splice(index + 1, 0, copy);
        return next;
      });
      return copy;
    },
    [templates],
  );

  const value = useMemo<StoreValue>(
    () => ({
      briefings,
      templates,
      toasts,
      getBriefing: (id) => briefings.find((b) => b.id === id),
      getTemplate: (id) => templates.find((t) => t.id === id),
      briefingCountFor: (templateId) =>
        briefings.filter((b) => b.templateId === templateId).length,
      addBriefing,
      deleteBriefing,
      updateEdition,
      addTemplate,
      duplicateTemplate,
      pushToast,
      dismissToast,
    }),
    [
      briefings,
      templates,
      toasts,
      addBriefing,
      deleteBriefing,
      updateEdition,
      addTemplate,
      duplicateTemplate,
      pushToast,
      dismissToast,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export { uid };
