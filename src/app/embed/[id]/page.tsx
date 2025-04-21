'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Question } from '@/types';

// Check if types.ts exists, if not we'll create it later
interface Quiz {
  id: string;
  name: string;
  questions: Question[];
  totalQuestions: number;
}

// Client component that receives the resolved ID
function EmbedQuizClient({ id }: { id: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/public/embed/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load quiz');
        }
        
        const data = await response.json();
        
        // Parse the questions JSON if it's a string
        if (typeof data.quiz.questions === 'string') {
          data.quiz.questions = JSON.parse(data.quiz.questions);
        }
        
        // Convert answers to options if needed for backward compatibility
        data.quiz.questions = data.quiz.questions.map((q: any) => {
          if (q.answers && !q.options) {
            return {
              ...q,
              options: q.answers
            };
          }
          return q;
        });
        
        setQuiz(data.quiz);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setError('Unable to load this quiz. It may have been removed or is not available for embedding.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();

    // Start the timer
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    setTimer(interval);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [id]);

  const handleAnswerSelect = (answer: string) => {
    if (isAnswerCorrect !== null) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!selectedAnswer || !quiz) return;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    
    setIsAnswerCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    // Move to next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < (quiz.questions?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsAnswerCorrect(null);
      } else {
        setQuizComplete(true);
        if (timer) clearInterval(timer);
      }
    }, 1500);
  };

  const skipQuestion = () => {
    if (!quiz) return;
    if (currentQuestionIndex < (quiz.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
    } else {
      setQuizComplete(true);
      if (timer) clearInterval(timer);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setScore(0);
    setQuizComplete(false);
    setTimeSpent(0);
    
    // Restart the timer
    if (timer) clearInterval(timer);
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    setTimer(interval);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex flex-col items-center justify-center text-white p-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4">Quiz Not Available</h1>
        <p className="text-center max-w-md">{error}</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex flex-col items-center justify-center text-white p-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
        <p className="text-center max-w-md">The requested quiz could not be loaded.</p>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl w-full">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Quiz Complete!
          </h2>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{score}</div>
                <div className="text-sm text-gray-500">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{quiz.questions.length}</div>
                <div className="text-sm text-gray-500">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round((score / quiz.questions.length) * 100)}%
                </div>
                <div className="text-sm text-gray-500">Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-500">Time Spent</div>
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={restartQuiz}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-700 
                     text-white rounded-lg font-semibold transition-all duration-200 
                     hover:from-blue-600 hover:to-blue-800 active:opacity-90"
          >
            Restart Quiz
          </motion.button>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>This quiz is powered by <span className="font-medium">QuizMe</span></p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl w-full">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm font-medium text-gray-500">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>
          <div className="text-sm font-medium text-gray-500">
            Score: {score}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {currentQuestion.question}
        </h2>
        
        <div className="space-y-3 mb-6">
          {currentQuestion.options && currentQuestion.options.map((option: string, index: number) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                selectedAnswer === option 
                  ? isAnswerCorrect === null
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : isAnswerCorrect
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-red-100 border-2 border-red-500'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              } ${
                isAnswerCorrect !== null && option === currentQuestion.correctAnswer
                  ? 'bg-green-100 border-2 border-green-500'
                  : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                  selectedAnswer === option
                    ? isAnswerCorrect === null
                      ? 'bg-blue-500 text-white'
                      : isAnswerCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                } ${
                  isAnswerCorrect !== null && option === currentQuestion.correctAnswer
                    ? 'bg-green-500 text-white'
                    : ''
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{option}</span>
              </div>
            </motion.button>
          ))}
        </div>
        
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={skipQuestion}
            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium
                     transition-all duration-200 hover:bg-gray-200 active:bg-gray-300"
          >
            Skip
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={checkAnswer}
            disabled={!selectedAnswer || isAnswerCorrect !== null}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold
                     transition-all duration-200 ${
                       !selectedAnswer || isAnswerCorrect !== null
                         ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                         : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 active:opacity-90'
                     }`}
          >
            Check Answer
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// Server component wrapper that handles the params Promise
export default async function EmbedQuiz(props: { params: Promise<{ id: string }> }) {
  // In Next.js 15, we need to handle params as a Promise
  const { id } = await props.params;
  return <EmbedQuizClient id={id} />;
}
