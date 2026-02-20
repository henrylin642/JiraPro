'use client';

import React from 'react';
import { SecuritySettings } from './components/security-settings';
import { DataManagementSettings } from './components/data-management-settings';
import { ExpenseCategorySettings } from './components/expense-category-settings';
import { BackupSettingsCard } from './components/backup-settings-card';
import { ServiceAreaSettings } from './components/service-area-settings';

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

            <div className="grid gap-6">
                <SecuritySettings />
                <DataManagementSettings />
                <ExpenseCategorySettings />
                <BackupSettingsCard />
                <ServiceAreaSettings />
            </div>
        </div>
    );
}
