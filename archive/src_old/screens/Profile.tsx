"use client";

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Beaker, Calendar, Heart, Mail, Shield, User, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, isAdmin } = useAuth();

  const handleSave = () => {
    toast.success('Profile updated successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="bg-gradient-card lg:col-span-1">
            <CardContent className="flex flex-col items-center pt-8">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {user?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="mt-4 flex gap-2">
                <Badge className={isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted'}>
                  {isAdmin ? 'Admin' : 'User'}
                </Badge>
              </div>

              {/* Follow Stats */}
              <div className="mt-6 flex w-full justify-center gap-8 border-t border-border pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{user?.followers?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{user?.following?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>

              <div className="mt-6 w-full space-y-3 border-t border-border pt-6">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Username</span>
                  <span className="ml-auto font-mono text-xs">@{user?.username}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email</span>
                  <span className="ml-auto">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Role</span>
                  <span className="ml-auto capitalize">{user?.role}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined</span>
                  <span className="ml-auto">
                    {user?.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-6 w-full space-y-2 border-t border-border pt-6">
                <Link href="/experiments">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Beaker className="h-4 w-4" />
                    My Experiments
                  </Button>
                </Link>
                <Link href="/models/library">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Heart className="h-4 w-4" />
                    My Favorited Models
                  </Button>
                </Link>
                <Link href="/public-hub">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    Discover Users
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card className="bg-gradient-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Edit Profile
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={user?.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    defaultValue={user?.username} 
                    disabled 
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" placeholder="Tell us about yourself..." />
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="mb-4 font-medium">Change Password</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline">Cancel</Button>
                <Button variant="hero" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
