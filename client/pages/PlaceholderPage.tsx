import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4">
            {Icon ? (
              <Icon className="h-16 w-16 mx-auto text-muted-foreground" />
            ) : (
              <Construction className="h-16 w-16 mx-auto text-muted-foreground" />
            )}
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This module is currently under development. Continue prompting to help us build out this section!
            </p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
              <p className="text-xs text-muted-foreground">
                Want this page built? Just ask in the chat!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
