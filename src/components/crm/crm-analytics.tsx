'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalesForecast, getWinLossStats } from '@/app/admin/crm/actions';
import { format } from 'date-fns';

export function CrmAnalytics() {
    const [forecast, setForecast] = useState<{ month: string, value: number }[]>([]);
    const [winLoss, setWinLoss] = useState<{ won: number, lost: number, reasons: Record<string, number> } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const [forecastData, winLossData] = await Promise.all([
                getSalesForecast(),
                getWinLossStats()
            ]);
            setForecast(forecastData);
            setWinLoss(winLossData);
        };
        fetchData();
    }, []);

    if (!winLoss) return <div className="p-4">Loading analytics...</div>;

    const totalClosed = winLoss.won + winLoss.lost;
    const winRate = totalClosed > 0 ? Math.round((winLoss.won / totalClosed) * 100) : 0;

    const maxForecastValue = Math.max(...forecast.map(f => f.value), 0);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                {/* Sales Forecast */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sales Forecast (Weighted Revenue)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-end gap-2 mt-4">
                            {forecast.length === 0 && <div className="w-full text-center text-muted-foreground self-center">No forecast data</div>}
                            {forecast.map((item) => (
                                <div key={item.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div
                                        className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                                        style={{ height: `${maxForecastValue > 0 ? (item.value / maxForecastValue) * 100 : 0}%`, minHeight: '4px' }}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap">
                                            ${item.value.toLocaleString()}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground -rotate-45 origin-top-left translate-y-2 translate-x-2">
                                        {item.month}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 text-xs text-muted-foreground text-center">
                            * Calculated based on Estimated Value × Probability
                        </div>
                    </CardContent>
                </Card>

                {/* Win/Loss Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle>Win/Loss Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Win Rate */}
                        <div className="flex items-center gap-4">
                            <div className="h-24 w-24 rounded-full border-8 border-muted flex items-center justify-center relative">
                                <span className="text-xl font-bold">{winRate}%</span>
                                <span className="text-[10px] absolute bottom-4 text-muted-foreground">WIN RATE</span>
                                <svg className="absolute inset-0 -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="8" fill="none" className="text-primary"
                                        strokeDasharray={`${winRate * 2.89} 289`} strokeLinecap="round" />
                                </svg>
                            </div>
                            <div className="space-y-1">
                                <div className="text-sm font-medium">Closed Won: <span className="text-primary">{winLoss.won}</span></div>
                                <div className="text-sm font-medium">Closed Lost: <span className="text-destructive">{winLoss.lost}</span></div>
                            </div>
                        </div>

                        {/* Loss Reasons */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3">Loss Reasons</h4>
                            <div className="space-y-2">
                                {Object.entries(winLoss.reasons).map(([reason, count]) => (
                                    <div key={reason} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>{reason}</span>
                                            <span className="text-muted-foreground">{count} ({Math.round((count / winLoss.lost) * 100)}%)</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-destructive/70"
                                                style={{ width: `${(count / winLoss.lost) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(winLoss.reasons).length === 0 && (
                                    <div className="text-sm text-muted-foreground">No loss reasons recorded.</div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
