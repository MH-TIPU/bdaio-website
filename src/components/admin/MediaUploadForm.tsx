"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { uploadMedia } from "@/server/admin/media";

const MAX_BYTES = 2 * 1024 * 1024; // keep in step with saveImage()

export function MediaUploadForm() {
  const [state, action, pending] = useActionState(uploadMedia, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Clear the form after a successful upload, so uploading a second image does
  // not silently re-post the first one's title.
  //
  // Split deliberately: dropping the preview is a state adjustment and belongs
  // in render (each submit yields a new state object, so this runs once per
  // result), while resetting the DOM form and refetching the list are external
  // effects. Doing the former in an effect would cascade an extra render.
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state?.success) setPreview(null);
  }

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setLocalError(null);
    if (!file) {
      setPreview(null);
      return;
    }
    // Friendly check only; saveImage() enforces this again on the server.
    if (file.size > MAX_BYTES) {
      setLocalError("Image must be 2 MB or smaller.");
      event.target.value = "";
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  const fileError = localError ? [localError] : state?.errors?.file;

  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      <div className="flex items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
          {preview ? (
            // A blob: URL from the file picker cannot go through next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-slate-400">Preview</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="file" className="block text-sm font-medium text-slate-700">
            Image
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPick}
            className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-bdaio-blue file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-bdaio-blue-dark"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            JPEG, PNG, or WebP, up to 2 MB. Re-encoded to WebP and capped at 1600px on the
            longest edge; nothing is cropped, so logos keep their shape.
          </p>
          {fileError?.length ? (
            <p className="mt-1.5 text-xs text-red-600">{fileError[0]}</p>
          ) : null}
        </div>
      </div>

      <Field
        label="Name"
        name="title"
        errors={state?.errors?.title}
        hint="Used to find the image later. Defaults to the filename."
      />
      <Field
        label="Alt text"
        name="alt"
        errors={state?.errors?.alt}
        hint="Describes the image to a screen reader. Leave empty if it is purely decorative."
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
        {state?.success && (
          <p role="status" className="text-sm font-medium text-emerald-700">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
