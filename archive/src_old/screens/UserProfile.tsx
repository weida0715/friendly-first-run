"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockApiExperiments, mockApiModels, mockApiUsers } from '@/data/app-data';
import {
  ApiExperimentRecord,
  ApiModelRecord,
  ApiUserRecord,
  ExperimentRun,
  ModelResult,
  createUserLookup,
  mapApiExperiment,
  mapApiModel,
} from '@/lib/data-utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserPlus, 
  UserMinus, 
  Calendar,
  Beaker,
  Boxes,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UserProfile() {
  const params = useParams();
  const username = typeof params?.username === 'string' ? params.username : params?.username?.[0];
  const { user: currentUser, users, followUser, unfollowUser } = useAuth();

  const [experiments, setExperiments] = useState<ExperimentRun[]>([]);
  const [models, setModels] = useState<ModelResult[]>([]);
  const [profileApiUserId, setProfileApiUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadData = () => {
      const apiUsers = mockApiUsers() as ApiUserRecord[];
      const apiProfileUser = apiUsers.find((apiUser) => apiUser.username === username);
      const apiUserId = apiProfileUser?.user_id || apiProfileUser?.id || null;

      const userLookup = createUserLookup(apiUsers);
      const mappedExperiments = mockApiExperiments()
        .filter((exp) => !apiUserId || exp.owner_user_id === apiUserId)
        .map((exp) => mapApiExperiment(exp as ApiExperimentRecord, userLookup));
      const experimentMap = new Map(mappedExperiments.map((exp) => [exp.id, exp] as const));
      const mappedModels = mockApiModels().map((model) =>
        mapApiModel(model as ApiModelRecord, experimentMap, userLookup)
      );

      if (!active) return;
      setProfileApiUserId(apiUserId);
      setExperiments(mappedExperiments);
      setModels(mappedModels);
      setIsLoading(false);
    };

    loadData();
    return () => {
      active = false;
    };
  }, [currentUser?.role, username]);

  // Find the user
  const profileUser = users.find(u => u.username === username);
  const isFollowing = useMemo(
    () => !!currentUser?.following?.includes(profileUser?.id || ''),
    [currentUser?.following, profileUser?.id],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-12 text-muted-foreground">Loading profile...</div>
        </main>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold">User not found</h1>
            <p className="text-muted-foreground mt-2">
              The user @{username} doesn't exist.
            </p>
            <Link href="/public-hub">
              <Button variant="outline" className="mt-4 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Public Hub
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Get user's experiments and models
  const resolvedProfileId = profileApiUserId || profileUser.id;
  const userExperiments = experiments.filter((exp) => {
    if (exp.ownerId !== resolvedProfileId) return false;
    if (currentUser?.role === 'admin') return true;
    return exp.visibility === 'public';
  });
  const userModels = models.filter((model) => {
    if (model.ownerId !== resolvedProfileId) return false;
    if (currentUser?.role === 'admin') return true;
    return model.visibility === 'public';
  });

  const handleFollow = () => {
    if (!profileUser) return;
    if (currentUser?.following?.includes(profileUser.id)) {
      unfollowUser(profileUser.id);
      toast.success('Unfollowed user');
    } else {
      followUser(profileUser.id);
      toast.success('Now following user');
    }
  };

  const isOwnProfile = currentUser?.id === profileUser.id;


  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Back link */}
        <Link 
          href="/public-hub" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Public Hub
        </Link>

        {/* Profile Header */}
        <Card className="bg-gradient-card mb-8">
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-8">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                {profileUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profileUser.name}</h1>
              <p className="text-muted-foreground">@{profileUser.username}</p>
              
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-6">
                <div className="text-center">
                  <p className="text-xl font-bold">{profileUser.followers.length}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{profileUser.following.length}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{userExperiments.length}</p>
                  <p className="text-sm text-muted-foreground">Experiments</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{userModels.length}</p>
                  <p className="text-sm text-muted-foreground">Models</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined {profileUser.createdAt.toLocaleDateString()}
              </div>
            </div>

            {!isOwnProfile && (
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                size="lg"
                onClick={handleFollow}
                className="gap-2"
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="experiments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="experiments" className="gap-2">
              <Beaker className="h-4 w-4" />
              Experiments ({userExperiments.length})
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Boxes className="h-4 w-4" />
              Models ({userModels.length})
            </TabsTrigger>
          </TabsList>

          {/* Experiments Tab */}
          <TabsContent value="experiments" className="space-y-4">
            {userExperiments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No experiments yet
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {userExperiments.map(exp => (
                  <Card key={exp.id} className="bg-gradient-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{exp.name}</CardTitle>
                          <CardDescription>
                            {exp.code} • {exp.config.interval} • {exp.config.symbol}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={exp.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {exp.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    {exp.results && (
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div>
                            <p className="font-semibold">{(exp.results.accuracy * 100).toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">Accuracy</p>
                          </div>
                          <div>
                            <p className="font-semibold text-success">{exp.results.sharpe.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Sharpe</p>
                          </div>
                          <div>
                            <p className="font-semibold">{exp.results.totalReturn.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Return</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-4">
            {userModels.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No models yet
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {userModels.map(model => (
                  <Card key={model.id} className="bg-gradient-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{model.modelName}</CardTitle>
                          <CardDescription>{model.code}</CardDescription>
                        </div>
                        <Badge variant="outline">{model.blueprintType}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-2 text-center text-sm">
                        <div>
                          <p className="font-semibold">{(model.metrics.testAccuracy * 100).toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                        <div>
                          <p className="font-semibold text-success">{model.metrics.sharpe.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Sharpe</p>
                        </div>
                        <div>
                          <p className="font-semibold">{model.metrics.totalReturn.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Return</p>
                        </div>
                        <div>
                          <p className="font-semibold">{(model.metrics.winRate * 100).toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <Link href={`/models/${model.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
