import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Bell, 
  Plus, 
  Search, 
  Send,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'project' | 'user' | 'deadline';
  recipients: string[];
  isRead: boolean;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  categories: {
    [key: string]: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Daily Target Warning',
    message: '3 users are below today\'s target completion rate. Immediate attention required.',
    type: 'warning',
    category: 'user',
    recipients: ['all_managers'],
    isRead: false,
    createdAt: '2024-01-15T09:30:00Z',
    createdBy: 'System',
    expiresAt: '2024-01-15T18:00:00Z'
  },
  {
    id: '2',
    title: 'Project Completed Successfully',
    message: 'Invoice Processing System project has been completed ahead of schedule with 100% accuracy.',
    type: 'success',
    category: 'project',
    recipients: ['all_users'],
    isRead: true,
    createdAt: '2024-01-15T08:15:00Z',
    createdBy: 'Emily Wilson'
  },
  {
    id: '3',
    title: 'System Maintenance Notice',
    message: 'Scheduled maintenance will occur tonight from 11 PM to 2 AM. System will be temporarily unavailable.',
    type: 'info',
    category: 'system',
    recipients: ['all_users'],
    isRead: false,
    createdAt: '2024-01-14T16:45:00Z',
    createdBy: 'Super Admin'
  },
  {
    id: '4',
    title: 'Deadline Approaching',
    message: 'Data Entry Project Alpha deadline is in 2 days. Current completion: 85%',
    type: 'warning',
    category: 'deadline',
    recipients: ['project_team_1'],
    isRead: true,
    createdAt: '2024-01-14T14:20:00Z',
    createdBy: 'John Smith'
  },
  {
    id: '5',
    title: 'New User Registration',
    message: 'New team member Alex Thompson has joined the Data Entry team.',
    type: 'info',
    category: 'user',
    recipients: ['all_managers'],
    isRead: false,
    createdAt: '2024-01-14T11:30:00Z',
    createdBy: 'Super Admin'
  }
];

const mockSettings: NotificationSettings = {
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: false,
  categories: {
    system: { email: true, push: true, sms: false },
    project: { email: true, push: true, sms: false },
    user: { email: true, push: false, sms: false },
    deadline: { email: true, push: true, sms: true }
  }
};

export default function Notifications() {
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [settings, setSettings] = useState<NotificationSettings>(mockSettings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    category: 'system' as const,
    recipients: 'all_users' as string,
    expiresAt: ''
  });

  const canManageNotifications = currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager';

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    
    // Users can only see notifications relevant to them
    if (currentUser?.role === 'user') {
      return matchesSearch && matchesCategory && matchesType && 
             (notification.recipients.includes('all_users') || 
              notification.recipients.includes(currentUser.id));
    }
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleCreateNotification = () => {
    const notification: Notification = {
      id: (notifications.length + 1).toString(),
      ...newNotification,
      recipients: [newNotification.recipients],
      isRead: false,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Unknown'
    };
    
    setNotifications([notification, ...notifications]);
    setNewNotification({
      title: '',
      message: '',
      type: 'info',
      category: 'system',
      recipients: 'all_users',
      expiresAt: ''
    });
    setIsCreateDialogOpen(false);
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-orange-100 text-orange-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'project': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-purple-100 text-purple-800';
      case 'deadline': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Manage email alerts and in-app notifications.
          </p>
        </div>
        <div className="flex gap-2">
          {canManageNotifications && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Send New Notification</DialogTitle>
                  <DialogDescription>
                    Create and send a notification to users.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                      placeholder="Notification title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                      placeholder="Notification message content"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={newNotification.type} onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={newNotification.category} onValueChange={(value: any) => setNewNotification({ ...newNotification, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients</Label>
                    <Select value={newNotification.recipients} onValueChange={(value) => setNewNotification({ ...newNotification, recipients: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_users">All Users</SelectItem>
                        <SelectItem value="all_managers">All Managers</SelectItem>
                        <SelectItem value="project_team_1">Project Team Alpha</SelectItem>
                        <SelectItem value="project_team_2">Project Team Beta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires">Expires At (Optional)</Label>
                    <Input
                      id="expires"
                      type="datetime-local"
                      value={newNotification.expiresAt}
                      onChange={(e) => setNewNotification({ ...newNotification, expiresAt: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNotification} disabled={!newNotification.title || !newNotification.message}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => 
                new Date(n.createdAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {notifications.filter(n => n.type === 'warning').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings.emailEnabled ? <Volume2 className="h-6 w-6 text-green-600" /> : <VolumeX className="h-6 w-6 text-red-600" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications ({filteredNotifications.length})</CardTitle>
              <CardDescription>
                Stay updated with the latest alerts and messages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className={getTypeBadgeColor(notification.type)}>
                          {notification.type.toUpperCase()}
                        </Badge>
                        <Badge className={getCategoryBadgeColor(notification.category)}>
                          {notification.category.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-muted-foreground">
                          by {notification.createdBy}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        {notification.expiresAt && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-orange-600 text-xs">
                              <Clock className="inline h-3 w-3 mr-1" />
                              Expires {new Date(notification.expiresAt).toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        {canManageNotifications && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this notification? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteNotification(notification.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredNotifications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications found matching your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications across different channels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Global Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Global Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-global">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-global"
                      checked={settings.emailEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-global">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                    <Switch
                      id="push-global"
                      checked={settings.pushEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, pushEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-global">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      id="sms-global"
                      checked={settings.smsEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, smsEnabled: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Category Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Category Preferences</h4>
                <div className="space-y-4">
                  {Object.entries(settings.categories).map(([category, prefs]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3 capitalize">{category.replace('_', ' ')} Notifications</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${category}-email`} className="text-sm">Email</Label>
                          <Switch
                            id={`${category}-email`}
                            checked={prefs.email}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              categories: {
                                ...settings.categories,
                                [category]: { ...prefs, email: checked }
                              }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${category}-push`} className="text-sm">Push</Label>
                          <Switch
                            id={`${category}-push`}
                            checked={prefs.push}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              categories: {
                                ...settings.categories,
                                [category]: { ...prefs, push: checked }
                              }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${category}-sms`} className="text-sm">SMS</Label>
                          <Switch
                            id={`${category}-sms`}
                            checked={prefs.sms}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              categories: {
                                ...settings.categories,
                                [category]: { ...prefs, sms: checked }
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button>Save Notification Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
