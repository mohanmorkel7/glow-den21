import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/RichTextEditor';
import {
  PlayCircle,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Plus,
  Edit,
  Trash2,
  Upload,
  Search,
  Star,
  StarIcon,
  BookmarkIcon,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings
} from 'lucide-react';

// Import types
import type { 
  Tutorial, 
  TutorialCategory, 
  UserTutorialProgress,
  TutorialCategoryInfo,
  TUTORIAL_CATEGORIES 
} from '@/shared/tutorial-types';

const TUTORIAL_CATEGORIES_DATA: TutorialCategoryInfo[] = [
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Essential tutorials for new users to get up and running',
    icon: 'PlayCircle',
    color: '#3b82f6',
    order: 1,
    requiredForRoles: ['user', 'project_manager']
  },
  {
    id: 'daily_tasks',
    name: 'Daily Tasks',
    description: 'Learn how to perform common daily work activities',
    icon: 'CheckCircle',
    color: '#10b981',
    order: 2,
    requiredForRoles: ['user']
  },
  {
    id: 'projects',
    name: 'Project Management',
    description: 'Managing projects, assignments, and team coordination',
    icon: 'FileText',
    color: '#f59e0b',
    order: 3,
    requiredForRoles: ['project_manager']
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Understanding reports, analytics, and data insights',
    icon: 'Settings',
    color: '#8b5cf6',
    order: 4
  },
  {
    id: 'advanced',
    name: 'Advanced Features',
    description: 'Advanced functionality and power user features',
    icon: 'Settings',
    color: '#6b7280',
    order: 5
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and how to resolve them',
    icon: 'AlertCircle',
    color: '#ef4444',
    order: 6
  }
];

interface VideoPlayerProps {
  src?: string;
  title: string;
  onTimeUpdate?: (currentTime: number) => void;
  onProgress?: (progress: number) => void;
}

