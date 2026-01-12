import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProductLoading() {
    return (
        <div className="flex flex-col h-screen p-6 bg-background space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
                    <p className="text-muted-foreground">Manage products, ideas, and roadmaps.</p>
                </div>
                <Button disabled>New Idea</Button>
            </div>

            <div className="md:hidden">
                <Skeleton className="h-10 w-full" />
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                <div className="w-full md:w-64 flex flex-col gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>

                <div className="flex-1 overflow-hidden space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-[200px] rounded-xl" />
                        <Skeleton className="h-[200px] rounded-xl" />
                        <Skeleton className="h-[200px] rounded-xl" />
                    </div>
                    <Skeleton className="h-[300px] rounded-xl w-full" />
                </div>
            </div>
        </div>
    );
}
