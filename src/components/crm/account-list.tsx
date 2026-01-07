'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, ExternalLink, Trash2 } from 'lucide-react';
import { AccountDialog, AccountDialogAccountType } from './account-dialog';
import { deleteAccount } from '@/app/admin/crm/account-actions';

// Use the type exported from the Dialog to guarantee compatibility
type Account = AccountDialogAccountType & {
    _count?: {
        opportunities: number;
    };
};

export function AccountList({ data }: { data: Account[] }) {
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <AccountDialog trigger={<Button>Add Account</Button>} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead className="text-right">Active Deals</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((account) => (
                            <TableRow key={account.id}>
                                <TableCell className="font-medium">
                                    <a href={`/admin/crm/account/${account.id}`} className="hover:underline text-primary">
                                        {account.name}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{account.industry || 'N/A'}</Badge>
                                </TableCell>
                                <TableCell>
                                    {account.website ? (
                                        <a
                                            href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-blue-600 hover:underline"
                                        >
                                            {account.website} <ExternalLink className="ml-1 h-3 w-3" />
                                        </a>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {account._count?.opportunities || 0}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingAccount(account)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={async () => {
                                            if (confirm(`Are you sure you want to delete ${account.name}? This cannot be undone.`)) {
                                                const result = await deleteAccount(account.id);
                                                if (!result.success) {
                                                    alert(result.error);
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No accounts found. Start by adding one.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {editingAccount && (
                <AccountDialog
                    open={!!editingAccount}
                    onOpenChange={(open) => !open && setEditingAccount(null)}
                    account={editingAccount || undefined}
                />
            )}
        </div>
    );
}
