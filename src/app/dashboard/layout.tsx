
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Menu, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { signOut } from '@/firebase/auth/google-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut().then(() => {
      router.push('/');
    });
  }

  const userDisplayName = user?.displayName || 'User';
  const userEmail = user?.email || 'No email';
  const userPhotoURL = user?.photoURL;
  
  const userMenuItems = (
      <>
          <Link href="/dashboard/settings" passHref>
              <DropdownMenuItem onClick={() => setMobileMenuOpen(false)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
              </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
          </DropdownMenuItem>
      </>
  );

  const userProfileInfo = (
      <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{userDisplayName}</p>
          <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
          </p>
      </div>
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <BrainCircuit className="w-8 h-8 text-primary" />
            <span className="font-bold text-lg">QuizCraft</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Add sidebar navigation items here in the future */}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen font-body antialiased">
            <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
              <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-xl font-bold text-primary font-headline hidden sm:block">QuizCraft Architect</h1>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <SheetHeader className="border-b pb-4 text-left">
                                <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    {userPhotoURL && <AvatarImage src={userPhotoURL} alt={userDisplayName} />}
                                    <AvatarFallback>{userDisplayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {userProfileInfo}
                                </div>
                            </SheetHeader>
                            <div className="py-4">
                                {userMenuItems}
                            </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:flex">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                {userPhotoURL && <AvatarImage src={userPhotoURL} alt={userDisplayName} />}
                                <AvatarFallback>{userDisplayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                {userProfileInfo}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {userMenuItems}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
              </div>
            </header>
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
