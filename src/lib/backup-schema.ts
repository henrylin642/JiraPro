import { z } from 'zod';

// Helper for dates: coerce string/date/number to Date
// If the input is null or undefined, and the field is optional in Prisma, we use .nullable().optional()
const dateSchema = z.coerce.date();
const nullableDateSchema = z.coerce.date().nullable().optional();

// Helper for Decimals: string or number -> string (Prisma usually takes string for Decimal to avoid precision loss, or number)
// However, in createMany, it accepts string or number.
// Zod transform to string?
// backupSystem stringifies them.
// restoreSystem passes them to createMany.
// Let's accept both string and number, and pass as is (union).
const decimalSchema = z.union([z.string(), z.number()]);

// --- Schemas for each model ---

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(),
  name: z.string(),
  role: z.string().optional(), // Has default in Prisma
  avatarUrl: z.string().nullable().optional(),
  createdAt: dateSchema.optional(), // Has default
  updatedAt: dateSchema.optional(), // Has default
}).passthrough();

const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
}).passthrough();

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
}).passthrough();

const ResourceProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().nullable().optional(),
  skills: z.string().nullable().optional(),
  costRate: decimalSchema.optional(),
  billableRate: decimalSchema.optional(),
  monthlySalary: decimalSchema.optional(),
  capacityHours: z.number().int().optional(),
}).passthrough();

const ContactSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  name: z.string(),
  title: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  linkedIn: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
}).passthrough();

const InteractionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  type: z.string(),
  date: dateSchema.optional(),
  notes: z.string().nullable().optional(),
  opportunityId: z.string().nullable().optional(),
  userId: z.string(),
  createdAt: dateSchema.optional(),
}).passthrough();

const FeatureSchema = z.object({
  id: z.string(),
  productId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string(),
  riceReach: z.number().int().optional(),
  riceImpact: decimalSchema.optional(),
  riceConfidence: z.number().int().optional(),
  riceEffort: decimalSchema.optional(),
  riceScore: decimalSchema.optional(),
  opportunities: z.array(z.object({ id: z.string() })).optional(),
}).passthrough();

const RoadmapItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  title: z.string(),
  startDate: dateSchema,
  endDate: dateSchema,
  version: z.string().nullable().optional(),
}).passthrough();

const OpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  accountId: z.string(),
  stage: z.string().optional(),
  probability: z.number().int().optional(),
  estimatedValue: decimalSchema.optional(),
  expectedCloseDate: nullableDateSchema,
  probabilityOverrideReason: z.string().nullable().optional(),
  checklist: z.string().nullable().optional(),
  lossReason: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  convertedProjectId: z.string().nullable().optional(),
  serviceAreaId: z.string().nullable().optional(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
  stageUpdatedAt: dateSchema.optional(),
  features: z.array(z.object({ id: z.string() })).optional(),
}).passthrough();

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  accountId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  startDate: nullableDateSchema,
  endDate: nullableDateSchema,
  budget: decimalSchema.optional(),
  currency: z.string().optional(),
  serviceAreaId: z.string().nullable().optional(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
}).passthrough();

const MilestoneSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  dueDate: nullableDateSchema,
  amount: decimalSchema.optional(),
  isPaid: z.boolean().optional(),
}).passthrough();

const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string().nullable().optional(),
  opportunityId: z.string().nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  startDate: nullableDateSchema,
  dueDate: nullableDateSchema,
  estimatedHours: z.number().nullable().optional(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
  parentId: z.string().nullable().optional(),
  parent: z.unknown().optional(),
  subtasks: z.unknown().optional(),
}).passthrough();

const AllocationSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
  projectId: z.string().nullable().optional(),
  opportunityId: z.string().nullable().optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  percentage: z.number().int().optional(),
  type: z.string(),
}).passthrough();

const IdeaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  creatorId: z.string(),
  featureId: z.string().nullable().optional(),
  votes: z.number().int().optional(),
  createdAt: dateSchema.optional(),
}).passthrough();

const TimesheetEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  taskId: z.string().nullable().optional(),
  date: dateSchema,
  hours: decimalSchema,
  description: z.string().nullable().optional(),
  costRate: decimalSchema.optional(),
  billableRate: decimalSchema.optional(),
  createdAt: dateSchema.optional(),
}).passthrough();

const ExpenseCategorySchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  createdAt: dateSchema.optional(),
}).passthrough();

const ProjectBudgetLineSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  category: z.string(),
  subCategory: z.string().nullable().optional(),
  plannedAmount: decimalSchema.optional(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
}).passthrough();

const ServiceAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: dateSchema.optional(),
}).passthrough();


// --- Main Backup Schema ---

export const BackupDataSchema = z.object({
  version: z.string(),
  timestamp: z.string().optional(),
  users: z.array(UserSchema).optional(),
  accounts: z.array(AccountSchema).optional(),
  products: z.array(ProductSchema).optional(),
  resourceProfiles: z.array(ResourceProfileSchema).optional(),
  contacts: z.array(ContactSchema).optional(),
  interactions: z.array(InteractionSchema).optional(),
  features: z.array(FeatureSchema).optional(),
  roadmapItems: z.array(RoadmapItemSchema).optional(),
  opportunities: z.array(OpportunitySchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  milestones: z.array(MilestoneSchema).optional(),
  tasks: z.array(TaskSchema).optional(),
  allocations: z.array(AllocationSchema).optional(),
  ideas: z.array(IdeaSchema).optional(),
  timesheetEntries: z.array(TimesheetEntrySchema).optional(),
  expenseCategories: z.array(ExpenseCategorySchema).optional(),
  projectBudgetLines: z.array(ProjectBudgetLineSchema).optional(),
  serviceAreas: z.array(ServiceAreaSchema).optional(),
});

export type BackupData = z.infer<typeof BackupDataSchema>;
