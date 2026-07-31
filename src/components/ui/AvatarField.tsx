"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type AvatarFieldProps = {
  currentUrl: string | null;
  fullName: string;
  errors?: string[];
};

const MAX_BYTES = 1024 * 1024; // keep in step with saveAvatar()

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function AvatarField({ currentUrl, fullName, errors }: AvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  // Release the object URL when it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const shown = preview ?? (removed ? null : currentUrl);
  const messages = localError ? [localError] : errors;

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setLocalError(null);

    if (!file) {
      setPreview(null);
      return;
    }

    // Friendly client-side check; the server enforces this regardless.
    if (file.size > MAX_BYTES) {
      setLocalError("Image must be 1 MB or smaller.");
      event.target.value = "";
      setPreview(null);
      return;
    }

    setRemoved(false);
    setPreview(URL.createObjectURL(file));
  }

  function onRemove() {
    setPreview(null);
    setRemoved(true);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <span className="block text-sm font-medium text-slate-700">
        Profile photo
      </span>

      <div className="mt-2 flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          {shown ? (
            preview ? (
              // A blob: URL from the file picker cannot go through next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={shown}
                alt={`${fullName}'s profile photo`}
                fill
                sizes="80px"
                className="object-cover"
              />
            )
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400">
              {initials(fullName)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <input
            ref={inputRef}
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPick}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-bdaio-blue file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-bdaio-blue-dark"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            JPEG, PNG, or WebP. Up to 1 MB. Cropped to a square.
          </p>
          {(currentUrl || preview) && !removed && (
            <button
              type="button"
              onClick={onRemove}
              className="mt-1 text-xs font-medium text-red-600 hover:underline"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      {removed && <input type="hidden" name="removePhoto" value="1" />}

      {messages?.length ? (
        <p className="mt-1.5 text-xs text-red-600">{messages[0]}</p>
      ) : null}
    </div>
  );
}
