'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { Settings } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import StatCard from './stat-card';

const profileBanner = PlaceHolderImages.find(p => p.id === 'profile-banner');
const profileAvatar = PlaceHolderImages.find(p => p.id === 'profile-avatar');

export default function ProfileHeader() {
    const stats = [
        { value: '3', label: 'Ongoing programs' },
        { value: '75%', label: 'Completed' },
        { value: '40h', label: 'Weekly engagement' },
    ];


    return (
        <header className="bg-card shadow-sm">
            <div className="relative h-48 md:h-64 w-full">
                {profileBanner && <Image
                    src={profileBanner.imageUrl}
                    alt="Profile Banner"
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint={profileBanner.imageHint}
                />}
            </div>
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center -mt-16 md:-mt-20">
                    <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-card overflow-hidden flex-shrink-0">
                         {profileAvatar && <Image
                            src={profileAvatar.imageUrl}
                            alt="User Avatar"
                            fill
                            style={{ objectFit: 'cover' }}
                            data-ai-hint={profileAvatar.imageHint}
                        />}
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-bold">Abdul Ahad</h1>
                        <p className="text-muted-foreground">abdulahad123</p>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-auto flex items-center gap-2">
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Account Settings
                        </Button>
                        <Button>Edit Profile</Button>
                    </div>
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                    {stats.map((stat) => (
                        <StatCard key={stat.label} value={stat.value} label={stat.label} />
                    ))}
                </div>
            </div>
        </header>
    );
}
