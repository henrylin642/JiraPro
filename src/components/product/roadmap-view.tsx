'use client';

import React, { useState } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';




import { updateFeatureRice, deleteProduct, deleteFeature, deleteRoadmapItem } from '@/app/admin/product/actions';
import { Calculator, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { CreateFeatureDialog } from '@/components/product/create-feature-dialog';
import { CreateRoadmapItemDialog } from '@/components/product/create-roadmap-item-dialog';
import { CreateProductDialog } from '@/components/product/create-product-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type RoadmapItem = {
    id: string;
    title: string;
    version: string | null;
    startDate: Date | string;
    endDate: Date | string;
};

type Feature = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    riceReach: number;
    riceImpact: number;
    riceConfidence: number;
    riceEffort: number;
    riceScore: number;
    opportunities: {
        estimatedValue: number | string;
        probability: number;
    }[];
};

type Product = {
    id: string;
    name: string;
    description: string | null;
    roadmap: RoadmapItem[];
    features: Feature[];
};

function RiceScoreDialog({ feature }: { feature: Feature }) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState({
        reach: feature.riceReach,
        impact: feature.riceImpact,
        confidence: feature.riceConfidence,
        effort: feature.riceEffort,
    });

    const handleSave = async () => {
        await updateFeatureRice(feature.id, data);
        setOpen(false);
    };

    const currentScore = (data.reach * data.impact * (data.confidence / 100)) / (data.effort || 1);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 text-xs gap-1">
                    <Calculator className="h-3 w-3" />
                    RICE: {Math.round(feature.riceScore)}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>RICE Scoring: {feature.title}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Reach</Label>
                        <Input
                            type="number"
                            value={data.reach}
                            onChange={e => setData({ ...data, reach: Number(e.target.value) })}
                            className="col-span-3"
                        />
                        <div className="col-span-4 text-xs text-muted-foreground text-right">
                            Users/events per time period (e.g. 1000/mo)
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Impact</Label>
                        <Select
                            value={String(data.impact)}
                            onValueChange={v => setData({ ...data, impact: Number(v) })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">3 - Massive</SelectItem>
                                <SelectItem value="2">2 - High</SelectItem>
                                <SelectItem value="1">1 - Medium</SelectItem>
                                <SelectItem value="0.5">0.5 - Low</SelectItem>
                                <SelectItem value="0.25">0.25 - Minimal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Confidence</Label>
                        <Select
                            value={String(data.confidence)}
                            onValueChange={v => setData({ ...data, confidence: Number(v) })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="100">100% - High</SelectItem>
                                <SelectItem value="80">80% - Medium</SelectItem>
                                <SelectItem value="50">50% - Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Effort</Label>
                        <Input
                            type="number"
                            value={data.effort}
                            onChange={e => setData({ ...data, effort: Number(e.target.value) })}
                            className="col-span-3"
                        />
                        <div className="col-span-4 text-xs text-muted-foreground text-right">
                            Person-months
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t pt-4 mt-2">
                        <span className="font-semibold">Calculated Score:</span>
                        <span className="text-xl font-bold text-primary">{Math.round(currentScore)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save Score</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function RoadmapView({ products }: { products: Product[] }) {
    // Determine timeline range (e.g., next 12 months)
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(addMonths(today, 11));


    const months = eachMonthOfInterval({ start, end });

    const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'product' | 'feature' | 'item', name?: string } | null>(null);

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.type === 'product') await deleteProduct(deleteTarget.id);
            if (deleteTarget.type === 'feature') await deleteFeature(deleteTarget.id);
            if (deleteTarget.type === 'item') await deleteRoadmapItem(deleteTarget.id);
        } catch (error) {
            console.error(error);
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-6">
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the {deleteTarget?.type} "{deleteTarget?.name}".
                            {deleteTarget?.type === 'product' && " This will also delete all associated features and roadmap items."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                            {product.name}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <CreateProductDialog
                                        product={{ id: product.id, name: product.name, description: product.description }}
                                        trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                                    />
                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: product.id, type: 'product', name: product.name })}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardTitle>
                        <div className="flex gap-2">
                            <CreateFeatureDialog productId={product.id} productName={product.name} />
                            <CreateRoadmapItemDialog productId={product.id} productName={product.name} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                            <div className="flex w-max min-w-full flex-col">
                                {/* Timeline Header */}
                                <div className="flex border-b bg-muted/50">
                                    <div className="w-48 flex-none border-r p-4 font-medium sticky left-0 bg-background z-10">
                                        Version / Feature
                                    </div>
                                    {months.map((month) => (
                                        <div
                                            key={month.toString()}
                                            className="w-32 flex-none border-r p-4 text-center text-sm font-medium"
                                        >
                                            {format(month, 'MMM yyyy')}
                                        </div>
                                    ))}
                                </div>

                                {/* Roadmap Items */}
                                <div className="relative min-h-[100px]">
                                    {product.roadmap.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            No roadmap items planned yet.
                                        </div>
                                    ) : (
                                        product.roadmap.map((item, index) => {
                                            // Calculate position and width
                                            const itemStart = new Date(item.startDate);
                                            const itemEnd = new Date(item.endDate);

                                            // Simple overlap logic or just stacking for now
                                            // For a proper gantt, we need more complex logic. 
                                            // Here we just list them in rows.

                                            // Find start month index
                                            const startMonthIndex = months.findIndex(m =>
                                                isWithinInterval(itemStart, { start: startOfMonth(m), end: endOfMonth(m) })
                                            );

                                            // Find end month index
                                            const endMonthIndex = months.findIndex(m =>
                                                isWithinInterval(itemEnd, { start: startOfMonth(m), end: endOfMonth(m) })
                                            );

                                            // If item is outside view, handle gracefully (simplified for now)
                                            if (startMonthIndex === -1 && endMonthIndex === -1) return null;

                                            const effectiveStartIndex = startMonthIndex === -1 ? 0 : startMonthIndex;
                                            const effectiveEndIndex = endMonthIndex === -1 ? months.length - 1 : endMonthIndex;

                                            const leftOffset = 192 + (effectiveStartIndex * 128); // 192px sidebar + 128px per month
                                            const width = ((effectiveEndIndex - effectiveStartIndex + 1) * 128) - 16; // -16 for margin

                                            return (
                                                <div key={item.id} className="flex border-b hover:bg-muted/20 transition-colors relative h-16 items-center group">
                                                    <div className="w-48 flex-none border-r p-4 text-sm font-medium sticky left-0 bg-background z-10 flex justify-between items-center pr-2">
                                                        <div className="truncate flex-1">
                                                            {item.version ? <Badge variant="outline" className="mr-2">{item.version}</Badge> : null}
                                                            {item.title}
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreVertical className="h-3 w-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <CreateRoadmapItemDialog
                                                                    productId={product.id}
                                                                    productName={product.name}
                                                                    item={{
                                                                        id: item.id,
                                                                        title: item.title,
                                                                        version: item.version,
                                                                        startDate: item.startDate,
                                                                        endDate: item.endDate
                                                                    }}
                                                                    trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                                                                />
                                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: item.id, type: 'item', name: item.title })}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {/* Render bar absolutely positioned relative to the timeline grid container? 
                               Actually, let's just render the grid cells and overlay the bar.
                           */}
                                                    <div className="flex absolute left-0 top-0 h-full w-full pointer-events-none">
                                                        <div className="w-48 flex-none"></div> {/* Spacer for sidebar */}
                                                        {months.map((m) => (
                                                            <div key={m.toString()} className="w-32 flex-none border-r h-full"></div>
                                                        ))}
                                                    </div>

                                                    <div
                                                        className="absolute h-8 rounded-md bg-primary/20 border border-primary text-primary-foreground flex items-center px-3 text-xs font-medium overflow-hidden z-0"
                                                        style={{
                                                            left: `${leftOffset + 8}px`,
                                                            width: `${width}px`
                                                        }}
                                                    >
                                                        <span className="text-primary truncate">{item.title}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>

                        {/* Feature Revenue Impact Section */}
                        <div className="mt-8 border-t pt-4">
                            <h3 className="px-4 font-semibold mb-2">Feature Backlog & Revenue Impact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-4">
                                {product.features.map(feature => {
                                    const revenueImpact = feature.opportunities.reduce((sum, opp) => sum + Number(opp.estimatedValue) * (opp.probability / 100), 0);
                                    return (
                                        <Card key={feature.id}>
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="text-sm font-medium flex justify-between items-start">
                                                    <span>{feature.title}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={feature.status === 'PLANNED' ? 'default' : 'secondary'}>{feature.status}</Badge>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                    <MoreVertical className="h-3 w-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <CreateFeatureDialog
                                                                    productId={product.id}
                                                                    productName={product.name}
                                                                    feature={{
                                                                        id: feature.id,
                                                                        title: feature.title,
                                                                        description: feature.description,
                                                                        status: feature.status
                                                                    }}
                                                                    trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                                                                />
                                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: feature.id, type: 'feature', name: feature.title })}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <p className="text-xs text-muted-foreground mb-4 h-10 overflow-hidden">{feature.description}</p>

                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            RICE: {Math.round(feature.riceScore)}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground" title="Reach / Impact / Confidence / Effort">
                                                            (R:{feature.riceReach} / I:{Number(feature.riceImpact)} / C:{feature.riceConfidence}% / E:{Number(feature.riceEffort)})
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-mono text-muted-foreground">Linked Opps: {feature.opportunities.length}</span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        +${Math.round(revenueImpact).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <RiceScoreDialog feature={feature} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
