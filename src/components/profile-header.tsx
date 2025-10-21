'use client';

import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Camera } from 'lucide-react';

interface ProfileHeaderProps {
    userName: string;
    userTitle: string;
    bannerImageUrl: string;
    avatarImageUrl: string;
}

export default function ProfileHeader({ userName, userTitle, bannerImageUrl, avatarImageUrl }: ProfileHeaderProps) {
    return (
        <div className="rounded-lg overflow-hidden shadow-sm border bg-card text-card-foreground">
            <div className="relative h-48 w-full group">
                <Image
                    src={bannerImageUrl}
                    alt="Profile banner"
                    fill={true}
                    objectFit="cover"
                    className="z-0"
                    data-ai-hint="banner abstract"
                />
                <div className="absolute inset-0 bg-black/30 z-10"></div>
                <Button size="sm" variant="outline" className="absolute top-4 right-4 z-20 bg-background/70 hover:bg-background">
                    <Camera className="mr-2 h-4 w-4"/>
                    Edit Banner
                </Button>
            </div>
            <div className="p-6 pt-0 relative">
                <div className="flex items-end -mt-16">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-background z-20">
                            <AvatarImage src={avatarImageUrl} alt={userName} data-ai-hint="person portrait" />
                            <AvatarFallback>{userName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <Button size="icon" variant="outline" className="absolute bottom-2 right-2 z-30 rounded-full h-8 w-8 bg-background/70 hover:bg-background">
                           <Camera className="h-4 w-4"/>
                           <span className="sr-only">Edit Avatar</span>
                        </Button>
                    </div>
                    <div className="ml-6 mb-2">
                        <h1 className="text-3xl font-bold font-headline">{userName}</h1>
                        <p className="text-md text-muted-foreground">{userTitle}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
