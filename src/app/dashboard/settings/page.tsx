'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Monitor, Moon, Sun } from 'lucide-react';
import ProfileHeader from '@/components/profile-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import placeholderImages from '@/lib/placeholder-images.json';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { updateUserPassword, deleteUserAccount } from '@/firebase/auth/email-password-auth';
import { getAuth } from 'firebase/auth';


export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [userTitle, setUserTitle] = useState('Quiz Master'); // Placeholder
  const [newPassword, setNewPassword] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }
  
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    // In a real app, you would call a function to update the user's profile
    // For now, we'll just simulate it.
    setTimeout(() => {
        toast({
            title: "Profile Updated",
            description: "Your profile information has been saved.",
        });
        setIsSavingProfile(false);
    }, 1000);
  }
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'New password cannot be empty.' });
      return;
    }
    setIsSavingPassword(true);
    try {
      await updateUserPassword(newPassword);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      setNewPassword('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Password Update Failed',
        description: error.message,
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAccountDelete = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteUserAccount();
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      router.push('/'); // Redirect to login page
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Account Deletion Failed',
        description: error.message,
      });
      setIsDeletingAccount(false);
    }
  }

  const isPasswordProvider = getAuth().currentUser?.providerData.some(
    (provider) => provider.providerId === 'password'
  );

  return (
    <main className="min-h-screen bg-muted/30 font-body antialiased">
       <header className="bg-background border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 md:px-6 h-16 flex items-center">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mr-4">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-xl font-bold text-primary font-headline">Settings</h1>
          </div>
        </header>

        <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
            <ProfileHeader 
                userName={user.displayName || "User"}
                userTitle={userTitle}
                bannerImageUrl={placeholderImages.profileBanner}
                avatarImageUrl={user.photoURL || placeholderImages.profileAvatar}
            />

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <form onSubmit={handleProfileSave}>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your personal details here.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="userTitle">Title</Label>
                                    <Input id="userTitle" value={userTitle} onChange={(e) => setUserTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={user.email || ''} disabled />
                                    <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4">
                                <Button type="submit" disabled={isSavingProfile}>
                                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
                
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>Customize the look and feel of the app.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="theme">Theme</Label>
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">
                                            <div className="flex items-center gap-2">
                                                <Sun className="h-4 w-4" /> Light
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            <div className="flex items-center gap-2">
                                                <Moon className="h-4 w-4" /> Dark
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system">
                                             <div className="flex items-center gap-2">
                                                <Monitor className="h-4 w-4" /> System
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {isPasswordProvider && (
                      <Card>
                          <form onSubmit={handlePasswordUpdate}>
                              <CardHeader>
                                  <CardTitle>Account</CardTitle>
                                  <CardDescription>Manage your account settings.</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="new-password">New Password</Label>
                                      <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                  </div>
                              </CardContent>
                              <CardFooter className="border-t px-6 py-4">
                                  <Button disabled={isSavingPassword}>
                                      {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Update Password
                                  </Button>
                              </CardFooter>
                          </form>
                      </Card>
                    )}

                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                             <CardDescription>This action is irreversible. Please be certain.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="w-full" disabled={isDeletingAccount}>
                                {isDeletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Delete My Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your
                                  account and all of your data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleAccountDelete}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete My Account
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </main>
  );
}
