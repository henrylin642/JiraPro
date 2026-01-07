
import React from 'react';
import { getProducts, getIdeas, getUsers, getProductsList } from './actions';
import { RoadmapView } from '@/components/product/roadmap-view';
import { DemandBoard } from '@/components/product/demand-board';
import { CreateProductDialog } from '@/components/product/create-product-dialog';
import { BusinessModelCanvas } from '@/components/product/business-model-canvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ProductPage() {
    const products = await getProducts();
    const ideas = await getIdeas();
    const users = await getUsers();
    const productsList = await getProductsList();

    return (
        <div className="flex flex-col h-screen p-6 bg-background">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
                    <p className="text-muted-foreground">
                        Manage product roadmaps, features, and user demand.
                    </p>
                </div>
                <div className="flex gap-2">
                    <CreateProductDialog />
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs defaultValue="roadmap" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="w-[600px] mb-4">
                        <TabsTrigger value="roadmap">Roadmap & Features</TabsTrigger>
                        <TabsTrigger value="strategy">Strategy & BMC</TabsTrigger>
                        <TabsTrigger value="demand">Demand Portal</TabsTrigger>
                    </TabsList>

                    <TabsContent value="roadmap" className="flex-1 overflow-auto">
                        <RoadmapView products={products} />
                    </TabsContent>

                    <TabsContent value="strategy" className="flex-1 overflow-auto">
                        <div className="h-full">
                            <h2 className="text-xl font-bold mb-4">Business Model Canvas</h2>
                            <BusinessModelCanvas products={productsList} />
                        </div>
                    </TabsContent>

                    <TabsContent value="demand" className="flex-1 overflow-auto">
                        <DemandBoard ideas={ideas} users={users} products={productsList} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
