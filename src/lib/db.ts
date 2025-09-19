import Dexie, { type Table } from 'dexie';
import { generateSeedData } from '../mocks/seed';

export interface User {
  id?: number;
  email: string;
  passwordHash: string; // In a real app, never store plain text passwords
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  status: 'active' | 'archived';
  tags: string[];
  order: number;
}
export interface Candidate {
  id: string;
  name: string;
  email: string;
  jobId: string;
  stage: "applied" | "screen" | "tech" | "offer" | "hired" | "rejected";
}

export class TalentFlowDB extends Dexie {
  jobs!: Table<Job>;
  candidates!: Table<Candidate>;
  assessments!: Table<{ jobId: string, questions: any[] }>;
  users!: Table<User>; // <-- ADDED

  constructor() {
    super('talentflowDB');
    this.version(3).stores({ // <-- INCREMENTED VERSION TO 3
      jobs: '++id, title, status, order',
      candidates: '++id, name, email, jobId, stage',
      assessments: 'jobId',
      users: '++id, &email' // <-- ADDED (&email makes it unique)
    });
  }
}

export const db = new TalentFlowDB();

export async function populateDb() {
  const jobCount = await db.jobs.count();
  if (jobCount > 0) {
    console.log("Database already seeded.");
    return;
  }
  
  console.log("Seeding database...");
  const { jobs, candidates, assessments } = generateSeedData();
  
  await db.transaction('rw', db.jobs, db.candidates, db.assessments, async () => {
    await db.jobs.bulkAdd(jobs);
    await db.candidates.bulkAdd(candidates);
    
    for (const jobId in assessments) {
      if (Object.prototype.hasOwnProperty.call(assessments, jobId)) {
        await db.assessments.put({ jobId, questions: assessments[jobId].questions });
      }
    }
  });
  
  console.log("Database seeded successfully.");
}
