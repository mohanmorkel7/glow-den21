import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings as SettingsIcon, 
  User,
  Building2,
  Shield,
  Database,
  Mail,
  Bell,
  Palette,
  Globe,
  Save,
  RefreshCw,
  Download,
  Upload,
  Key,
  Lock,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
  Timer,
  Zap,
  DollarSign,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  workingHours: {
    start: string;
    end: string;
  };
  // Daily update configuration
  dailyUpdateTime: string;
  dailyUpdateTimezone: string;
  autoUpdateEnabled: boolean;
  usdToInrRate: number;
}

interface SystemSettings {
  maxFileSize: number;
  sessionTimeout: number;
  backupFrequency: string;
  maintenanceMode: boolean;
  debugMode: boolean;
  apiRateLimit: number;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
}

interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireUppercase: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorEnabled: boolean;
  sessionSecurity: 'basic' | 'enhanced' | 'strict';
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
}

interface DailyUpdateSettings {
  autoUpdateEnabled: boolean;
  updateTime: string;
  timezone: string;
  usdToInrRate: number;
  reminderEnabled: boolean;
  reminderMinutes: number;
  notifyBeforeUpdate: boolean;
  allowManualOverride: boolean;
}

const mockCompanySettings: CompanySettings = {
  name: 'Web Syntactic Solutions',
  address: '123 Business Ave, Suite 100, Tech City, TC 12345',
  phone: '+1 (555) 123-4567',
  email: 'contact@websyntactic.com',
  website: 'https://websyntactic.com',
  timezone: 'America/New_York',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  workingHours: {
    start: '09:00',
    end: '17:00'
  },
  dailyUpdateTime: '20:00',
  dailyUpdateTimezone: 'Asia/Kolkata',
  autoUpdateEnabled: true,
  usdToInrRate: 83.00
};

const mockSystemSettings: SystemSettings = {
  maxFileSize: 50,
  sessionTimeout: 30,
  backupFrequency: 'daily',
  maintenanceMode: false,
  debugMode: false,
  apiRateLimit: 1000,
  allowRegistration: true,
  requireEmailVerification: true
};

const mockSecuritySettings: SecuritySettings = {
  passwordMinLength: 8,
  passwordRequireSpecialChars: true,
  passwordRequireNumbers: true,
  passwordRequireUppercase: true,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  twoFactorEnabled: false,
  sessionSecurity: 'enhanced'
};

const mockDailyUpdateSettings: DailyUpdateSettings = {
  autoUpdateEnabled: true,
  updateTime: '20:00',
  timezone: 'Asia/Kolkata',
  usdToInrRate: 83.00,
  reminderEnabled: true,
  reminderMinutes: 30,
  notifyBeforeUpdate: true,
  allowManualOverride: true
};

