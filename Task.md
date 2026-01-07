# Project Management Platform Development Plan

This document tracks the development progress of the Enterprise Project Management Platform (PSA/PPM).
The system is built on five core pillars: **CRM, Product, Project, Resource, and Finance**.

## Phase 1: Foundation & Architecture (Current Focus)
- [x] **Project Initialization**
    - [x] Initialize Next.js project (TypeScript, Tailwind CSS)
    - [x] Setup Shadcn/UI for component library
    - [x] Configure ESLint and Prettier
- [ ] **Architecture Definition**
    - [ ] **Front Office (Employee Portal)**: My Tasks, Timesheets, Idea Submission.
    - [ ] **Back Office (Management Portal)**: CRM, Resource Planning, Financials, Settings.
- [x] **Database Schema Design (Prisma)**
    - [x] Define `User` & `ResourceProfile` (Skills, Rates)
    - [x] Define `Account` & `Opportunity` (CRM)
    - [x] Define `Product` & `RoadmapItem` (Product)
    - [x] Define `Project`, `Milestone`, `Task` (PM)
    - [x] Define `Timesheet` & `FinancialRecord` (Finance)
- [x] **Infrastructure Setup**
    - [x] Setup Database (Prisma initialized)
    - [x] Configure Prisma Client

## Phase 2: CRM & Opportunity Management (Revenue Source)
- [x] **Sales Pipeline Board**
    - [x] Kanban view for Opportunities (Stages: Lead -> Proposal -> Won)
    - [x] Drag-and-drop state management
- [x] **Opportunity Details**
    - [x] Basic info (Value, Probability, Expected Close Date)
    - [x] **Pre-sales Resource Booking** (Soft Booking)
    - [x] Pre-sales Cost Tracking (Time spent on proposal)

## Phase 3: Product Management (The "What")
- [x] **Product Management**
    - [x] Roadmap Timeline View (Versions, Features)
    - [x] Feature Backlog & Revenue Impact (Linked to Opportunities)
    - [x] Demand Portal (Idea collection & prioritization)
    - [x] RICE Scoring for prioritization

## Phase 4: Resource & Project Execution (The "How")
- [x] **Resource Management**
    - [x] Resource Pool (Employee list with skills & costs)
    - [x] Workload View (Availability heatmap)
    - [x] Resource Editing (Profile & Rates)
- [ ] **Project Management**
    - [x] Project Creation Wizard (Convert from Opportunity)
    - [x] Project CRUD (Create/Edit Projects directly)
    - [x] Gantt Chart & Task Board
    - [x] Milestone tracking & Billing triggers
- [x] **Time Tracking**
    - [x] Timesheet interface for employees

## Phase 5: Finance & Intelligence (The "Bottom Line")
- [x] **Financial Engine**
    - [x] Real-time Margin Calculation (Revenue - Cost)
    - [x] Budget vs Actuals analysis
- [x] **Dashboards**
    - [x] Executive Dashboard (Company-wide health)
    - [x] Sales Dashboard (Pipeline health)
    - [ ] Project Health Dashboard

## Phase 6: Polish & Optimization
- [ ] **UI/UX Refinement**
    - [ ] Global search
    - [ ] Dark mode optimization
    - [ ] Micro-animations
- [ ] **Performance Tuning**
    - [ ] Database query optimization
    - [ ] Server-side rendering optimizations

---
**Tech Stack:**
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **Database:** PostgreSQL (via Prisma ORM)
- **State Management:** React Query / Zustand
