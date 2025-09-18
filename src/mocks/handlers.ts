// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { db, type Job } from '../lib/db' // Make sure to import Job type
import { faker } from '@faker-js/faker';
import slugify from 'slugify';

// Utility to simulate network delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => faker.number.int({ min: 200, max: 1200 });

// Utility to simulate write errors
const maybeError = () => {
    if (Math.random() < 0.08) { // 8% chance of error
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
    }
    return null;
}

export const handlers = [
  // --- JOBS ---
  http.get('/jobs', async ({ request }) => {
    await sleep(randomDelay());
    const url = new URL(request.url);
    const q = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status');

    const jobs = await db.jobs.orderBy('order').toArray();
    let filteredJobs = jobs.filter(job => job.title.toLowerCase().includes(q.toLowerCase()));
    if (status) {
        filteredJobs = filteredJobs.filter(job => job.status === status);
    }

    return HttpResponse.json(filteredJobs);
  }),

  http.post('/jobs', async ({ request }) => {
    await sleep(randomDelay());
    const error = maybeError();
    if (error) return error;

    const newJobData = await request.json() as any;
    const maxOrder = await db.jobs.toCollection().last() || { order: -1 };
    const job = {
        id: faker.string.uuid(),
        slug: slugify(newJobData.title, { lower: true, strict: true }),
        status: 'active',
        order: maxOrder.order + 1,
        ...newJobData
    };
    await db.jobs.add(job);
    return HttpResponse.json(job, { status: 201 });
  }),

  http.patch('/jobs/:id', async ({ request, params }) => {
    await sleep(randomDelay());
    const error = maybeError();
    if (error) return error;

    const { id } = params;
    const updatedData = (await request.json()) as Partial<Job>;

    const updatedCount = await db.jobs.update(id as string, updatedData);

    if (updatedCount === 0) {
      return HttpResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updatedJob = await db.jobs.get(id as string);
    return HttpResponse.json(updatedJob);
  }),

  http.patch('/jobs/:id/reorder', async ({ request }) => {
    await sleep(randomDelay());
    const error = maybeError();
    if (error) return error;

    const { fromOrder, toOrder } = (await request.json()) as { fromOrder: number, toOrder: number };
    const jobs = await db.jobs.orderBy('order').toArray();
    const [movedItem] = jobs.splice(fromOrder, 1);
    jobs.splice(toOrder, 0, movedItem);

    // Update the 'order' property for all jobs in the database
    await db.transaction('rw', db.jobs, async () => {
      for (let i = 0; i < jobs.length; i++) {
        await db.jobs.update(jobs[i].id, { order: i });
      }
    });

    return HttpResponse.json({ success: true });
  }),

  // --- CANDIDATES ---
  http.get('/candidates', async ({ request }) => {
      await sleep(randomDelay());
      const url = new URL(request.url);
      const q = url.searchParams.get('search') || '';
      const stage = url.searchParams.get('stage');

      let candidates = await db.candidates.toArray();
      if (q) {
          candidates = candidates.filter(c =>
            c.name.toLowerCase().includes(q.toLowerCase()) ||
            c.email.toLowerCase().includes(q.toLowerCase())
          );
      }
      if (stage) {
        candidates = candidates.filter(c => c.stage === stage);
      }

      return HttpResponse.json(candidates.slice(0, 200)); // Limit for performance
  }),

  http.patch('/candidates/:id', async ({ request, params }) => {
    await sleep(randomDelay());
    const error = maybeError();
    if (error) return error;

    const { id } = params;
    const { stage } = (await request.json()) as { stage: string };

    const updatedCount = await db.candidates.update(id as string, { stage });

    if (updatedCount === 0) {
      return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const updatedCandidate = await db.candidates.get(id as string);
    return HttpResponse.json(updatedCandidate);
  }),

  http.get('/candidates/:id', async ({ params }) => {
    await sleep(randomDelay());
    const { id } = params;
    const candidate = await db.candidates.get(id as string);

    if (!candidate) {
      return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    return HttpResponse.json(candidate);
  }),

  http.get('/candidates/:id/timeline', async () => {
    await sleep(randomDelay());
    // In a real app, this data would come from a database.
    // Here, we'll just generate some fake timeline events.
    const timelineEvents = [
      { event: 'Applied for a job', date: faker.date.past({ years: 1 }).toISOString(), stage: 'applied' },
      { event: 'Moved to Screen', date: faker.date.past({ years: 1 }).toISOString(), stage: 'screen' },
      { event: 'Advanced to Tech Interview', date: faker.date.recent().toISOString(), stage: 'tech' },
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return HttpResponse.json(timelineEvents);
  }),

  // --- ASSESSMENTS ---
  http.get('/assessments/:jobId', async ({ params }) => {
    await sleep(randomDelay());
    const { jobId } = params;
    const assessment = await db.assessments.get(jobId as string);

    // Return a default structure if none exists
    return HttpResponse.json(assessment || { jobId, questions: [] });
  }),

  http.put('/assessments/:jobId', async ({ request, params }) => {
    await sleep(randomDelay());
    const error = maybeError();
    if (error) return error;

    const { jobId } = params;
    const data = (await request.json()) as { questions: any[] };
    await db.assessments.put({ jobId: jobId as string, questions: data.questions });

    return HttpResponse.json({ success: true });
  }),

  http.post('/assessments/:jobId/submit', async ({ request }) => {
      await sleep(randomDelay());
      const error = maybeError();
      if (error) return error;

      const responses = await request.json();
      // In a real app, we'd save this to the DB. For this assignment,
      // we'll just log it to the console to confirm submission.
      console.log("Assessment Responses Received:", responses);

      return HttpResponse.json({ success: true, message: "Assessment submitted successfully." });
    }),
]