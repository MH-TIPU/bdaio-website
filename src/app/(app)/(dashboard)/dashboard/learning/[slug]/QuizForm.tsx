"use client";

import { useActionState } from "react";
import { submitQuiz } from "@/server/learn/actions";

export type QuizView = {
  id: string;
  title: string;
  passMark: number;
  questions: {
    id: string;
    prompt: string;
    options: { id: string; text: string }[];
  }[];
};

/**
 * The quiz at the end of a lesson.
 *
 * Radio inputs named after the question, so the browser enforces one answer per
 * question and the keyboard behaves the way people expect from a radio group.
 * Grading happens on the server — the options arrive here without any marker of
 * which is right, so there is nothing in the page to read off.
 */
export function QuizForm({
  slug,
  quiz,
  alreadyPassed,
}: {
  slug: string;
  quiz: QuizView;
  alreadyPassed: boolean;
}) {
  const [state, action, pending] = useActionState(submitQuiz, undefined);

  if (quiz.questions.length === 0) return null;

  const passed = state?.passed ?? alreadyPassed;

  return (
    <form action={action} className="mt-8 rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="quizId" value={quiz.id} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900">{quiz.title}</h3>
        <p className="text-xs text-slate-500">Pass mark {quiz.passMark}%</p>
      </div>

      {passed && !state && (
        <p role="status" className="mt-2 text-sm font-medium text-emerald-700">
          You have already passed this quiz. You can take it again if you like.
        </p>
      )}

      <ol className="mt-4 space-y-5">
        {quiz.questions.map((question, index) => (
          <li key={question.id}>
            <fieldset>
              <legend className="text-sm font-medium text-slate-800">
                {index + 1}. {question.prompt}
              </legend>
              <div className="mt-2 space-y-1.5">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-white"
                  >
                    <input
                      type="radio"
                      name={`q:${question.id}`}
                      value={option.id}
                      className="mt-0.5 h-4 w-4 border-slate-300"
                    />
                    {option.text}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-bdaio-blue px-4 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
        >
          {pending ? "Checking…" : passed ? "Try again" : "Check my answers"}
        </button>

        {state?.message && (
          <p
            role="status"
            className={`text-sm font-medium ${
              state.passed ? "text-emerald-700" : "text-amber-800"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
