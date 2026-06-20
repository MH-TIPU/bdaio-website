import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-center text-3xl font-bold text-[#1e5a8a] mb-12">
          About BdAIO
        </h1>

        <div className="space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base text-justify">
          <p>
            The <strong>Bangladesh Artificial Intelligence Olympiad (BdAIO)</strong> is a
            national-level competition designed to inspire, educate, and engage young minds in
            the rapidly evolving field of Artificial Intelligence. It provides a platform for
            students across Bangladesh to explore AI, develop problem-solving skills, and prepare
            for participation in international AI Olympiads. Through BdAIO, talented students
            are identified and trained to represent Bangladesh on the global stage.
          </p>
          <p>
            The Olympiad is open to students studying up to <strong>Grade 12 or equivalent levels</strong>
            , including students up to the <strong>4th semester of Polytechnic institutes</strong> across
            Bangladesh. Participants demonstrate their programming proficiency in{" "}
            <strong>Python</strong> along with their understanding of core AI concepts such as
            machine learning, neural networks, natural language processing, and computer vision.
          </p>
          <p>
            BdAIO is conducted in <strong>multiple phases</strong>, beginning with a preliminary
            selection round and culminating in the national round. At each stage, participants
            refine their analytical thinking, strengthen their conceptual knowledge, and gain
            practical exposure to AI-related problem solving. The top-performing students are
            selected for advanced training and international representation.
          </p>
          <p>
            Bangladesh has already achieved notable success in global AI competitions. At the{" "}
            <strong>first International Artificial Intelligence Olympiad (IAIO) held in Riyadh, Saudi Arabia in 2024</strong>
            , the Bangladesh team won <strong>2 Silver Medals and 2 Bronze Medals</strong>. The silver
            medals were won by <strong>Misbah Uddin Inan (Notre Dame College)</strong> and{" "}
            <strong>Arefin Anwar (Saint Joseph College)</strong>, while the bronze medals were
            achieved by <strong>Abrar Shahid (Notre Dame College)</strong> and{" "}
            <strong>Rafid Ahmed (Academia, Lalmatia)</strong>. The team was led by{" "}
            <strong>Dr. B. M. Mainul Hossain</strong>, Director at the Institute of Information
            Technology, University of Dhaka.
          </p>
          <p>
            The IAIO competition included both <strong>scientific (theoretical)</strong> and{" "}
            <strong>practical (coding and model development)</strong> rounds. Participants worked
            on real AI problems such as feature engineering and model development using{" "}
            <strong>Python</strong>, covering areas like computer vision, natural language
            processing, neural networks, and machine learning.
          </p>
          <p>
            Bangladeshi students have also participated in the{" "}
            <strong>International Olympiad on Artificial Intelligence (IOAI)</strong>. In the{" "}
            <strong>2025 IOAI held in China</strong>, the Bangladesh team achieved{" "}
            <strong>2 Bronze Medals and 2 Honorable Mentions</strong>, further demonstrating the
            country&apos;s growing strength in AI education and talent development.
          </p>
          <p>
            Starting from <strong>2025</strong>, BdAIO has also introduced an <strong>AI quiz competition</strong> to encourage broader
            participation and spark curiosity about Artificial Intelligence among students. This initiative helps students build foundational knowledge and prepares them for future participation in national and international AI competitions.
          </p>
          <p>
            As a <strong>regular annual event</strong>, BdAIO continues to nurture a new generation of AI enthusiasts, researchers, and innovators who will contribute to Bangladesh&apos;s technological progress and global presence in Artificial Intelligence.
          </p>
        </div>
      </div>
    </section>
  );
}
