// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import { generateSeedData } from '../mocks/seed';

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

// The Assessment interface is no longer needed as we use an inline type.

export class TalentFlowDB extends Dexie {
  jobs!: Table<Job>;
  candidates!: Table<Candidate>;
  assessments!: Table<{ jobId: string, questions: any[] }>; // <-- MODIFIED TABLE

  constructor() {
    super('talentflowDB');
    this.version(2).stores({ // <-- INCREMENT VERSION TO 2
      jobs: '++id, title, status, order',
      candidates: '++id, name, email, jobId, stage',
      assessments: 'jobId', // <-- Use jobId as the primary key
    });
  }
}

export const db = new TalentFlowDB();

export async function populateDb() {
    const jobCount = await db.jobs.count();
    // Also check assessments count to handle upgrades from v1
    const assessmentCount = await db.assessments.count(); 
    if (jobCount > 0 && assessmentCount > 0) {
        console.log("Database already seeded.");
        return;
    }
    
    console.log("Seeding database...");
    const { jobs, candidates, assessments } = generateSeedData();
    
    // Clear existing data before seeding to ensure consistency on version change
    await db.jobs.clear();
    await db.candidates.clear();
    await db.assessments.clear();
    
    await db.jobs.bulkAdd(jobs);
    await db.candidates.bulkAdd(candidates);

    // Transform assessments object into an array suitable for the new schema
    const assessmentsArray = Object.entries(assessments).map(([jobId, assessmentData]) => ({
      jobId,
      questions: assessmentData.questions,
    }));
    await db.assessments.bulkAdd(assessmentsArray);
    
    console.log("Database seeded successfully.");
}