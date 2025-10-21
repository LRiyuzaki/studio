import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Home, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizHeaderProps {
    correctAnswers: number;
    incorrectAnswers: number;
    progress: number;
    currentIndex: number;
    totalQuestions: number;
    onExit: () => void;
    timerEnabled: boolean;
    timeLeft?: number;
}

export default function QuizHeader({ correctAnswers, incorrectAnswers, progress, currentIndex, totalQuestions, onExit, timerEnabled, timeLeft }: QuizHeaderProps) {
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return (
        <header className="space-y-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Button onClick={onExit} variant="outline" size="sm">
                        <Home className="w-4 h-4 mr-2" />
                        Dashboard
                    </Button>
                </div>
                <div className="flex gap-4">
                    {timerEnabled && timeLeft !== undefined && (
                        <div className={cn(
                            "flex items-center gap-1 font-semibold",
                            timeLeft <= 10 && "text-destructive"
                            )}>
                            <Timer className="w-5 h-5" />
                            <span>{formatTime(timeLeft)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 font-semibold text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{correctAnswers} Correct</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span>{incorrectAnswers} Incorrect</span>
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
