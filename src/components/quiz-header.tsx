import { Progress } from '@/components/ui/progress';
import { Flame, Star } from 'lucide-react';

interface QuizHeaderProps {
    xp: number;
    streak: number;
    progress: number;
    currentIndex: number;
    totalQuestions: number;
}

export default function QuizHeader({ xp, streak, progress, currentIndex, totalQuestions }: QuizHeaderProps) {
    return (
        <header className="space-y-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1 font-semibold">
                        <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                        <span>{xp} XP</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold">
                        <Flame className={`w-5 h-5 transition-colors ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        <span>{streak} Streak</span>
                    </div>
                </div>
                <div>
                    Question {currentIndex + 1} of {totalQuestions}
                </div>
            </div>
            <Progress value={progress} />
        </header>
    );
}
