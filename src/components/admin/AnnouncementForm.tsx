"use client";

import { useActionState } from "react";
import { saveAnnouncement } from "@/server/cms/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { SELECT_CLASS } from "@/components/admin/formStyles";

export type AnnouncementDefaults = {
  id?: string;
  title: string;
  titleBn: string;
  body: string;
  bodyBn: string;
  audience: string;
  pinned: boolean;
  published: boolean;
  publishAt: string;
  expiresAt: string;
};

const TEXTAREA =
  "mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30";

export function AnnouncementForm({ defaults }: { defaults: AnnouncementDefaults }) {
  const [state, action, pending] = useActionState(saveAnnouncement, undefined);
  const err = state?.errors;

  return (
    <form action={action} className="space-y-5" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div>
        <Field label="Title" name="title" required defaultValue={defaults.title} errors={err?.title} />
      </div>

      <RichTextEditor
        label="Message"
        name="body"
        id="body"
        defaultValue={defaults.body}
        errors={err?.body}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-slate-700">
            Audience
          </label>
          <select id="audience" name="audience" defaultValue={defaults.audience} className={SELECT_CLASS}>
            <option value="EVERYONE">Everyone</option>
            <option value="MEMBERS">Signed-in members</option>
            <option value="MODERATORS">Moderators &amp; staff</option>
          </select>
        </div>
        <Field
          label="Publish at"
          name="publishAt"
          type="datetime-local"
          defaultValue={defaults.publishAt}
          hint="Leave blank to publish immediately."
          errors={err?.publishAt}
        />
        <Field
          label="Expires at"
          name="expiresAt"
          type="datetime-local"
          defaultValue={defaults.expiresAt}
          errors={err?.expiresAt}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="published"
            defaultChecked={defaults.published}
            className="h-4 w-4 rounded border-slate-300"
          />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={defaults.pinned}
            className="h-4 w-4 rounded border-slate-300"
          />
          Pin to the top
        </label>
      </div>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Saving…" : "Save announcement"}
      </Button>
    </form>
  );
}
