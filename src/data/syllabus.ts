export type SyllabusSection = {
  title?: string;
  items: { question: string; answer: string }[];
};

export const syllabusSections: SyllabusSection[] = [
  {
    title: "Network and Deep Learning",
    items: [
      {
        question: "Programming Fundamentals",
        answer:
          "Variables, data types, control flow, functions, loops, basic data structures (lists, dictionaries), file I/O, and Python programming essentials required for AI problem solving.",
      },
      {
        question: "Supervised Learning",
        answer:
          "Regression, classification, linear models, decision trees, ensemble methods, model training, validation, and evaluation metrics.",
      },
      {
        question: "Unsupervised Learning",
        answer:
          "Clustering (K-means, hierarchical), dimensionality reduction (PCA), anomaly detection, and unsupervised feature learning.",
      },
      {
        question: "Data Science Fundamentals",
        answer:
          "Data collection, cleaning, preprocessing, exploratory data analysis, feature engineering, and working with tabular and structured data.",
      },
      {
        question: "Natural Language Processing (NLP)",
        answer:
          "Text preprocessing, tokenization, embeddings, sequence models, sentiment analysis, and language model basics.",
      },
      {
        question: "Neural Networks",
        answer:
          "Perceptrons, activation functions, backpropagation, loss functions, optimization, and building basic neural network architectures.",
      },
      {
        question: "Deep Learning",
        answer:
          "Convolutional neural networks, recurrent neural networks, transfer learning, regularization, and modern deep learning frameworks.",
      },
      {
        question: "Computer Vision",
        answer:
          "Image processing, convolution operations, object detection basics, image classification, and visual feature extraction.",
      },
      {
        question: "Evaluation of ML Models",
        answer:
          "Cross-validation, precision/recall, F1 score, ROC-AUC, confusion matrices, overfitting/underfitting, and model selection.",
      },
      {
        question: "IOAI International Round Syllabus",
        answer:
          "Topics aligned with the International Olympiad in Artificial Intelligence (IOAI) including theoretical AI knowledge and practical Python-based problem solving.",
      },
    ],
  },
  {
    title: "Competition",
    items: [
      {
        question: "Basic AI Knowledge",
        answer:
          "Fundamental concepts of artificial intelligence, machine learning theory, probability, statistics, and algorithmic thinking.",
      },
      {
        question: "Python Programming",
        answer:
          "Python syntax, NumPy, Pandas, Matplotlib, Scikit-learn, and writing efficient code for ML competitions on Kaggle.",
      },
      {
        question: "Books",
        answer:
          "Recommended reading includes introductory ML texts, online resources (d2l.ai, mlcourse.ai), and competition-specific documentation.",
      },
    ],
  },
];
