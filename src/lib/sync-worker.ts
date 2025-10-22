
import { db } from './db';
import { generateNewQuiz } from './actions';
import { toast } from '@/hooks/use-toast';
import { groupQuestionsIntoUnits } from './quiz-parser';

const POLLING_INTERVAL = 5000; // 5 seconds

/**
 * The main worker function that processes the sync queue.
 */
async function processQueue() {
  const pendingRequests = await db.syncQueue.where('status').equals('QUEUED').toArray();

  if (pendingRequests.length === 0) {
    return; // Nothing to process
  }

  for (const request of pendingRequests) {
    try {
      // Mark as syncing to prevent reprocessing
      await db.syncQueue.update(request.id!, { status: 'SYNCING' });

      console.log(`Processing generation request for quiz: ${request.quiz.name}`);

      const generatedQuiz = await generateNewQuiz({
        sourceText: request.quiz.sourceText || '',
        quizId: request.quiz.id,
        quizName: request.quiz.name,
      });

      // Update the local quiz with the generated data
      await db.quizzes.update(request.quiz.id, {
        questions: generatedQuiz.questions,
        units: groupQuestionsIntoUnits(generatedQuiz.questions),
        status: 'SYNCED',
      });
      
      console.log(`Successfully generated quiz: ${request.quiz.name}`);
      toast({
        title: 'Quiz Ready!',
        description: `Your quiz "${request.quiz.name}" has been generated.`,
      });


      // Remove the completed request from the queue
      await db.syncQueue.delete(request.id!);

    } catch (error) {
      console.error(`Failed to process generation request for quiz: ${request.quiz.name}`, error);
      await db.syncQueue.update(request.id!, { status: 'FAILED' });
       await db.quizzes.update(request.quiz.id, {
        status: 'FAILED',
      });
       toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: `Could not generate the quiz "${request.quiz.name}".`,
      });
    }
  }
}

let intervalId: NodeJS.Timeout | null = null;

/**
 * Starts the sync worker.
 * @returns A worker object with a `terminate` method.
 */
export function startSyncWorker() {
  if (intervalId) {
    // Worker is already running
    return {
      terminate: () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      },
    };
  }

  // Immediately process the queue on start, then set up polling
  processQueue();
  intervalId = setInterval(processQueue, POLLING_INTERVAL);

  console.log('Sync worker started.');

  return {
    terminate: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('Sync worker terminated.');
      }
    },
  };
}
