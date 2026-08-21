"use client";

import { useState } from "react";

type AccordionItem = {
  question: string;
  answer: string;
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
};

export function Accordion({ items, className = "" }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={`divide-y divide-slate-100 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="py-1">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between py-4 text-left transition-colors focus:outline-none group"
            >
              <div className="flex items-center gap-3.5 pr-4">
                <span className="shrink-0 text-xl font-bold text-bdaio-blue select-none">
                  {isOpen ? "−" : "+"}
                </span>
                <span className="text-base font-semibold text-bdaio-blue hover:text-bdaio-blue-dark transition-colors">
                  {item.question}
                </span>
              </div>
              <svg
                className={`h-4.5 w-4.5 shrink-0 text-bdaio-blue transition-transform duration-200 ${
                  isOpen ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {isOpen && (
              <div
                className="pb-5 pl-8 pr-6 text-sm leading-relaxed text-slate-655 animate-in fade-in duration-200"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
