import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface StatCardProps {
    value: string;
    label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
    return (
        <Card className="text-center p-6">
            <div className="text-4xl font-bold text-primary">{value}</div>
            <div className="text-muted-foreground mt-2">{label}</div>
        </Card>
    )
}
