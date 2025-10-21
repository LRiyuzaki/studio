
'use client';
import AddQuizDialog from "@/components/add-quiz-dialog";
import ProfileHeader from "@/components/profile-header";
import QuizLibrary from "@/components/quiz-library";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Quiz } from "@/lib/types";

interface ProfilePageProps {
    quizzes: Quiz[];
    onQuizAdded: (quiz: Quiz) => void;
    onSelectQuiz: (quizId: string) => void;
    onDeleteQuiz: (quizId: string) => void;
}


export default function ProfilePage({ quizzes, onQuizAdded, onSelectQuiz, onDeleteQuiz }: ProfilePageProps) {

    return (
        <div className="w-full">
            <ProfileHeader />

            <main className="container mx-auto py-8 px-4 md:px-6">
                <div className="flex justify-between items-center mb-6">
                    <Tabs defaultValue="courses" className="w-full">
                        <div className="flex justify-between items-center border-b">
                            <TabsList>
                                <TabsTrigger value="courses">Courses</TabsTrigger>
                                <TabsTrigger value="certificates">Certificates</TabsTrigger>
                                <TabsTrigger value="cart">Cart</TabsTrigger>
                                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                            </TabsList>
                             <AddQuizDialog onQuizAdded={onQuizAdded} />
                        </div>
                        <TabsContent value="courses" className="mt-6">
                           <QuizLibrary quizzes={quizzes} onSelectQuiz={onSelectQuiz} onDeleteQuiz={onDeleteQuiz} onQuizAdded={onQuizAdded} />
                        </TabsContent>
                        <TabsContent value="certificates">
                            <div className="text-center py-20">
                                <p className="text-muted-foreground">No certificates earned yet.</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="cart">
                            <div className="text-center py-20">
                                <p className="text-muted-foreground">Your cart is empty.</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="purchases">
                            <div className="text-center py-20">
                                <p className="text-muted-foreground">You have not made any purchases.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

            </main>
        </div>
    )
}
