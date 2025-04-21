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

export default function EmbedQuiz({ params }: { params: { id: string } }) {
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
        const response = await fetch(`/api/public/embed/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to load quiz');
        }
        
        const data = await response.json();
        
        // Parse the questions JSON if it's a string
        if (typeof data.quiz.questions === 'string') {
          data.quiz.questions = JSON.parse(data.quiz.questions);
        }
        
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
  }, [params.id]);

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
      if (currentQuestionIndex < quiz.questions.length - 1) {
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
    if (currentQuestionIndex < quiz?.questions.length - 1) {
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
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
        <p className="text-center max-w-md">We couldn't find the quiz you're looking for.</p>
      </div>
    );
  }

  if (quizComplete) {
    const percentageCorrect = Math.round((score / quiz.questions.length) * 100);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    
    // Determine performance message
    let performanceMessage = "Keep practicing!";
    let emoji = "💪";
    
    if (percentageCorrect >= 90) {
      performanceMessage = "Outstanding!";
      emoji = "🏆";
    } else if (percentageCorrect >= 70) {
      performanceMessage = "Great job!";
      emoji = "🌟";
    } else if (percentageCorrect >= 50) {
      performanceMessage = "Good effort!";
      emoji = "👍";
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <div className="text-6xl animate-bounce">
                {emoji}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {performanceMessage}
              </h2>
              <p className="text-gray-600">
                You've completed the quiz! Here's how you did:
              </p>
            </div>
            
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200 stroke-current"
                  strokeWidth="10"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-blue-600 stroke-current"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                  strokeDasharray={`${percentageCorrect * 2.51327} 251.327`}
                  transform="rotate(-90 50 50)"
                />
                <text
                  x="50"
                  y="50"
                  className="text-2xl font-bold"
                  textAnchor="middle"
                  dy="9"
                  fill="#1a1a1a"
                >
                  {percentageCorrect}%
                </text>
              </svg>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xl font-bold text-green-600">
                  {score}
                </div>
                <div className="text-sm text-gray-600">
                  Correct Answers
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xl font-bold text-purple-600">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">
                  Time Spent
                </div>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restartQuiz}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg font-semibold
                       transition-all duration-200 hover:from-blue-600 hover:to-blue-800 active:opacity-90"
            >
              Try Again
            </motion.button>
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
          {currentQuestion.answers.map((answer, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswerSelect(answer)}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                selectedAnswer === answer 
                  ? isAnswerCorrect === null
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : isAnswerCorrect
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-red-100 border-2 border-red-500'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              } ${
                isAnswerCorrect !== null && answer === currentQuestion.correctAnswer
                  ? 'bg-green-100 border-2 border-green-500'
                  : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                  selectedAnswer === answer
                    ? isAnswerCorrect === null
                      ? 'bg-blue-500 text-white'
                      : isAnswerCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                } ${
                  isAnswerCorrect !== null && answer === currentQuestion.correctAnswer
                    ? 'bg-green-500 text-white'
                    : ''
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{answer}</span>
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
