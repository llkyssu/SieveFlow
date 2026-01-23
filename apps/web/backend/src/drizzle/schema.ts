import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  recruiterId: integer('recruiter_id')
    .references(() => users.id)
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  requirements: jsonb('requirements').notNull(),
  hiddenRequirements: jsonb('hidden_requirements'),
  vacancies: integer('vacancies').default(1),
  status: varchar('status', { length: 50 }).default('open'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  linkedinUrl: text('linkedin_url'),
  defaultResumeUrl: text('default_resume_url'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id')
    .references(() => jobs.id)
    .notNull(),
  candidateId: integer('candidate_id')
    .references(() => candidates.id)
    .notNull(),
  resumeUrl: text('resume_url'),
  coverLetterUrl: text('cover_letter_url'),
  resumeRawText: text('resume_raw_text'),
  coverLetterRawText: text('cover_letter_raw_text'),
  aiScore: integer('ai_score'),
  aiAnalysisSummary: text('ai_analysis_summary'),
  status: varchar('status', { length: 50 }).default('pending'), // pending | processing | reviewed | interviewed | offered | rejected
  decision: varchar('decision', { length: 50 }), // ADVANCE | HOLD | REJECT
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const interviews = pgTable('interviews', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id')
    .references(() => applications.id)
    .notNull(),
  scheduledAt: timestamp('scheduled_at'),
  meetingLink: text('meeting_link'),
  status: varchar('status', { length: 50 }).default('scheduled'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  recruiter: one(users, { fields: [jobs.recruiterId], references: [users.id] }),
  applications: many(applications),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(
  applications,
  ({ one, many }) => ({
    job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
    candidate: one(candidates, {
      fields: [applications.candidateId],
      references: [candidates.id],
    }),
    interviews: many(interviews),
  }),
);

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}));