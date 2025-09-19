import { faker } from '@faker-js/faker';
import slugify from 'slugify';

// --- Question Banks ---
const techQuestions = [
  "What is the difference between SQL and NoSQL databases?",
  "Explain the concept of RESTful APIs.",
];
const marketingQuestions = [
  "Describe a successful marketing campaign you have worked on.",
  "How do you measure the ROI of a marketing campaign?",
];
const generalQuestions = [
  "What are your long-term career goals?",
  "Describe a challenging situation you faced at work and how you handled it.",
];

// --- Helper Functions ---
const createRandomJob = (order: number) => {
  const title = faker.person.jobTitle();
  return {
    id: faker.string.uuid(),
    title,
    slug: slugify(title, { lower: true, strict: true }),
    status: faker.helpers.arrayElement<'active' | 'archived'>(['active', 'archived']),
    tags: faker.helpers.arrayElements(['Full-time', 'Remote', 'Contract'], { min: 1, max: 2 }),
    order,
  };
};
const CANDIDATE_STAGES = ["applied", "screen", "tech", "offer", "hired", "rejected"] as const;
const createRandomCandidate = (jobIds: string[]) => {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    jobId: faker.helpers.arrayElement(jobIds),
    stage: faker.helpers.arrayElement(CANDIDATE_STAGES),
  };
};

const createRandomQuestion = (jobTitle: string) => {
    let questionPool = generalQuestions;
    const lowerCaseTitle = jobTitle.toLowerCase();
    if (lowerCaseTitle.includes('engineer') || lowerCaseTitle.includes('developer')) {
        questionPool = techQuestions;
    } else if (lowerCaseTitle.includes('marketing')) {
        questionPool = marketingQuestions;
    }

    const questionType = faker.helpers.arrayElement(['single-choice', 'multi-choice']);
    const options = Array.from({ length: 4 }, () => faker.lorem.words(2));

    const question = {
        id: faker.number.int(),
        type: questionType,
        question: faker.helpers.arrayElement(questionPool),
        options,
        answerKey: undefined,
        validation: { required: faker.datatype.boolean() }
    };
    return question;
};

// --- Main Seed Function ---
export const generateSeedData = () => {
  const jobs = Array.from({ length: 25 }, (_, i) => createRandomJob(i));
  const jobIds = jobs.map(j => j.id);
  const candidates = Array.from({ length: 1000 }, () => createRandomCandidate(jobIds));
  const assessments: Record<string, { questions: any[] }> = {};
  
  jobs.slice(0, 5).forEach(job => {
      assessments[job.id] = {
          questions: Array.from({ length: faker.number.int({ min: 3, max: 5 }) }, () => createRandomQuestion(job.title))
      };
  });

  return { jobs, candidates, assessments };
};