"use client";

import { useActionState, useState } from "react";
import { saveQuiz } from "@/server/admin/courses";

export type QuizDraft = {
  title: string;
  passMark: number;
  questions: { prompt: string; options: string[]; correctIndex: number }[];
};

const EMPTY_QUESTION = { prompt: "", options: ["", ""], correctIndex: 0 };

/**
 * Quiz authoring for one lesson.
 *
 * The whole set posts together and replaces what was there — see `saveQuiz`.
 * That is why this is a client component holding the draft in state: adding a
 * question should not cost a round trip, and half-written questions should not
 * be saved one at a time.
 */
export function QuizEditor({
  lessonId,
  initial,
}: {
  lessonId: string;
  initial: QuizDraft | null;
}) {
  const [state, action, pending] = useActionState(saveQuiz, undefined);
  const [questions, setQuestions] = useState(
    initial?.questions.length ? initial.questions : [EMPTY_QUESTION],
  );

  function update(index: number, patch: Partial<(typeof questions)[number]>) {
    setQuestions((current) =>
      current.map((question, i) => (i === index ? { ...question, ...patch } : question)),
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="lessonId" value={lessonId} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label
            htmlFor={`quiz-title-${lessonId}`}
            className="block text-sm font-medium text-slate-700"
          >
            Quiz title
          </label>
          <input
            id={`quiz-title-${lessonId}`}
            name="title"
            defaultValue={initial?.title ?? "Check your understanding"}
            className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          />
        </div>
        <div className="w-28">
          <label
            htmlFor={`quiz-pass-${lessonId}`}
            className="block text-sm font-medium text-slate-700"
          >
            Pass %
          </label>
          <input
            id={`quiz-pass-${lessonId}`}
            name="passMark"
            type="number"
            min={1}
            max={100}
            defaultValue={initial?.passMark ?? 60}
            className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <ol className="space-y-4">
        {questions.map((question, index) => (
          <li key={index} className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <label className="block text-sm font-medium text-slate-700">
              Question {index + 1}
              <input
                name={`q:${index}:prompt`}
                value={question.prompt}
                onChange={(event) => update(index, { prompt: event.target.value })}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <fieldset className="mt-3">
              <legend className="text-xs font-medium text-slate-500">
                Options — select the correct one
              </legend>
              <div className="mt-2 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q:${index}:correct`}
                      value={String(optionIndex)}
                      checked={question.correctIndex === optionIndex}
                      onChange={() => update(index, { correctIndex: optionIndex })}
                      aria-label={`Option ${optionIndex + 1} is correct`}
                      className="h-4 w-4 border-slate-300"
                    />
                    <input
                      name={`q:${index}:option:${optionIndex}`}
                      value={option}
                      onChange={(event) =>
                        update(index, {
                          options: question.options.map((o, i) =>
                            i === optionIndex ? event.target.value : o,
                          ),
                        })
                      }
                      placeholder={`Option ${optionIndex + 1}`}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => update(index, { options: [...question.options, ""] })}
                className="mt-2 text-xs font-semibold text-bdaio-blue hover:underline"
              >
                + Add option
              </button>
            </fieldset>

            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => setQuestions((c) => c.filter((_, i) => i !== index))}
                className="mt-3 text-xs font-semibold text-red-600 hover:underline"
              >
                Remove question
              </button>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setQuestions((c) => [...c, { ...EMPTY_QUESTION }])}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 hover:bg-white"
        >
          + Add question
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-bdaio-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save quiz"}
        </button>
        {state?.success && (
          <p role="status" className="text-xs font-medium text-emerald-700">
            {state.message}
          </p>
        )}
        {state?.errors?.form && (
          <p role="alert" className="text-xs text-red-600">
            {state.errors.form[0]}
          </p>
        )}
        {state?.errors?.passMark && (
          <p role="alert" className="text-xs text-red-600">
            {state.errors.passMark[0]}
          </p>
        )}
      </div>
    </form>
  );
}
