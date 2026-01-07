'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteOpportunity } from '@/app/admin/crm/actions';
import { useRouter } from 'next/navigation';

export function DeleteOpportunityButton({ id, title }: { id: string; title: string }) {
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete opportunity "${title}"? This cannot be undone.`)) {
            const result = await deleteOpportunity(id);
            if (result.success) {
                router.push('/admin/crm');
            } else {
                alert('Failed to delete opportunity');
            }
        }
    };

    return (
        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
