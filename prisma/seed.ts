import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({});

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Clean up existing data (Order matters for foreign keys!)
    await prisma.expense.deleteMany(); // Delete Expenses first
    await prisma.timesheetEntry.deleteMany();
    await prisma.allocation.deleteMany();
    await prisma.task.deleteMany();
    await prisma.milestone.deleteMany();
    await prisma.project.deleteMany();

    await prisma.interaction.deleteMany(); // Delete Interactions
    await prisma.opportunity.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.account.deleteMany();

    await prisma.idea.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.roadmapItem.deleteMany();
    await prisma.businessModelCanvas.deleteMany(); // Delete BMC
    await prisma.product.deleteMany();

    await prisma.resourceProfile.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create Users & Resources
    const admin = await prisma.user.create({
        data: {
            email: 'admin@company.com',
            password: 'password123',
            name: 'Admin User',
            role: 'ADMIN',
            resourceProfile: {
                create: {
                    title: 'CTO',
                    skills: 'Management, Architecture',
                    costRate: 150,
                    billableRate: 300,
                },
            },
        },
    });

    const sales = await prisma.user.create({
        data: {
            email: 'alice@company.com',
            password: 'password123',
            name: 'Alice Sales',
            role: 'MANAGER', // Sales Manager
            resourceProfile: {
                create: {
                    title: 'Sales Director',
                    skills: 'Negotiation, CRM',
                    costRate: 80,
                    billableRate: 0, // Sales usually non-billable
                },
            },
        },
    });

    const pm = await prisma.user.create({
        data: {
            email: 'bob@company.com',
            password: 'password123',
            name: 'Bob PM',
            role: 'MANAGER',
            resourceProfile: {
                create: {
                    title: 'Senior Project Manager',
                    skills: 'Agile, PMP',
                    costRate: 100,
                    billableRate: 200,
                },
            },
        },
    });

    const dev = await prisma.user.create({
        data: {
            email: 'charlie@company.com',
            password: 'password123',
            name: 'Charlie Dev',
            role: 'EMPLOYEE',
            resourceProfile: {
                create: {
                    title: 'Senior Frontend Engineer',
                    skills: 'React, TypeScript, Tailwind',
                    costRate: 90,
                    billableRate: 180,
                },
            },
        },
    });

    const designer = await prisma.user.create({
        data: {
            email: 'diana@company.com',
            password: 'password123',
            name: 'Diana Design',
            role: 'EMPLOYEE',
            resourceProfile: {
                create: {
                    title: 'Product Designer',
                    skills: 'Figma, UI/UX',
                    costRate: 85,
                    billableRate: 170,
                },
            },
        },
    });

    // Add Henry's account
    await prisma.user.create({
        data: {
            email: 'henry.lin@lig.com.tw',
            password: 'password123', // Default password
            name: 'Henry Lin',
            role: 'ADMIN',
            resourceProfile: {
                create: {
                    title: 'Administrator',
                    skills: 'System Admin',
                    costRate: 100,
                    billableRate: 200,
                },
            },
        },
    });

    console.log('✅ Users created');

    // 3. Create Accounts
    const acme = await prisma.account.create({
        data: {
            name: 'Acme Corp',
            industry: 'Manufacturing',
            website: 'https://acme.com',
            contacts: {
                create: [
                    { name: 'Wile E. Coyote', email: 'coyote@acme.com', title: 'CEO' },
                ],
            },
        },
    });

    const globex = await prisma.account.create({
        data: {
            name: 'Globex Corporation',
            industry: 'Technology',
            website: 'https://globex.com',
            contacts: {
                create: [
                    { name: 'Hank Scorpio', email: 'hank@globex.com', title: 'CEO' },
                ],
            },
        },
    });

    const soylent = await prisma.account.create({
        data: {
            name: 'Soylent Corp',
            industry: 'Food & Beverage',
            website: 'https://soylent.com',
        },
    });

    console.log('✅ Accounts created');

    // 4. Create Opportunities (The Pipeline)
    await prisma.opportunity.create({
        data: {
            title: 'Acme E-commerce Replatform',
            accountId: acme.id,
            stage: 'PROPOSAL',
            probability: 60,
            estimatedValue: 500000,
            expectedCloseDate: new Date('2025-12-31'),
        },
    });

    await prisma.opportunity.create({
        data: {
            title: 'Globex AI Assistant',
            accountId: globex.id,
            stage: 'NEGOTIATION',
            probability: 90,
            estimatedValue: 1200000,
            expectedCloseDate: new Date('2025-12-15'),
        },
    });

    await prisma.opportunity.create({
        data: {
            title: 'Soylent Mobile App',
            accountId: soylent.id,
            stage: 'LEAD',
            probability: 10,
            estimatedValue: 300000,
            expectedCloseDate: new Date('2026-03-01'),
        },
    });

    console.log('✅ Opportunities created');

    // 5. Create Products & Roadmap
    const product = await prisma.product.create({
        data: {
            name: 'JiraPro SaaS',
            description: 'Our flagship project management tool',
            roadmap: {
                create: [
                    {
                        title: 'Q1 Release',
                        version: 'v1.0',
                        startDate: new Date('2026-01-01'),
                        endDate: new Date('2026-03-31'),
                    },
                ],
            },
            features: {
                create: [
                    {
                        title: 'AI Assistant',
                        description: 'Automated task summarization',
                        status: 'PLANNED',
                        opportunities: {
                            connect: [{ id: (await prisma.opportunity.findFirst({ where: { title: 'Globex AI Assistant' } }))?.id || '' }],
                        },
                    },
                ],
            },
        },
    });

    console.log('✅ Products created');

    // 6. Create Projects & Tasks
    const globexOpp = await prisma.opportunity.findFirst({ where: { title: 'Globex AI Assistant' } });
    const devResource = await prisma.resourceProfile.findUnique({ where: { userId: dev.id } });
    const designerResource = await prisma.resourceProfile.findUnique({ where: { userId: designer.id } });

    if (globexOpp && devResource && designerResource) {
        const project = await prisma.project.create({
            data: {
                name: 'Globex AI Implementation',
                code: 'PRJ-GLBX-001',
                description: 'Implementation of the AI Assistant for Globex Corp.',
                status: 'ACTIVE',
                accountId: globex.id,
                managerId: pm.id,
                startDate: new Date('2025-12-01'),
                endDate: new Date('2026-03-31'),
                budget: 1200000,
                allocations: {
                    create: [
                        { resourceId: devResource.id, startDate: new Date('2025-12-01'), endDate: new Date('2026-03-31'), type: 'HARD', percentage: 100 },
                        { resourceId: designerResource.id, startDate: new Date('2025-12-01'), endDate: new Date('2026-01-31'), type: 'HARD', percentage: 50 },
                    ]
                }
            },
        });

        // Milestones
        const m1 = await prisma.milestone.create({
            data: {
                projectId: project.id,
                name: 'Design Sign-off',
                dueDate: new Date('2025-12-31'),
                amount: 200000,
            }
        });

        const m2 = await prisma.milestone.create({
            data: {
                projectId: project.id,
                name: 'MVP Delivery',
                dueDate: new Date('2026-02-28'),
                amount: 500000,
            }
        });

        // Tasks
        await prisma.task.createMany({
            data: [
                {
                    projectId: project.id,
                    title: 'System Architecture Design',
                    status: 'DONE',
                    priority: 'HIGH',
                    startDate: new Date('2025-12-01'),
                    dueDate: new Date('2025-12-15'),
                    assigneeId: dev.id,
                    milestoneId: m1.id,
                },
                {
                    projectId: project.id,
                    title: 'UI Mockups',
                    status: 'REVIEW',
                    priority: 'MEDIUM',
                    startDate: new Date('2025-12-05'),
                    dueDate: new Date('2025-12-20'),
                    assigneeId: designer.id,
                    milestoneId: m1.id,
                },
                {
                    projectId: project.id,
                    title: 'Backend API Development',
                    status: 'IN_PROGRESS',
                    priority: 'URGENT',
                    startDate: new Date('2026-01-01'),
                    dueDate: new Date('2026-01-31'),
                    assigneeId: dev.id,
                    milestoneId: m2.id,
                },
                {
                    projectId: project.id,
                    title: 'Frontend Integration',
                    status: 'TODO',
                    priority: 'HIGH',
                    startDate: new Date('2026-02-01'),
                    dueDate: new Date('2026-02-20'),
                    assigneeId: dev.id,
                    milestoneId: m2.id,
                },
            ]
        });

        console.log('✅ Projects & Tasks created');
    }

    console.log('🌱 Seed completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
