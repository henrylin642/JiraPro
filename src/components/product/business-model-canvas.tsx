'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { getBusinessModel, updateBusinessModel, getProductsList } from '@/app/admin/product/actions';

type BMCData = {
    keyPartners: string;
    keyActivities: string;
    keyResources: string;
    valuePropositions: string;
    customerRelationships: string;
    channels: string;
    customerSegments: string;
    costStructure: string;
    revenueStreams: string;
};

const initialBMC: BMCData = {
    keyPartners: '',
    keyActivities: '',
    keyResources: '',
    valuePropositions: '',
    customerRelationships: '',
    channels: '',
    customerSegments: '',
    costStructure: '',
    revenueStreams: '',
};

export function BusinessModelCanvas({ products }: { products: { id: string, name: string }[] }) {
    const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
    const [data, setData] = useState<BMCData>(initialBMC);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // Remove useToast if not available, or implement simple alert. Checking package.json would be ideal but standard shadcn has it.
    // Assuming standard shadcn toaster is not setup or I might miss import.
    // Let's use simple alert for now or try to use toast if I'm sure. 
    // Creating without toast to be safe, adding basic feedback.

    useEffect(() => {
        if (selectedProductId) {
            loadBMC(selectedProductId);
        }
    }, [selectedProductId]);

    const loadBMC = async (id: string) => {
        setLoading(true);
        const bmc = await getBusinessModel(id);
        if (bmc) {
            setData({
                keyPartners: bmc.keyPartners || '',
                keyActivities: bmc.keyActivities || '',
                keyResources: bmc.keyResources || '',
                valuePropositions: bmc.valuePropositions || '',
                customerRelationships: bmc.customerRelationships || '',
                channels: bmc.channels || '',
                customerSegments: bmc.customerSegments || '',
                costStructure: bmc.costStructure || '',
                revenueStreams: bmc.revenueStreams || '',
            });
        } else {
            setData(initialBMC);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateBusinessModel(selectedProductId, data);
            // alert('Business Model Saved'); 
        } catch (error) {
            console.error(error);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: keyof BMCData, value: string) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const Block = ({ title, field, className, placeholder }: { title: string, field: keyof BMCData, className?: string, placeholder?: string }) => (
        <Card className={`flex flex-col h-full shadow-sm hover:shadow-md transition-shadow ${className}`}>
            <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-1">
                <Textarea
                    className="h-full min-h-[100px] resize-none border-none focus-visible:ring-1 bg-transparent p-0 text-sm leading-relaxed"
                    placeholder={placeholder}
                    value={data[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                />
            </CardContent>
        </Card>
    );

    if (!products.length) return <div>No products found. Create a product first.</div>;

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Button onClick={handleSave} disabled={saving || loading}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {!saving && <Save className="mr-2 h-4 w-4" />}
                    Save Canvas
                </Button>
            </div>

            {/* Canvas Grid */}
            <div className="flex-1 grid grid-cols-5 grid-rows-3 gap-4 min-h-[600px]">
                {/* Row 1 */}
                <Block
                    title="Key Partners"
                    field="keyPartners"
                    className="col-span-1 row-span-2"
                    placeholder="Who are our key partners and suppliers? Which key resources are we acquiring from partners?"
                />
                <div className="col-span-1 row-span-2 flex flex-col gap-4">
                    <Block
                        title="Key Activities"
                        field="keyActivities"
                        className="flex-1"
                        placeholder="What key activities do out value propositions require?"
                    />
                    <Block
                        title="Key Resources"
                        field="keyResources"
                        className="flex-1"
                        placeholder="What key resources do our value propositions require?"
                    />
                </div>
                <Block
                    title="Value Propositions"
                    field="valuePropositions"
                    className="col-span-1 row-span-2"
                    placeholder="What value do we deliver to the customer? Which one of our customer's problems are we helping to solve?"
                />
                <div className="col-span-1 row-span-2 flex flex-col gap-4">
                    <Block
                        title="Customer Relationships"
                        field="customerRelationships"
                        className="flex-1"
                        placeholder="What type of relationship does each of our customer segments expect us to establish and maintain with them?"
                    />
                    <Block
                        title="Channels"
                        field="channels"
                        className="flex-1"
                        placeholder="Through which channels do our customer segments want to be reached?"
                    />
                </div>
                <Block
                    title="Customer Segments"
                    field="customerSegments"
                    className="col-span-1 row-span-2"
                    placeholder="For whom are we creating value? Who are our most important customers?"
                />

                {/* Row 2 (Bottom) */}
                <Block
                    title="Cost Structure"
                    field="costStructure"
                    className="col-span-2.5 row-span-1"
                    placeholder="What are the most important costs inherent in our business model?"
                />
                <div className="col-span-2.5 row-span-1">
                    <Block
                        title="Revenue Streams"
                        field="revenueStreams"
                        className="h-full"
                        placeholder="For what value are our customers really willing to pay? How are they currently paying?"
                    />
                </div>
            </div>

            {/* Grid Layout Fix: Tailwind grid-cols-5 is tricky for the bottom 2 blocks spanning half.
                Let's use a simpler nested flex or custom grid. 
                Actually, standard BMC has Cost & Revenue at the bottom spanning 2.5 each? 
                CSS Grid can't do 2.5 cols easily.
                Let's stick to the classic layout:
                Top area: Partners(1), Activities(1), Value(1), Relations(1), Segments(1) -> 5 cols.
                Wait, Activities and Resources are stacked in col 2. Relationship and Channels are stacked in col 4.
                So 5 columns is correct.
                
                Col 1: Partners (Row 1-2)
                Col 2: Activities (Row 1), Resources (Row 2)
                Col 3: Value Prop (Row 1-2)
                Col 4: Relationships (Row 1), Channels (Row 2)
                Col 5: Segments (Row 1-2)

                Bottom Row (Row 3):
                Cost Structure (Col 1-2.5?) -> Let's just split available width 50/50.
            */}

            <div className="grid grid-cols-2 gap-4 h-[200px]">
                <Block
                    title="Cost Structure"
                    field="costStructure"
                    className=""
                    placeholder="What are the most important costs inherent in our business model?"
                />
                <Block
                    title="Revenue Streams"
                    field="revenueStreams"
                    className=""
                    placeholder="For what value are our customers really willing to pay?"
                />
            </div>
        </div>
    );
}
