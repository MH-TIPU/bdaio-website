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

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setLocalError(null);
      if (file.size > MAX_BYTES) {
        setLocalError("Image must be 2 MB or smaller.");
        setPreview(null);
        return;
      }
      setPreview(URL.createObjectURL(file));
    }
  }

  const fileError = localError ? [localError] : state?.errors?.file;

  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${
          isDragging
            ? "border-bdaio-blue bg-bdaio-blue/10"
            : "border-slate-300 bg-slate-50/50 hover:border-bdaio-blue hover:bg-blue-50/30"
        }`}
      >
        <input
          ref={fileInputRef}
          id="file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          className="hidden"
        />

        {preview ? (
          <div className="relative flex h-32 w-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-full w-auto object-contain" />
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bdaio-blue/10 text-bdaio-blue">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Drag & drop image here, or <span className="text-bdaio-blue underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                JPEG, PNG, or WebP up to 2 MB (capped at 1600px on longest edge)
              </p>
            </div>
          </>
        )}
      </div>

      {fileError?.length ? (
        <p className="text-xs font-semibold text-red-600">{fileError[0]}</p>
      ) : null}

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
