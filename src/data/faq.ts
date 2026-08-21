export type FaqSection = {
  title: string;
  items: { question: string; answer: string }[];
};

export const faqSections: FaqSection[] = [
  {
    title: "About",
    items: [
      {
        question: "What is BdAIO (Bangladesh Artificial Intelligence Olympiad)?",
        answer:
          "The Bangladesh Artificial Intelligence Olympiad (BdAIO) is the premier national AI competition for school and college students in Bangladesh. It tests students in artificial intelligence, machine learning, and programming skills, serving as the official pathway to represent Bangladesh at international AI olympiads.",
      },
      {
        question: "How many stages are involved in the competition?",
        answer:
          "The competition generally consists of three stages: (1) Regional/Online Selection Round, (2) National Round, and (3) Selection Camp & Grooming. Top performers earn a spot on the national team for international competitions.",
      },
      {
        question: "Do winners get to participate internationally?",
        answer:
          "Yes! The top performers of BdAIO represent Bangladesh at the International Artificial Intelligence Olympiad (IAIO) and International AI Olympiad (IOAI).",
      },
      {
        question: "What prizes do winners receive?",
        answer:
          "Winners receive medals, certificates, and official selection for international representation. Selection camp participants also receive advanced mentorship and training.",
      },
      {
        question: "How often is BdAIO held?",
        answer:
          "BdAIO is organized annually. Regional rounds typically take place in the first half of the year, followed by the National Finals.",
      },
      {
        question: "Who covers the cost of international participation?",
        answer:
          "Costs for representing the nation at international levels are sponsored through organizing bodies, corporate partners, and government support.",
      },
    ],
  },
  {
    title: "Eligibility",
    items: [
      {
        question: "Who is eligible to participate in BdAIO?",
        answer:
          "Students up to 12th grade (or equivalent, including polytechnic students up to 4th semester) can compete in BdAIO.",
      },
      {
        question: "Can English Medium and English Version students participate?",
        answer:
          "Yes, students from National Curriculum (Bangla & English versions), English Medium, and Polytechnic backgrounds are all eligible.",
      },
      {
        question: "Can university students participate?",
        answer:
          "No, BdAIO is strictly for pre-university (school and college level) students.",
      },
      {
        question: "How do I register?",
        answer:
          "Visit www.bdaio.org, create an account, and complete your registration under the events section. Detailed instructions are available on the Participation Guideline page.",
      },
      {
        question: "Is a passport required to enter?",
        answer:
          "A passport is not required for regional or national rounds. However, a valid passport is required if selected to represent Bangladesh internationally.",
      },
    ],
  },
  {
    title: "Examination & Preparation",
    items: [
      {
        question: "What topics are covered in the competition?",
        answer:
          "Topics include Machine Learning concepts, Neural Networks, Deep Learning, Computer Vision, Natural Language Processing (NLP), Data Science, and Python programming.",
      },
      {
        question: "Can I participate if I don't have prior AI experience?",
        answer:
          "Yes! Study materials, resources, and guidelines are available on our website. Basic Python knowledge is a great starting point.",
      },
      {
        question: "In which language are exam questions presented?",
        answer:
          "All official competition problems, coding problems, and resources are provided in English.",
      },
      {
        question: "Is participation individual or team-based?",
        answer:
          "Participation is individual. Team entries are not applicable for standard rounds.",
      },
      {
        question: "Where can I find preparation materials?",
        answer:
          "Recommended resources, course links, and reading materials can be found on our Syllabus and Resources pages.",
      },
    ],
  },
];
