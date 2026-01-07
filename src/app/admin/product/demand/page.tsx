import React from 'react';
import { getIdeas, getUsers, getProductsList } from './actions';
import { DemandBoard } from '@/components/product/demand-board';

export default async function DemandPage() {
    const ideas = await getIdeas();
    const users = await getUsers();
    const products = await getProductsList();

    return (
        <div className="p-6">
            <DemandBoard ideas={ideas} users={users} products={products} />
        </div>
    );
}
