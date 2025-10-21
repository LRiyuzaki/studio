'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  Icon?: LucideIcon;
  disabled?: boolean;
}

export function StatCard({ label, value, Icon, disabled }: StatCardProps) {
  return (
    <Card className={disabled ? 'cursor-not-allowed opacity-50' : 'transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
