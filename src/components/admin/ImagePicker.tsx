"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadMedia } from "@/server/admin/media";

export type MediaOption = {
  id: string;
  title: string;
  url: string;
};

type ImagePickerProps = {
  label: string;
  name: string;
  defaultValue?: string;
  assets: MediaOption[];
  errors?: string[];
  hint?: string;
};

export function ImagePicker({
  label,
  name,
  defaultValue = "",
  assets: initialAssets,
  errors,
  hint,
}: ImagePickerProps) {
  const [assets, setAssets] = useState<MediaOption[]>(initialAssets);
  const [selectedId, setSelectedId] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [search, setSearch] = useState("");

  // Quick upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAsset = assets.find((a) => a.id === selectedId);
  const filteredAssets = assets.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()),
  );

  function handleFileSelected(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image size must be 2 MB or smaller.");
      return;
    }
    setUploadError(null);
    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
    setUploadPreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelected(file);
    }
  }

  async function handleQuickUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle || uploadFile.name);

    try {
      const res = await uploadMedia(undefined, formData);
      if (res?.errors?.file) {
        setUploadError(res.errors.file[0]);
      } else if (res?.errors?.title) {
        setUploadError(res.errors.title[0]);
      } else {
        // Success: refresh list & close
        window.location.reload();
      }
    } catch {
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-900">{label}</label>
      <input type="hidden" name={name} value={selectedId} />

      {/* Selected Image Card / Drag & Drop Trigger */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs">
        {selectedAsset ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
              <Image
                src={selectedAsset.url}
                alt={selectedAsset.title}
                width={144}
                height={96}
                className="max-h-full w-auto object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 min-w-[200px]">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected Cover</p>
                <p className="text-sm font-bold text-slate-900 line-clamp-1">{selectedAsset.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId("")}
                  className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setOpen(true)}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-6 py-6 text-center transition hover:border-bdaio-blue hover:bg-blue-50/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bdaio-blue/10 text-bdaio-blue">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Click to select cover image or upload
              </p>
              <p className="text-xs text-slate-500">
                Pick from Media Library or drop a file to upload directly
              </p>
            </div>
          </div>
        )}
      </div>

      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {errors && errors.length > 0 && <p className="text-xs font-medium text-red-600">{errors[0]}</p>}

      {/* Visual Modal Picker */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{label} Picker</h3>
                <p className="text-xs text-slate-500">Choose an existing image or upload a new one.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setTab("library")}
                className={`border-b-2 px-4 py-2 text-sm font-bold transition ${
                  tab === "library"
                    ? "border-bdaio-blue text-bdaio-blue"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                🖼️ Media Library ({assets.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("upload")}
                className={`border-b-2 px-4 py-2 text-sm font-bold transition ${
                  tab === "upload"
                    ? "border-bdaio-blue text-bdaio-blue"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📤 Upload New Image
              </button>
            </div>

            {/* Tab 1: Media Library Grid */}
            {tab === "library" && (
              <div className="flex flex-1 flex-col overflow-hidden pt-4">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search image by name…"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
                />

                <div className="mt-4 flex-1 overflow-y-auto pr-1">
                  {filteredAssets.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center">
                      <p className="text-sm font-semibold text-slate-600">No images found</p>
                      <button
                        type="button"
                        onClick={() => setTab("upload")}
                        className="mt-2 text-xs font-bold text-bdaio-blue hover:underline"
                      >
                        Upload a new image now →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {filteredAssets.map((asset) => {
                        const isSelected = asset.id === selectedId;
                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(asset.id);
                              setOpen(false);
                            }}
                            className={`group relative flex flex-col overflow-hidden rounded-xl border p-2 text-left transition ${
                              isSelected
                                ? "border-bdaio-blue bg-bdaio-blue/5 ring-2 ring-bdaio-blue"
                                : "border-slate-200 bg-white hover:border-bdaio-blue hover:shadow-md"
                            }`}
                          >
                            <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                              <Image
                                src={asset.url}
                                alt={asset.title}
                                width={160}
                                height={112}
                                className="max-h-full w-auto object-contain transition group-hover:scale-105"
                              />
                              {isSelected && (
                                <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-bdaio-blue text-xs font-bold text-white shadow-xs">
                                  ✓
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-xs font-semibold text-slate-800 line-clamp-1">
                              {asset.title}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Upload New Image Dropzone */}
            {tab === "upload" && (
              <form onSubmit={handleQuickUpload} className="mt-4 space-y-4 flex-1 overflow-y-auto">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition ${
                    isDragging
                      ? "border-bdaio-blue bg-bdaio-blue/10"
                      : "border-slate-300 bg-slate-50/50 hover:border-bdaio-blue hover:bg-blue-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(file);
                    }}
                  />

                  {uploadPreview ? (
                    <div className="relative flex h-32 w-48 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={uploadPreview} alt="" className="max-h-full w-auto object-contain" />
                    </div>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bdaio-blue/10 text-bdaio-blue">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Drag & drop image here, or <span className="text-bdaio-blue underline">browse</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Supports PNG, JPEG, WebP up to 2 MB
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {uploadFile && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Image Name</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      required
                      placeholder="e.g. Python AI Banner"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
                    />
                  </div>
                )}

                {uploadError && <p className="text-xs font-semibold text-red-600">{uploadError}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="rounded-lg bg-bdaio-blue px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-bdaio-blue-dark transition shadow-2xs"
                  >
                    {isUploading ? "Uploading…" : "Upload & Select"}
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