export default function Settings() {
  const { user: currentUser } = useAuth();

  // Only allow super admin to access settings
  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-600">Access Denied</h3>
          <p className="text-sm text-muted-foreground">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  const [companySettings, setCompanySettings] = useState<CompanySettings>(mockCompanySettings);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(mockSystemSettings);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(mockSecuritySettings);
  const [dailyUpdateSettings, setDailyUpdateSettings] = useState<DailyUpdateSettings>(mockDailyUpdateSettings);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    department: 'Operations',
    jobTitle: 'Administrator',
    theme: 'system',
    language: 'English',
    notifications: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const canManageSystem = currentUser?.role === 'super_admin';
  const canManageCompany = currentUser?.role === 'super_admin';

  const handleSaveCompanySettings = () => {
    console.log('Saving company settings:', companySettings);
  };

  const handleSaveSystemSettings = () => {
    console.log('Saving system settings:', systemSettings);
  };

  const handleSaveSecuritySettings = () => {
    console.log('Saving security settings:', securitySettings);
  };

  const handleSaveDailyUpdateSettings = () => {
    localStorage.setItem('usdToInrRate', String(dailyUpdateSettings.usdToInrRate));
    console.log('Saving daily update settings:', dailyUpdateSettings);
    alert('Conversion rate saved. Billing will use the updated ₹/USD value.');
  };

  const handleSaveUserProfile = () => {
    console.log('Saving user profile:', userProfile);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Changing password');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleTestAutoUpdate = () => {
    console.log('Testing auto-update configuration');
  };

  const convertToTimezone = (time: string, timezone: string) => {
    // Mock conversion for display
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleString('en-US', { 
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure application settings, daily updates, and preferences.
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="daily-updates">Daily Updates</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {userProfile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={userProfile.department} onValueChange={(value) => setUserProfile({ ...userProfile, department: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={userProfile.jobTitle}
                    onChange={(e) => setUserProfile({ ...userProfile, jobTitle: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveUserProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of your interface.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={userProfile.theme} onValueChange={(value: any) => setUserProfile({ ...userProfile, theme: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={userProfile.language} onValueChange={(value) => setUserProfile({ ...userProfile, language: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Español</SelectItem>
                        <SelectItem value="French">Français</SelectItem>
                        <SelectItem value="German">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Notifications</Label>
                      <p className="text-sm text-muted-foreground">Enable desktop notifications</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={userProfile.notifications}
                      onCheckedChange={(checked) => setUserProfile({ ...userProfile, notifications: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your account password for security.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button onClick={handleChangePassword} disabled={!newPassword || !confirmPassword}>
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-6">
          {!canManageCompany ? (
            <Card>
              <CardHeader>
                <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
                <CardTitle className="text-center">Access Denied</CardTitle>
                <CardDescription className="text-center">
                  You don't have permission to access Company Settings.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Manage your organization's basic information and settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companySettings.name}
                        onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={companySettings.website}
                        onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Phone</Label>
                      <Input
                        id="companyPhone"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Primary Timezone</Label>
                      <Select value={companySettings.timezone} onValueChange={(value) => setCompanySettings({ ...companySettings, timezone: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={companySettings.currency} onValueChange={(value) => setCompanySettings({ ...companySettings, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={companySettings.dateFormat} onValueChange={(value) => setCompanySettings({ ...companySettings, dateFormat: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workStart">Working Hours Start</Label>
                      <Input
                        id="workStart"
                        type="time"
                        value={companySettings.workingHours.start}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          workingHours: { ...companySettings.workingHours, start: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workEnd">Working Hours End</Label>
                      <Input
                        id="workEnd"
                        type="time"
                        value={companySettings.workingHours.end}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          workingHours: { ...companySettings.workingHours, end: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveCompanySettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Company Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Daily Updates Settings */}
        <TabsContent value="daily-updates" className="space-y-6">
          {!canManageCompany ? (
            <Card>
              <CardHeader>
                <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
                <CardTitle className="text-center">Access Denied</CardTitle>
                <CardDescription className="text-center">
                  You don't have permission to access Daily Update Settings.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Current Status Alert */}
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Daily auto-updates are currently {dailyUpdateSettings.autoUpdateEnabled ? 'enabled' : 'disabled'} and scheduled for{' '}
                  {convertToTimezone(dailyUpdateSettings.updateTime, dailyUpdateSettings.timezone)} ({dailyUpdateSettings.timezone}).
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5" />
                      Auto-Update Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure when daily file counts are automatically updated.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoUpdateEnabled">Enable Auto-Updates</Label>
                        <p className="text-sm text-muted-foreground">Automatically submit daily counts at scheduled time</p>
                      </div>
                      <Switch
                        id="autoUpdateEnabled"
                        checked={dailyUpdateSettings.autoUpdateEnabled}
                        onCheckedChange={(checked) => setDailyUpdateSettings({ ...dailyUpdateSettings, autoUpdateEnabled: checked })}
                      />
                    </div>
                    
                    {dailyUpdateSettings.autoUpdateEnabled && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="updateTime">Update Time</Label>
                            <Input
                              id="updateTime"
                              type="time"
                              value={dailyUpdateSettings.updateTime}
                              onChange={(e) => setDailyUpdateSettings({ ...dailyUpdateSettings, updateTime: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="updateTimezone">Timezone</Label>
                            <Select 
                              value={dailyUpdateSettings.timezone} 
                              onValueChange={(value) => setDailyUpdateSettings({ ...dailyUpdateSettings, timezone: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                                <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
                                <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                                <SelectItem value="Europe/Berlin">Central European Time (CET)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">Scheduled Update Time</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            Daily counts will be automatically submitted at{' '}
                            <strong>{convertToTimezone(dailyUpdateSettings.updateTime, dailyUpdateSettings.timezone)}</strong>{' '}
                            ({dailyUpdateSettings.timezone})
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allowManualOverride">Allow Manual Override</Label>
                            <p className="text-sm text-muted-foreground">Let users manually submit before auto-update</p>
                          </div>
                          <Switch
                            id="allowManualOverride"
                            checked={dailyUpdateSettings.allowManualOverride}
                            onCheckedChange={(checked) => setDailyUpdateSettings({ ...dailyUpdateSettings, allowManualOverride: checked })}
                          />
                        </div>
                      </>
                    )}

                    <Button onClick={handleTestAutoUpdate} variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Test Auto-Update
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Currency & Billing Settings
                    </CardTitle>
                    <CardDescription>
                      Configure currency conversion rates for billing calculations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="usdToInrRate">USD to INR Conversion Rate</Label>
                      <div className="relative">
                        <Input
                          id="usdToInrRate"
                          type="number"
                          step="0.01"
                          value={dailyUpdateSettings.usdToInrRate}
                          onChange={(e) => setDailyUpdateSettings({ ...dailyUpdateSettings, usdToInrRate: parseFloat(e.target.value) || 0 })}
                          placeholder="83.00"
                        />
                        <div className="absolute right-3 top-3 text-sm text-muted-foreground">
                          ₹ per $1
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Current rate: $1 USD = ₹{dailyUpdateSettings.usdToInrRate.toFixed(2)} INR
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Example Calculation</h4>
                      <div className="space-y-1 text-sm text-green-700">
                        <div className="flex justify-between">
                          <span>1,000 files @ $0.05/file:</span>
                          <span>$50.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Converted to INR:</span>
                          <span>₹{(50 * dailyUpdateSettings.usdToInrRate).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Fetch Live Exchange Rate
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Configure notifications for daily update reminders and alerts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reminderEnabled">Update Reminders</Label>
                      <p className="text-sm text-muted-foreground">Send reminder notifications before auto-update</p>
                    </div>
                    <Switch
                      id="reminderEnabled"
                      checked={dailyUpdateSettings.reminderEnabled}
                      onCheckedChange={(checked) => setDailyUpdateSettings({ ...dailyUpdateSettings, reminderEnabled: checked })}
                    />
                  </div>

                  {dailyUpdateSettings.reminderEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="reminderMinutes">Reminder Time (minutes before update)</Label>
                      <Select 
                        value={dailyUpdateSettings.reminderMinutes.toString()} 
                        onValueChange={(value) => setDailyUpdateSettings({ ...dailyUpdateSettings, reminderMinutes: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifyBeforeUpdate">Pre-Update Notifications</Label>
                      <p className="text-sm text-muted-foreground">Notify team members before automatic update</p>
                    </div>
                    <Switch
                      id="notifyBeforeUpdate"
                      checked={dailyUpdateSettings.notifyBeforeUpdate}
                      onCheckedChange={(checked) => setDailyUpdateSettings({ ...dailyUpdateSettings, notifyBeforeUpdate: checked })}
                    />
                  </div>

                  {dailyUpdateSettings.reminderEnabled && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Reminders will be sent {dailyUpdateSettings.reminderMinutes} minutes before the scheduled update time.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveDailyUpdateSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Daily Update Settings
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          {!canManageSystem ? (
            <Card>
              <CardHeader>
                <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
                <CardTitle className="text-center">Access Denied</CardTitle>
                <CardDescription className="text-center">
                  You don't have permission to access System Settings.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    System Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide settings and limits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        value={systemSettings.maxFileSize}
                        onChange={(e) => setSystemSettings({ ...systemSettings, maxFileSize: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={systemSettings.sessionTimeout}
                        onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select value={systemSettings.backupFrequency} onValueChange={(value) => setSystemSettings({ ...systemSettings, backupFrequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      value={systemSettings.apiRateLimit}
                      onChange={(e) => setSystemSettings({ ...systemSettings, apiRateLimit: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <Button onClick={handleSaveSystemSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save System Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Toggles</CardTitle>
                  <CardDescription>
                    Enable or disable various system features.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Put system in maintenance mode</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, maintenanceMode: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="debugMode">Debug Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable detailed error logging</p>
                    </div>
                    <Switch
                      id="debugMode"
                      checked={systemSettings.debugMode}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, debugMode: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowRegistration">Allow Registration</Label>
                      <p className="text-sm text-muted-foreground">Allow new user registration</p>
                    </div>
                    <Switch
                      id="allowRegistration"
                      checked={systemSettings.allowRegistration}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, allowRegistration: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireEmailVerification">Email Verification</Label>
                      <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                    </div>
                    <Switch
                      id="requireEmailVerification"
                      checked={systemSettings.requireEmailVerification}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, requireEmailVerification: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          {!canManageSystem ? (
            <Card>
              <CardHeader>
                <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
                <CardTitle className="text-center">Access Denied</CardTitle>
                <CardDescription className="text-center">
                  You don't have permission to access Security Settings.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Password Policy
                  </CardTitle>
                  <CardDescription>
                    Configure password requirements and security policies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="32"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) || 8 })}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                      <Switch
                        id="requireSpecialChars"
                        checked={securitySettings.passwordRequireSpecialChars}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireSpecialChars: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireNumbers">Require Numbers</Label>
                      <Switch
                        id="requireNumbers"
                        checked={securitySettings.passwordRequireNumbers}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireNumbers: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireUppercase">Require Uppercase</Label>
                      <Switch
                        id="requireUppercase"
                        checked={securitySettings.passwordRequireUppercase}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireUppercase: checked })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                      <Input
                        id="lockoutDuration"
                        type="number"
                        min="5"
                        max="60"
                        value={securitySettings.lockoutDuration}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDuration: parseInt(e.target.value) || 15 })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveSecuritySettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Advanced Security</CardTitle>
                  <CardDescription>
                    Configure advanced security features and session management.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                    </div>
                    <Switch
                      id="twoFactor"
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionSecurity">Session Security Level</Label>
                    <Select value={securitySettings.sessionSecurity} onValueChange={(value: any) => setSecuritySettings({ ...securitySettings, sessionSecurity: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="enhanced">Enhanced</SelectItem>
                        <SelectItem value="strict">Strict</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {securitySettings.sessionSecurity === 'basic' && 'Basic session validation'}
                      {securitySettings.sessionSecurity === 'enhanced' && 'Enhanced session validation with IP tracking'}
                      {securitySettings.sessionSecurity === 'strict' && 'Strict validation with device fingerprinting'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Integration
                </CardTitle>
                <CardDescription>
                  Configure email service for notifications and alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">SMTP Server</Label>
                  <Input
                    id="smtpServer"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Port</Label>
                    <Input
                      id="smtpPort"
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpSecurity">Security</Label>
                    <Select defaultValue="tls">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">Username</Label>
                  <Input
                    id="smtpUsername"
                    placeholder="your-email@domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <Button>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Backup, export, and import system data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <p><strong>Last Backup:</strong> January 15, 2024 at 2:00 AM</p>
                  <p><strong>Next Scheduled:</strong> January 16, 2024 at 2:00 AM</p>
                  <p><strong>Backup Size:</strong> 245 MB</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
