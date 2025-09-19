import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Shield,
} from "lucide-react";

interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  joinDate: string;
}

export default function Profile() {
  const { user: currentUser } = useAuth();

  const [profileData, setProfileData] = useState<UserProfileData>({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "+1 (555) 123-4567",
    department:
      currentUser?.role === "super_admin"
        ? "Administration"
        : currentUser?.role === "project_manager"
          ? "Project Management"
          : "Operations",
    jobTitle:
      currentUser?.role === "super_admin"
        ? "System Administrator"
        : currentUser?.role === "project_manager"
          ? "Project Manager"
          : "Data Processor",
    joinDate: "2024-01-15",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileUpdateMessage, setProfileUpdateMessage] = useState("");
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState("");

  const isAdmin = currentUser?.role === "super_admin";
  const canEditProfile = isAdmin;

  const handleProfileUpdate = async () => {
    try {
      const payload: any = {
        name: profileData.name,
        phone: profileData.phone,
        department: profileData.department,
        jobTitle: profileData.jobTitle,
      };
      // Email changes typically require verification; skip here
      const updated = await apiClient.updateUser(currentUser!.id, payload);
      setProfileUpdateMessage("Profile updated successfully!");
      // Update local storage user snapshot for immediate UI consistency
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          const next = { ...u, ...payload };
          localStorage.setItem("user", JSON.stringify(next));
        }
      } catch {}
    } catch (e: any) {
      setProfileUpdateMessage(e?.message || "Failed to update profile");
    } finally {
      setTimeout(() => setProfileUpdateMessage(""), 3000);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordUpdateMessage("New passwords do not match!");
      setTimeout(() => setPasswordUpdateMessage(""), 3000);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordUpdateMessage("Password must be at least 8 characters long");
      setTimeout(() => setPasswordUpdateMessage(""), 3000);
      return;
    }

    try {
      await apiClient.changePassword(
        currentUser!.id,
        passwordData.currentPassword,
        passwordData.newPassword,
      );
      setPasswordUpdateMessage("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (e: any) {
      setPasswordUpdateMessage(e?.message || "Failed to update password");
    } finally {
      setTimeout(() => setPasswordUpdateMessage(""), 3000);
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordUpdateMessage("");
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile information and account settings.
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {currentUser.role.replace("_", " ")}
        </Badge>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {currentUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{currentUser.name}</CardTitle>
              <CardDescription className="text-base">
                {currentUser.email}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="capitalize">
                  <Shield className="h-3 w-3 mr-1" />
                  {currentUser.role.replace("_", " ")}
                </Badge>
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  Joined {new Date(profileData.joinDate).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="security">Security & Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                {canEditProfile
                  ? "Update your personal details and contact information."
                  : "View your profile information. Contact your administrator to make changes."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileUpdateMessage && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{profileUpdateMessage}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    disabled={!canEditProfile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className="pl-10"
                      disabled={!canEditProfile}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="pl-10"
                      disabled={!canEditProfile}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        department: e.target.value,
                      })
                    }
                    disabled={!canEditProfile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={profileData.jobTitle}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        jobTitle: e.target.value,
                      })
                    }
                    disabled={!canEditProfile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={profileData.joinDate}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        joinDate: e.target.value,
                      })
                    }
                    disabled={!canEditProfile}
                  />
                </div>
              </div>

              {canEditProfile && (
                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}

              {!canEditProfile && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You don't have permission to edit profile information.
                    Contact your administrator to make changes.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure. Use a strong
                password with at least 6 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {passwordUpdateMessage && (
                <Alert
                  className={
                    passwordUpdateMessage.includes("successfully")
                      ? ""
                      : "border-red-200"
                  }
                >
                  {passwordUpdateMessage.includes("successfully") ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription
                    className={
                      passwordUpdateMessage.includes("successfully")
                        ? ""
                        : "text-red-600"
                    }
                  >
                    {passwordUpdateMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button variant="outline" onClick={resetPasswordForm}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword
                  }
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Password Requirements:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>At least 6 characters long</li>
                    <li>Must enter current password for verification</li>
                    <li>New password and confirmation must match</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and security information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Type</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {currentUser.role.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Login</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()} at{" "}
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {currentUser.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
