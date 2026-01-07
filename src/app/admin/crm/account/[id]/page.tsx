import React from 'react';
import { getAccountDetails, addContact, logInteraction } from '@/app/admin/crm/account-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, MapPin, Globe, CreditCard, User, MoreVertical, Briefcase, Calendar, Pencil } from 'lucide-react';
import { AccountDialog } from '@/components/crm/account-dialog';
import { ContactDialog } from '@/components/crm/contact-dialog';
import { InteractionDialog } from '@/components/crm/interaction-dialog';
import { DeleteContactButton } from '@/components/crm/delete-contact-button';

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const account = await getAccountDetails(id);

    if (!account) {
        return <div>Account not found</div>;
    }

    // Calculate total closed revenue
    const totalRevenue = account.projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);

    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {account.industry || 'No Industry'}</span>
                        {account.website && <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> <a href={account.website} target="_blank" className="hover:underline">{account.website}</a></span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <AccountDialog account={account} trigger={<Button variant="outline">Edit Profile</Button>} />
                </div>
            </div>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Closed Revenue</CardTitle>
                        <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
                        <div className="text-2xl font-bold">{account.projects.length}</div>
                    </CardHeader>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="flex-1">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="interactions">Interactions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Company Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{account.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span>{account.address || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                                    <span>Tax ID: {account.taxId || 'N/A'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>


                <TabsContent value="contacts" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <ContactDialog accountId={account.id} trigger={<Button>Add Contact</Button>} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {account.contacts.map((contact) => (
                            <Card key={contact.id} className="relative group">
                                <CardContent className="pt-6">
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ContactDialog
                                            accountId={account.id}
                                            contact={contact}
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <DeleteContactButton contactId={contact.id} accountId={account.id} />
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-lg">{contact.name}</div>
                                            <div className="text-sm text-muted-foreground">{contact.title}</div>
                                        </div>
                                        <User className="w-8 h-8 text-muted-foreground bg-muted p-1 rounded-full" />
                                    </div>
                                    <div className="mt-4 space-y-2 text-sm">
                                        {contact.email && <div className="flex items-center gap-2"><Globe className="w-3 h-3" /> {contact.email}</div>}
                                        {contact.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {contact.phone}</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="interactions" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <InteractionDialog accountId={account.id} trigger={<Button>Log Interaction</Button>} />
                    </div>
                    <div className="space-y-4">
                        {account.interactions.map((interaction) => (
                            <div key={interaction.id} className="flex gap-4 p-4 border rounded-lg bg-card text-card-foreground">
                                <div className="mt-1">
                                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <div className="font-semibold">{interaction.type}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {interaction.date.toDateString()} by {interaction.user?.name || 'Unknown'}
                                        </div>
                                    </div>
                                    <p className="text-sm mt-1">{interaction.notes}</p>
                                </div>
                            </div>
                        ))}
                        {account.interactions.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">No interactions recorded yet.</div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
