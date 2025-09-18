// src/mocks/seed.ts
import { faker } from '@faker-js/faker';
import slugify from 'slugify';

// --- JOB DATA ---
const createRandomJob = (order: number) => {
  const title = faker.person.jobTitle();
  return {
    id: faker.string.uuid(),
    title,
    slug: slugify(title, { lower: true, strict: true }),
    status: faker.helpers.arrayElement<'active' | 'archived'>(['active', 'archived']),
    tags: faker.helpers.arrayElements(['Full-time', 'Remote', 'Contract', 'Engineering'], { min: 1, max: 3 }),
    order,
  };
};

// --- CANDIDATE DATA ---
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

// --- ASSESSMENT DATA ---
const createRandomQuestion = () => {
    const questionType = faker.helpers.arrayElement(['single-choice', 'multi-choice', 'short-text', 'long-text']);
    const question = {
        id: faker.string.uuid(),
        type: questionType,
        question: faker.lorem.sentence({ min: 5, max: 10 }).replace(/\.$/, '?'),
        options: [] as string[],
    };
    if (questionType === 'single-choice' || questionType === 'multi-choice') {
        question.options = Array.from({ length: 4 }, () => faker.lorem.words(2));
    }
    return question;
};

const createRandomAssessment = () => ({
    id: faker.string.uuid(),
    questions: Array.from({ length: 10 }, createRandomQuestion)
});

// --- MAIN SEED FUNCTION ---
export const generateSeedData = () => {
  const jobs = Array.from({ length: 25 }, (_, i) => createRandomJob(i));
  const jobIds = jobs.map(j => j.id);
  const candidates = Array.from({ length: 1000 }, () => createRandomCandidate(jobIds));

  // Assign an assessment to the first 3 jobs for simplicity
  const assessments: Record<string, ReturnType<typeof createRandomAssessment>> = {};
  jobIds.slice(0, 3).forEach(jobId => {
    assessments[jobId] = createRandomAssessment();
  });

  return { jobs, candidates, assessments };
};