// Custom Video Player Component
function VideoPlayer({ src, title, onTimeUpdate, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      onTimeUpdate?.(current);
      
      const progress = (current / duration) * 100;
      onProgress?.(progress);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipForward = () => {
    handleSeek(Math.min(currentTime + 10, duration));
  };

  const skipBackward = () => {
    handleSeek(Math.max(currentTime - 10, 0));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {src ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-auto max-h-96"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBackward}
                  className="text-white hover:text-blue-400"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:text-blue-400"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipForward}
                  className="text-white hover:text-blue-400"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:text-blue-400"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:text-blue-400"
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-800">
          <div className="text-center text-gray-400">
            <PlayCircle className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg">No video available</p>
            <p className="text-sm">Upload a video to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Tutorial() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState<TutorialCategory | 'all'>('all');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploadVideoOpen, setIsUploadVideoOpen] = useState(false);

  // Mock data for tutorials
  const mockTutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Getting Started with the Platform',
      description: 'Learn the basics of navigating and using the BPO management platform',
      category: 'getting_started',
      status: 'published',
      videoUrl: undefined, // No video uploaded yet
      instructions: '<h2>Welcome to the Platform</h2><p>This tutorial will guide you through the basic features...</p>',
      steps: [
        {
          id: 'step1',
          stepNumber: 1,
          title: 'Login to your account',
          description: 'Enter your credentials and click sign in',
          isRequired: true
        },
        {
          id: 'step2',
          stepNumber: 2,
          title: 'Navigate the dashboard',
          description: 'Explore the main dashboard and its features',
          isRequired: true
        }
      ],
      targetRoles: ['user', 'project_manager'],
      isRequired: true,
      order: 1,
      tags: ['basics', 'navigation', 'dashboard'],
      createdBy: {
        id: 'admin',
        name: 'Admin User'
      },
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      viewCount: 245,
      completionCount: 198
    },
    {
      id: '2',
      title: 'Daily Count Submission',
      description: 'Learn how to submit your daily work counts and track progress',
      category: 'daily_tasks',
      status: 'published',
      videoUrl: '/api/videos/daily-counts-demo.mp4', // Mock video path
      instructions: '<h2>Submitting Daily Counts</h2><p>Follow these steps to submit your daily work...</p>',
      steps: [
        {
          id: 'step1',
          stepNumber: 1,
          title: 'Navigate to Daily Counts',
          description: 'Click on the Daily Counts menu item',
          isRequired: true
        },
        {
          id: 'step2',
          stepNumber: 2,
          title: 'Enter your counts',
          description: 'Fill in the number of files processed',
          isRequired: true
        },
        {
          id: 'step3',
          stepNumber: 3,
          title: 'Submit for approval',
          description: 'Click submit to send for manager approval',
          isRequired: true
        }
      ],
      targetRoles: ['user'],
      isRequired: true,
      order: 2,
      tags: ['daily', 'counts', 'submission'],
      createdBy: {
        id: 'admin',
        name: 'Admin User'
      },
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      viewCount: 189,
      completionCount: 156
    },
    {
      id: '3',
      title: 'Project Management Overview',
      description: 'Understanding how to manage projects and assign tasks to team members',
      category: 'projects',
      status: 'published',
      videoUrl: undefined,
      instructions: '<h2>Project Management</h2><p>As a project manager, you can create and manage projects...</p>',
      steps: [
        {
          id: 'step1',
          stepNumber: 1,
          title: 'Create a new project',
          description: 'Click the add project button and fill in details',
          isRequired: true
        },
        {
          id: 'step2',
          stepNumber: 2,
          title: 'Assign team members',
          description: 'Select users to assign to the project',
          isRequired: true
        }
      ],
      targetRoles: ['project_manager'],
      isRequired: true,
      order: 1,
      tags: ['projects', 'management', 'assignment'],
      createdBy: {
        id: 'pm1',
        name: 'Emily Wilson'
      },
      createdAt: '2024-01-16T00:00:00Z',
      updatedAt: '2024-01-16T00:00:00Z',
      viewCount: 78,
      completionCount: 45
    }
  ];

  // Filter tutorials based on role, category, and search
  const filteredTutorials = mockTutorials.filter(tutorial => {
    const matchesRole = tutorial.targetRoles.includes(user?.role || 'user');
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesRole && matchesCategory && matchesSearch;
  });

  // Get categories accessible to current user
  const availableCategories = TUTORIAL_CATEGORIES_DATA.filter(cat => 
    !cat.requiredForRoles || cat.requiredForRoles.includes(user?.role || 'user')
  );

  const handleTutorialSelect = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setActiveTab('watch');
  };

  const canManageTutorials = user?.role === 'super_admin' || user?.role === 'project_manager';

  const getCategoryIcon = (category: TutorialCategory) => {
    const categoryInfo = TUTORIAL_CATEGORIES_DATA.find(cat => cat.id === category);
    switch (categoryInfo?.icon) {
      case 'PlayCircle': return <PlayCircle className="h-5 w-5" />;
      case 'CheckCircle': return <CheckCircle className="h-5 w-5" />;
      case 'FileText': return <FileText className="h-5 w-5" />;
      case 'Settings': return <Settings className="h-5 w-5" />;
      case 'AlertCircle': return <AlertCircle className="h-5 w-5" />;
      default: return <PlayCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <PlayCircle className="h-8 w-8 text-blue-600" />
            Training Tutorials
          </h1>
          <p className="text-muted-foreground mt-1">
            Learn how to use the platform with step-by-step video tutorials and guides
          </p>
        </div>
        {canManageTutorials && (
          <div className="flex gap-2">
            <Button onClick={() => setIsUploadVideoOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tutorial
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Tutorials</TabsTrigger>
          <TabsTrigger value="watch">Watch Tutorial</TabsTrigger>
          {canManageTutorials && <TabsTrigger value="manage">Manage Tutorials</TabsTrigger>}
        </TabsList>

        {/* Browse Tutorials Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as TutorialCategory | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCategories.map((category) => {
              const categoryTutorials = filteredTutorials.filter(t => t.category === category.id);
              const completedCount = Math.floor(categoryTutorials.length * 0.7); // Mock completion

              return (
                <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => setSelectedCategory(category.id)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div 
                        className="p-2 rounded-lg text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {getCategoryIcon(category.id)}
                      </div>
                      {category.name}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{categoryTutorials.length} tutorials</span>
                      <span>{completedCount} completed</span>
                    </div>
                    <Progress value={(completedCount / categoryTutorials.length) * 100} className="mt-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tutorials List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              {selectedCategory === 'all' ? 'All Tutorials' : 
               availableCategories.find(cat => cat.id === selectedCategory)?.name}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTutorials.map((tutorial) => (
                <Card key={tutorial.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {tutorial.title}
                          {tutorial.isRequired && (
                            <Badge variant="secondary">Required</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {tutorial.description}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant="outline"
                        style={{ borderColor: TUTORIAL_CATEGORIES_DATA.find(cat => cat.id === tutorial.category)?.color }}
                      >
                        {TUTORIAL_CATEGORIES_DATA.find(cat => cat.id === tutorial.category)?.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {tutorial.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          {tutorial.completionCount} completed
                        </span>
                        {tutorial.videoDuration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.ceil(tutorial.videoDuration / 60)} min
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleTutorialSelect(tutorial)} className="flex-1">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {tutorial.videoUrl ? 'Watch Tutorial' : 'View Instructions'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <BookmarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Watch Tutorial Tab */}
        <TabsContent value="watch" className="space-y-6">
          {selectedTutorial ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player Section */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedTutorial.title}</CardTitle>
                    <CardDescription>{selectedTutorial.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VideoPlayer 
                      src={selectedTutorial.videoUrl}
                      title={selectedTutorial.title}
                      onTimeUpdate={(time) => {
                        // Track video progress for analytics
                        console.log('Video time:', time);
                      }}
                      onProgress={(progress) => {
                        // Update user progress
                        console.log('Video progress:', progress);
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Tutorial Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedTutorial.instructions }}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Steps and Progress Section */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tutorial Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTutorial.steps.map((step, index) => (
                        <div key={step.id} className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                              {step.stepNumber}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{step.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                            {step.isRequired && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Progress and Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Completion</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} />
                    </div>
                    
                    <div className="space-y-2">
                      <Button className="w-full">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </Button>
                      <Button variant="outline" className="w-full">
                        <BookmarkIcon className="h-4 w-4 mr-2" />
                        Bookmark Tutorial
                      </Button>
                    </div>

                    {/* Rating */}
                    <div className="pt-4 border-t">
                      <Label className="text-sm font-medium">Rate this tutorial</Label>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            variant="ghost"
                            size="sm"
                            className="p-0 h-6 w-6"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <PlayCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-muted-foreground">No tutorial selected</h3>
                <p className="text-sm text-muted-foreground">Choose a tutorial from the browse tab to start learning</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Manage Tutorials Tab (Admin/PM only) */}
        {canManageTutorials && (
          <TabsContent value="manage" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Manage Tutorials</h3>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              </div>
            </div>

            {/* Tutorials Management Table */}
            <Card>
              <CardContent className="p-0">
                <div className="space-y-4 p-6">
                  {mockTutorials.map((tutorial) => (
                    <div key={tutorial.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{tutorial.title}</h4>
                        <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">
                            {TUTORIAL_CATEGORIES_DATA.find(cat => cat.id === tutorial.category)?.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tutorial.viewCount} views • {tutorial.completionCount} completed
                          </span>
                          <Badge variant={tutorial.status === 'published' ? 'default' : 'secondary'}>
                            {tutorial.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Create Tutorial Dialog (placeholder) */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Tutorial</DialogTitle>
            <DialogDescription>Create a new training tutorial for your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tutorial Title</Label>
              <Input id="title" placeholder="Enter tutorial title" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Brief description of the tutorial" />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TUTORIAL_CATEGORIES_DATA.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(false)}>
              Create Tutorial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Video Dialog (placeholder) */}
      <Dialog open={isUploadVideoOpen} onOpenChange={setIsUploadVideoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Tutorial Video</DialogTitle>
            <DialogDescription>Upload a video file for an existing tutorial</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tutorial-select">Select Tutorial</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tutorial" />
                </SelectTrigger>
                <SelectContent>
                  {mockTutorials.map((tutorial) => (
                    <SelectItem key={tutorial.id} value={tutorial.id}>
                      {tutorial.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="video-file">Video File</Label>
              <Input id="video-file" type="file" accept="video/*" />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: MP4, AVI, MOV. Max size: 500MB
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadVideoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsUploadVideoOpen(false)}>
              Upload Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
