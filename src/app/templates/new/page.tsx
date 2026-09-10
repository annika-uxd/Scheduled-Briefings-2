"use client";

import { SparkleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { HeraldPanel } from "@/components/herald/herald-panel";
import { StructureList } from "@/components/template/structure-list";
import { TemplatePreview } from "@/components/template/template-preview";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { CreationShell } from "@/components/workflow/creation-shell";
import { cx } from "@/lib/format";
import {
  GENERATION_STEPS,
  REFINEMENT_STEPS,
  TEMPLATE_PROMPT_SUGGESTIONS,
  draftToTemplate,
  generateDraft,
  generationReply,
  refineDraft,
  type TemplateDraft,
} from "@/lib/herald/template-herald";
import { uid, useStore } from "@/lib/store";
import type { HeraldMessage } from "@/lib/types";

let seq = 0;
const msgId = () => `tmsg-${(seq += 1)}`;

/**
 * T3 — New Template. An internal Handraise workflow: the user describes the
 * intelligence product they want and Herald builds the structure. There is no
 * drag-and-drop editor, by design.
 */
export default function NewTemplatePage() {
  const router = useRouter();
  const { addTemplate, pushToast } = useStore();

  const [messages, setMessages] = useState<HeraldMessage[]>([]);
  const [thinking, setThinking] = useState<string | null>(null);
  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const timers = useRef<number[]>([]);

  const say = useCallback((m: Omit<HeraldMessage, "id">) => {
    setMessages((prev) => [...prev, { ...m, id: msgId() }]);
  }, []);

  /** Walks Herald through its visible working states, then resolves. */
  const runSteps = useCallback((steps: readonly string[], done: () => void) => {
    setBusy(true);
    timers.current.forEach(window.clearTimeout);
    timers.current = [];

    steps.forEach((step, i) => {
      timers.current.push(
        window.setTimeout(() => setThinking(step), i * 620),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setThinking(null);
        setBusy(false);
        done();
      }, steps.length * 620),
    );
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      if (busy) return;
      say({ role: "user", text });

      if (!draft) {
        runSteps(GENERATION_STEPS, () => {
          const next = generateDraft(text);
          setDraft(next);
          setName(next.name);
          say({
            role: "herald",
            text: generationReply(next),
            steps: [...GENERATION_STEPS],
          });
        });
        return;
      }

      runSteps(REFINEMENT_STEPS, () => {
        const result = refineDraft(draft, text);
        setDraft(result.draft);
        if (result.draft.name !== draft.name) setName(result.draft.name);
        say({
          role: "herald",
          text: result.reply,
          changes: result.changes.length ? result.changes : undefined,
        });
      });
    },
    [busy, draft, runSteps, say],
  );

  const create = useCallback(() => {
    if (!draft) return;
    const finalName = name.trim() || draft.name;
    const template = draftToTemplate({ ...draft, name: finalName }, uid("tpl"));
    addTemplate(template);
    pushToast({
      tone: "success",
      title: "Template created",
      description: `“${template.name}” is available to build briefings on.`,
    });
    router.push("/templates");
  }, [draft, name, addTemplate, pushToast, router]);

  const clear = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setDraft(null);
    setMessages([]);
    setThinking(null);
    setName("");
    setBusy(false);
  }, []);

  const previewTemplate = useMemo(
    () =>
      draft
        ? {
            id: "draft",
            name: name.trim() || draft.name,
            description: draft.description,
            category: draft.category,
            updatedAt: "Draft",
            createdBy: "Handraise editorial",
            sections: draft.sections,
            blocks: draft.blocks,
          }
        : null,
    [draft, name],
  );

  return (
    <CreationShell
      title="New template"
      onClose={() => router.push("/templates")}
      actions={
        <>
          {draft ? <Button onClick={clear}>Clear canvas</Button> : null}
          <Button variant="primary" disabled={!draft || busy} onClick={create}>
            Create template
          </Button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside
          className={cx(
            "flex min-h-0 shrink-0 flex-col border-grey-200",
            "h-[45dvh] border-b lg:h-auto lg:w-[min(34%,380px)] lg:border-r lg:border-b-0",
          )}
        >
          <HeraldPanel
            status="Ready"
            thinking={thinking}
            disabled={busy}
            onSend={handleSend}
            suggestionsLabel="Try a prompt"
            suggestions={TEMPLATE_PROMPT_SUGGESTIONS}
            messages={messages}
            placeholder="Describe what you want…"
            intro={
              <>
                Describe the briefing or report you want. I&rsquo;ll build the
                layout and you can refine it in conversation.
              </>
            }
            footer={
              draft ? (
                <div>
                  <Label htmlFor="template-name">Template name</Label>
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={draft.name}
                  />
                </div>
              ) : undefined
            }
          />
        </aside>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-grey-50">
          {previewTemplate && draft ? (
            <div className="mx-auto max-w-[1080px] px-5 py-6 sm:px-8 sm:py-8">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <p className="label-caps">Preview</p>
                <p className="text-[12px] text-grey-500">{draft.description}</p>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_268px]">
                <TemplatePreview template={previewTemplate} />

                <aside className="xl:order-last">
                  <p className="label-caps mb-2.5">Structure</p>
                  <StructureList
                    blocks={draft.blocks}
                    sections={draft.sections}
                    compact
                  />
                </aside>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 py-16">
              <div className="max-w-[420px] text-center">
                <span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <SparkleIcon size={17} weight="fill" />
                </span>
                <p className="mt-3.5 text-[15px] font-medium text-grey-900">
                  Build your report
                </p>
                <p className="mt-1.5 text-[13px] leading-[20px] text-grey-600">
                  Describe the briefing in the chat — for example, &ldquo;a media
                  coverage briefing with 4 KPIs, a coverage-over-time chart and a
                  top articles table&rdquo; — and Herald will lay it out here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CreationShell>
  );
}
