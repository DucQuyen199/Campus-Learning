import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  AlertTitle,
  CircularProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Badge,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Timer,
  Warning,
  FullscreenExit,
  Fullscreen,
  Check,
  Person,
  CheckCircle,
  Cancel,
  ArrowBack,
  Save
} from '@mui/icons-material';
import {
  getExamById,
  startExam,
  submitAnswer,
  logFullscreenExit,
  logFullscreenReturn,
  completeExam,
  compareAnswerLocally,
  compareAnswer
} from '../../api/examApi';
import { getUserInfo } from '../../api/userApi';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import useFullscreen from '../../hooks/useFullscreen';

const ExamSession = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [startingExam, setStartingExam] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userData, setUserData] = useState(null);
  const fullscreenRef = useRef(null);
  const timerRef = useRef(null);
  const [retryCount, setRetryCount] = useState({});
  const MAX_RETRIES = 2;
  const RETRY_COOLDOWN = 2000; // 2 seconds between retries
  const [score, setScore] = useState(null);
  const [isGrading, setIsGrading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showGradingProgress, setShowGradingProgress] = useState(false);
  const [gradingProgress, setGradingProgress] = useState({ current: 0, total: 0, message: 'Chuẩn bị chấm điểm...' });
  
  // Add tab switching detection state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabSwitchWarningShown, setTabSwitchWarningShown] = useState(false);
  const [penalties, setPenalties] = useState({
    tabSwitch: 0,
    fullscreenExit: 0
  });
  const MAX_TAB_SWITCHES = 3; // Maximum allowed tab switches before severe penalty
  
  // Use our fullscreen hook with our ref
  const { isFullscreen: fullscreenState, enterFullscreen, exitFullscreen, toggleFullscreen: toggleFullscreenState } = useFullscreen(fullscreenRef);

  // Synchronize the hook's state with our local state
  useEffect(() => {
    setIsFullscreen(fullscreenState);
  }, [fullscreenState]);

  // Initialize exam session
  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);
        
        // Get user information with retry mechanism
        const fetchUserInfo = async (retries = 3) => {
          try {
            const userResponse = await getUserInfo();
            if (userResponse.success) {
              setUserData(userResponse.data);
              return true;
            }
            return false;
          } catch (err) {
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              return fetchUserInfo(retries - 1);
            }
            console.error('Error fetching user info:', err);
            return false;
          }
        };

        // Try to get user info first
        const userInfoSuccess = await fetchUserInfo();
        if (!userInfoSuccess) {
          // If we can't get user info, try to get it from localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUserData(parsedUser);
            } catch (e) {
              console.error('Error parsing stored user:', e);
            }
          }
        }
        
        // Get exam details
        const examResponse = await getExamById(examId);
        
        if (!examResponse.success) {
          throw new Error(examResponse.message || 'Failed to load exam');
        }
        
        // Deduplicate questions (in case API returns duplicates)
        const uniqueQuestionsMap = new Map();
        examResponse.data.questions.forEach(q => {
          if (!uniqueQuestionsMap.has(q.QuestionID)) {
            uniqueQuestionsMap.set(q.QuestionID, q);
          }
        });
        const uniqueExamData = {
          ...examResponse.data,
          questions: Array.from(uniqueQuestionsMap.values())
        };

        setExam(uniqueExamData);
        
        // Start exam session
        setStartingExam(true);
        const startResponse = await startExam(examId);
        
        if (!startResponse.success) {
          throw new Error(startResponse.message || 'Failed to start exam');
        }
        
        setParticipantId(startResponse.participantId);
        
        // Initialize answers object
        const initialAnswers = {};
        examResponse.data.questions.forEach(q => {
          initialAnswers[q.QuestionID] = '';
        });
        
        // Attempt to load existing answers for this participant
        try {
          console.log("Attempting to load existing answers for participant:", startResponse.participantId);
          const userAnswersResponse = await fetch(`/api/exams/participants/${startResponse.participantId}/answers`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          });
          
          if (userAnswersResponse.ok) {
            const userAnswersData = await userAnswersResponse.json();
            
            if (userAnswersData && userAnswersData.answers && userAnswersData.answers.length > 0) {
              console.log("Found existing answers:", userAnswersData.answers.length);
              
              // Update initialAnswers with saved values
              userAnswersData.answers.forEach(savedAnswer => {
                if (savedAnswer.QuestionID && savedAnswer.Answer) {
                  initialAnswers[savedAnswer.QuestionID] = savedAnswer.Answer;
                  console.log(`Loaded answer for question ${savedAnswer.QuestionID}`);
                }
              });
            } else {
              console.log("No existing answers found for this participant");
            }
          } else {
            console.warn("Could not retrieve existing answers:", userAnswersResponse.status);
            
            // Try alternative API format if first attempt fails
            try {
              const altResponse = await fetch(`/api/participants/${startResponse.participantId}/answers`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
              });
              
              if (altResponse.ok) {
                const altData = await altResponse.json();
                if (altData && altData.answers && altData.answers.length > 0) {
                  altData.answers.forEach(savedAnswer => {
                    if (savedAnswer.QuestionID && savedAnswer.Answer) {
                      initialAnswers[savedAnswer.QuestionID] = savedAnswer.Answer;
                    }
                  });
                }
              }
            } catch (error) {
              console.error("Alternative approach to get answers also failed:", error);
            }
          }
        } catch (error) {
          console.error("Error loading existing answers:", error);
          // Continue with empty answers - this is not fatal
        }
        
        // Set the answers state with initial values (empty or loaded from server)
        setAnswers(initialAnswers);
        
        // Set timer
        setTimeLeft(examResponse.data.Duration * 60); // Convert minutes to seconds
      } catch (err) {
        console.error('Error initializing exam:', err);
        
        // Create specific user-friendly message based on error type
        let errorMessage = 'Không thể khởi tạo kỳ thi';
        
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = 'Vui lòng đăng nhập lại để tiếp tục';
            // Redirect to login if token is invalid
            navigate('/login');
          } else if (err.response.status === 403) {
            errorMessage = 'Bạn không có quyền tham gia kỳ thi này';
          } else if (err.response.status === 404) {
            errorMessage = 'Không tìm thấy kỳ thi hoặc bạn chưa đăng ký';
          } else if (err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(`${errorMessage}. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.`);
      } finally {
        setLoading(false);
        setStartingExam(false);
      }
    };

    initExam();

    // Clean up timer when component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examId, navigate]);

  // Set up timer
  useEffect(() => {
    if (timeLeft !== null && !loading && participantId) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Time's up, submit exam automatically
            clearInterval(timerRef.current);
            handleSubmitExam();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, loading, participantId]);

  // Set up fullscreen detector
  useEffect(() => {
    const handleFullscreenChange = () => {
      // We don't need to set isFullscreen here anymore as the hook does it
      // But we still need to log exits and track exit count
      if (participantId) {
        if (fullscreenState) {
          // User returned to fullscreen
          logFullscreenReturn(participantId).catch(err => {
            console.error('Error logging fullscreen return:', err);
          });
        } else {
          // User exited fullscreen
          setFullscreenExitCount(prev => prev + 1);
          logFullscreenExit(participantId).catch(err => {
            console.error('Error logging fullscreen exit:', err);
          });
        }
      }
    };

    // We'll still need these to track exits for logging purposes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [participantId, fullscreenState]);

  // Auto enter fullscreen when the exam is loaded and ready
  useEffect(() => {
    // Only attempt to enter fullscreen when we have both the exam and participantId,
    // and we're not currently in fullscreen mode
    if (exam && participantId && !isFullscreen && fullscreenRef.current && !loading) {
      // Add a small delay to ensure the component is fully mounted
      const fullscreenTimer = setTimeout(() => {
        // Try to enter fullscreen mode automatically
        try {
          enterFullscreen()
            .catch(err => {
              console.error('Auto fullscreen failed:', err);
              // We'll rely on the warning alert if automatic fullscreen fails
            });
        } catch (error) {
          console.error('Auto fullscreen error:', error);
        }
      }, 500); // Small delay of 500ms
      
      return () => clearTimeout(fullscreenTimer);
    }
  }, [exam, participantId, isFullscreen, loading]);

  // Set up fullscreen listener to reapply if browser exits fullscreen
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !document.fullscreenElement) {
        // Try to re-enter fullscreen when tab becomes visible again
        attemptFullscreen();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [exam, participantId]);

  // Function to attempt entering fullscreen with better browser compatibility
  const attemptFullscreen = () => {
    if (!fullscreenRef.current) return;
    
    try {
      enterFullscreen();
    } catch (error) {
      console.error('Error attempting fullscreen:', error);
    }
  };

  // Format user name function
  const formatUserName = () => {
    if (!userData) return 'Không có thông tin';
    
    const name = userData.fullName || userData.FullName || userData.username || userData.Username || userData.name || '';
    const id = userData.id || userData.UserID || userData.userId || userData.studentId || '';
    
    if (name && id) {
      return `${name} (ID: ${id})`;
    } else if (name) {
      return name;
    } else if (id) {
      return `ID: ${id}`;
    } else {
      return 'Không có thông tin';
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = async () => {
    try {
      await toggleFullscreenState();
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSaveAnswer = async () => {
    const currentQuestion = exam.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const questionId = currentQuestion.QuestionID;
    // Create a unique key for this specific answer
    const answerKey = `${participantId}_${questionId}`;
    
    // Check if we're already at max retries for this question
    if (retryCount[answerKey] >= MAX_RETRIES) {
      console.log(`Max retries reached for question ${questionId}, skipping save`);
      return;
    }

    try {
      setSubmitting(true);
      await submitAnswer(participantId, questionId, answers[questionId]);
      
      // Reset retry count on success
      setRetryCount(prev => ({...prev, [answerKey]: 0}));
      
      // Show a brief success indicator in the UI state
      setSaveSuccess(true);
      // Hide the success indicator after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error saving answer:', err);
      
      // Check if this is a database constraint error (shouldn't retry these)
      const errorMessage = err.message || '';
      const isConstraintError = 
        errorMessage.includes('CHECK constraint') || 
        errorMessage.includes('conflicted with the');
      
      // Don't retry database constraint errors
      if (!isConstraintError && !err._isRetry) {
        // Increment retry count
        setRetryCount(prev => ({
          ...prev, 
          [answerKey]: (prev[answerKey] || 0) + 1
        }));
        
        // Wait longer between retries to avoid overwhelming the server
        setTimeout(() => {
          // Mark the error as a retry attempt
          err._isRetry = true;
          handleSaveAnswer();
        }, RETRY_COOLDOWN);
      } else {
        // If this was already a retry or a constraint error, log but don't show to user
        console.error('Failed to save answer, not retrying:', err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateQuestion = (index) => {
    // Save current answer before navigating
    handleSaveAnswer()
      .then(() => {
        setCurrentQuestionIndex(index);
      })
      .catch(err => {
        // If saving fails, still navigate but log the error
        console.error('Error saving answer before navigation:', err);
        // Continue with navigation anyway
        setCurrentQuestionIndex(index);
      });
  };

  const handleSubmitExam = async () => {
    try {
      setIsGrading(true);
      setConfirmEnd(false);
      
      console.log("Starting exam submission process");
      
      // Apply any penalties before submitting
      const penaltyDetails = {
        tabSwitches: tabSwitchCount,
        fullscreenExits: fullscreenExitCount,
        totalPenaltyPercentage: (penalties.tabSwitch * 5) + (penalties.fullscreenExit * 3)
      };
      
      console.log("Applying penalties:", penaltyDetails);
      
      // Show grading progress dialog immediately when submit button is clicked
      setGradingProgress({
        current: 0,
        total: (exam?.questions?.length || 1) + 1, // +1 for final submission
        message: 'Đang chuẩn bị nộp bài thi...'
      });
      setShowGradingProgress(true);
      
      // Handle missing exam data with recovery attempt
      if (!exam || !exam.questions) {
        console.warn("Exam data missing or incomplete, attempting to retrieve it");
        try {
          const examResponse = await getExamById(examId);
          if (examResponse.success) {
            setExam(examResponse.data);
            console.log("Successfully retrieved exam data");
          }
        } catch (err) {
          console.error("Failed to retrieve exam data:", err);
        }
      }
      
      // Handle missing participantId with recovery attempt
      if (!participantId) {
        console.warn("ParticipantID missing, attempting to retrieve it");
        try {
          const startResponse = await startExam(examId);
          if (startResponse.success) {
            setParticipantId(startResponse.participantId);
            console.log("Successfully retrieved participantId:", startResponse.participantId);
          }
        } catch (err) {
          console.error("Failed to retrieve participantId:", err);
        }
      }
      
      // Final check after recovery attempts
      const finalParticipantId = participantId || sessionStorage.getItem('examParticipantId');
      
      // Save all answers before submitting, not just the current one
      try {
        setGradingProgress(prev => ({
          ...prev,
          message: 'Đang lưu tất cả các câu trả lời...'
        }));
        
        // Save answers for all questions
        const questions = exam?.questions || [];
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          const questionId = question.QuestionID;
          const answerValue = answers[questionId];
          
          // Skip if no answer
          if (!answerValue || answerValue.trim() === '') {
            console.log(`No answer to save for question ${questionId}`);
            continue;
          }
          
          try {
            await submitAnswer(finalParticipantId, questionId, answerValue);
            console.log(`Successfully saved answer for question ${questionId}`);
          } catch (saveErr) {
            console.warn(`Could not save answer for question ${questionId}:`, saveErr);
            // Continue with next answer even if this one fails
          }
        }
        console.log("Saved all available answers");
      } catch (err) {
        console.warn("Error when saving answers before submission:", err);
      }

      // Update grading progress
      setGradingProgress({
        current: 0,
        total: (exam?.questions?.length || 1) + 1,
        message: 'Đang nộp bài thi...'
      });
      
      // First, submit/complete the exam
      let completeResult = null;
      try {
        // Short delay to make it feel like processing is happening
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setGradingProgress(prev => ({
          ...prev,
          message: 'Đang gửi bài thi lên hệ thống...'
        }));
        
        // Submit the exam - use fallback ID if needed
        if (finalParticipantId) {
          // Include penalty information with submission
          completeResult = await completeExam(
            finalParticipantId, 
            examId, 
            {
              tabSwitches: tabSwitchCount,
              fullscreenExits: fullscreenExitCount,
              penaltyPercentage: (penalties.tabSwitch * 5) + (penalties.fullscreenExit * 3)
            }
          );
          console.log('Exam completed successfully:', completeResult);

          // If we get a result from the server with grading already done
          if (completeResult && completeResult.evaluationDetails) {
            // To reduce flickering, prepare all the data first before updating the UI
            const feedbacks = exam.questions.map((question, index) => {
              const evaluation = completeResult.evaluationDetails.find(
                e => e.questionId.toString() === question.QuestionID.toString()
              );
              
              return {
                question: question.Content,
                answer: answers[question.QuestionID] || '',
                score: evaluation ? evaluation.score : 0,
                feedback: evaluation?.status === 'success' ? 'Câu trả lời được chấm bởi AI.' : 
                          evaluation?.status === 'fallback_used' ? 'Câu trả lời được chấm bằng phương pháp thay thế.' : 
                          evaluation?.status === 'no_answer' ? 'Không có câu trả lời.' : 
                          'Không thể chấm điểm câu này.',
                similarity: Math.round((evaluation?.score / evaluation?.maxPoints) * 100) || 0
              };
            });
            
            // Calculate final score - use the direct sum
            const totalScore = feedbacks.reduce((sum, feedback) => sum + feedback.score, 0);
            
            // Apply penalties immediately to the score
            const penaltyPercentage = (penalties.tabSwitch * 5) + (penalties.fullscreenExit * 3);
            const penaltyMultiplier = Math.max(0, (100 - penaltyPercentage) / 100);
            const finalScore = totalScore * penaltyMultiplier;
            
            console.log(`Original score: ${totalScore}, Penalty: ${penaltyPercentage}%, Final score: ${finalScore}`);
            
            // Update progress to 100% first
            setGradingProgress(prev => ({
              ...prev,
              current: prev.total,
              message: 'Đã hoàn thành chấm điểm.'
            }));
            
            // Short delay before transitioning from progress to results
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Set score and show results in one update cycle to reduce flickering
            setScore({
              total: finalScore,
              originalScore: totalScore,
              penaltyApplied: penaltyPercentage > 0,
              penaltyPercentage: penaltyPercentage,
              feedbacks: feedbacks
            });
            setShowGradingProgress(false);
            setShowResults(true);
            
            // Determine the appropriate redirect URL
            let redirectUrl = null;
            if (completeResult && completeResult.redirectTo) {
              redirectUrl = completeResult.redirectTo;
            } else if (finalParticipantId) {
              // Fallback redirect if API didn't provide one
              redirectUrl = `/exams/results/${finalParticipantId}`;
            }
            
            // Setup timer to exit fullscreen after showing results
            setupExitFullscreenTimer(finalParticipantId, redirectUrl);
            
            console.log("Skipping manual grading since server already provided scores");
            return;
          }
        } else {
          // If no participantId found, still try to proceed, but log the error
          console.error("No participantId available for exam completion");
          throw new Error("Thiếu ID người tham gia");
        }
        
        // Update progress
        setGradingProgress(prev => ({
          ...prev,
          current: 1,
          message: 'Đã nộp bài thi thành công. Bắt đầu chấm điểm...'
        }));
        
        // Another short delay before starting grading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (completeError) {
        console.error('Error completing exam:', completeError);
        // Show error but continue with grading if possible
        setGradingProgress(prev => ({
          ...prev,
          message: 'Lưu ý: Có lỗi khi nộp bài thi, nhưng vẫn tiếp tục chấm điểm...'
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Now, proceed with grading each answer - prepare array to collect all feedbacks
      let totalScore = 0;
      let feedbacks = [];
      
      // Use a safe reference to exam questions
      const questions = exam?.questions || [];
      
      // Prepare for grading
      setGradingProgress(prev => ({
        ...prev,
        message: 'Hệ thống đang so sánh bài làm với đáp án mẫu. Vui lòng chờ...'
      }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Grade each answer - collect all promises to process them in parallel
      const gradingPromises = questions.map(async (question, i) => {
        try {
          const answer = answers[question.QuestionID] || '';
          
          // Update progress (shared state across promises)
          setGradingProgress(prev => ({
            ...prev,
            current: i + 1,
            message: `Đang chấm điểm câu ${i + 1}/${questions.length}...`
          }));
          
          console.log(`Grading question ${question.QuestionID} with answer length: ${answer.length}`);
          
          try {
            // Use the compareAnswer function from examApi instead of direct fetch
            const result = await compareAnswer(examId, question.QuestionID, answer, finalParticipantId);
            
            if (!result.success) {
              console.error(`Error grading question ${question.QuestionID}:`, result.message);
              throw new Error(result.message || 'Lỗi khi chấm điểm câu hỏi');
            }

            console.log(`Question ${question.QuestionID} graded with score: ${result.data.score}`);
            
            return {
              question: question.Content,
              answer: answer,
              score: result.data.score,
              feedback: result.data.feedback || 'Hệ thống đã phân tích nội dung dựa trên phương pháp so sánh với đáp án mẫu.',
              similarity: result.data.similarity
            };
          } catch (gradeError) {
            console.error(`Error grading via API, using fallback method:`, gradeError);
            
            // Fallback: use local similarity comparison
            const localSim = compareAnswerLocally(
              answer,
              question.CorrectAnswer || '',
              (() => {
                try {
                  return Array.isArray(question.Keywords)
                    ? question.Keywords
                    : (typeof question.Keywords === 'string' ? JSON.parse(question.Keywords) : []);
                } catch {
                  return [];
                }
              })()
            );

            const maxPoints = Number(question.Points || 10);
            const localScore = Number(((localSim.totalSimilarity / 100) * maxPoints).toFixed(2));

            return {
              question: question.Content,
              answer: answer,
              score: localScore,
              feedback: 'Điểm tạm tính dựa trên so sánh nội dung khi hệ thống gặp sự cố.',
              similarity: localSim.totalSimilarity
            };
          }
        } catch (questionError) {
          console.error(`Error processing question ${question?.QuestionID}:`, questionError);
          return {
            question: question?.Content || `Câu hỏi ${i+1}`,
            answer: answers[question?.QuestionID] || '',
            score: 0,
            feedback: 'Lỗi khi chấm điểm câu hỏi này',
            similarity: 0
          };
        }
      });
      
      // Wait for all grading to finish
      try {
        feedbacks = await Promise.all(gradingPromises);
        totalScore = feedbacks.reduce((sum, feedback) => sum + feedback.score, 0);
      } catch (err) {
        console.error("Error during parallel grading:", err);
      }
      
      // Final processing - update UI once with all results to reduce flickering
      setGradingProgress(prev => ({
        ...prev,
        current: prev.total,
        message: 'Đã hoàn thành chấm điểm.'
      }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply penalties immediately to the score
      const penaltyPercentage = (penalties.tabSwitch * 5) + (penalties.fullscreenExit * 3);
      const penaltyMultiplier = Math.max(0, (100 - penaltyPercentage) / 100);
      const finalScore = totalScore * penaltyMultiplier;
      
      console.log(`Original score: ${totalScore}, Penalty: ${penaltyPercentage}%, Final score: ${finalScore}`);
      
      // Update UI all at once to reduce flickering
      setScore({
        total: finalScore,
        originalScore: totalScore,
        penaltyApplied: penaltyPercentage > 0,
        penaltyPercentage: penaltyPercentage,
        feedbacks: feedbacks
      });
      
      // IMPORTANT: Submit the final score to the server to make sure it's saved
      // This ensures the score is available in ExamHistory
      try {
        // Even if we already called completeExam before, call it again with the final calculated score
        // to ensure the score is updated in the database
        await completeExam(
          finalParticipantId, 
          examId, 
          {
            tabSwitches: tabSwitchCount,
            fullscreenExits: fullscreenExitCount,
            penaltyPercentage: penaltyPercentage,
            finalScore: finalScore,
            originalScore: totalScore,
            feedbacks: feedbacks.map(fb => ({
              questionId: exam.questions[feedbacks.indexOf(fb)]?.QuestionID,
              score: fb.score,
              similarity: fb.similarity
            }))
          }
        );
        
        console.log(`Final score ${finalScore} successfully submitted to server`);
      } catch (err) {
        console.error('Error submitting final score to server:', err);
      }
      
      setShowGradingProgress(false);
      setShowResults(true);
      
      // Determine the appropriate redirect URL
      let redirectUrl = null;
      if (completeResult && completeResult.redirectTo) {
        redirectUrl = completeResult.redirectTo;
      } else if (finalParticipantId) {
        // Fallback redirect if API didn't provide one
        redirectUrl = `/exams/results/${finalParticipantId}`;
      }
      
      // Setup timer to exit fullscreen after showing results
      setupExitFullscreenTimer(finalParticipantId, redirectUrl);
      
    } catch (err) {
      console.error('Error submitting exam:', err);
      let errorMessage = 'Lỗi khi nộp bài thi. Hệ thống vẫn sẽ cố gắng hoàn thành quá trình.';
      
      // Get more specific error message if available
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show error but don't hide grading progress - try to continue
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Try to show results anyway with estimated scores if we have enough data
      if (!showResults) {
        const questions = exam?.questions || [];
        if (questions.length > 0) {
          // Create estimated results
          const estimatedFeedbacks = questions.map((q, i) => {
            const localSim = compareAnswerLocally(
              answers[q.QuestionID] || '',
              q.CorrectAnswer || '',
              (() => {
                try {
                  return Array.isArray(q.Keywords)
                    ? q.Keywords
                    : (typeof q.Keywords === 'string' ? JSON.parse(q.Keywords) : []);
                } catch {
                  return [];
                }
              })()
            );

            const maxPts = Number(q.Points || 10);
            const localScore = Number(((localSim.totalSimilarity / 100) * maxPts).toFixed(2));

            return {
              question: q.Content || `Câu hỏi ${i+1}`,
              answer: answers[q.QuestionID] || '',
              score: localScore,
              feedback: 'Điểm tạm tính dựa trên so sánh nội dung khi hệ thống gặp sự cố.',
              similarity: localSim.totalSimilarity
            };
          });
          
          const avgScore = estimatedFeedbacks.reduce((sum, f) => sum + f.score, 0) / estimatedFeedbacks.length;
          
          setScore({
            total: avgScore,
            originalScore: avgScore,
            penaltyApplied: false,
            penaltyPercentage: 0,
            feedbacks: estimatedFeedbacks
          });
          
          setShowGradingProgress(false);
          setShowResults(true);
        }
      }
    } finally {
      // Ensure grading progress is hidden if there was a critical error
      setTimeout(() => {
        setIsGrading(false);
        if (showGradingProgress) {
          setShowGradingProgress(false);
        }
      }, 3000);
    }
  };

  // Function to exit fullscreen after grading is complete
  const setupExitFullscreenTimer = (participantId, redirectUrl) => {
    console.log("Setting up 30-second timer to exit fullscreen mode");
    
    // Set a 30-second timer to exit fullscreen mode
    const exitFullscreenTimer = setTimeout(() => {
      console.log("30 seconds elapsed after grading, exiting fullscreen mode");
      if (isFullscreen && document.exitFullscreen) {
        try {
          document.exitFullscreen()
            .then(() => {
              console.log("Successfully exited fullscreen mode after grading");
              setIsFullscreen(false);
              
              // Don't navigate away automatically
            })
            .catch(error => {
              console.error("Error exiting fullscreen mode after grading:", error);
            });
        } catch (error) {
          console.error("Error with fullscreen exit after grading:", error);
        }
      }
    }, 30000); // 30 seconds
    
    // Save the timer ID to clear it if needed
    timerRef.current = exitFullscreenTimer;
  };

  // Function to check if a question has been answered
  const isQuestionAnswered = (questionId) => {
    return answers[questionId] && answers[questionId].trim() !== '';
  };

  // Function to get progress percentage
  const getProgressPercentage = () => {
    if (!exam || !exam.questions || exam.questions.length === 0) return 0;
    
    const answeredCount = exam.questions.reduce((count, question) => {
      return count + (isQuestionAnswered(question.QuestionID) ? 1 : 0);
    }, 0);
    
    return Math.round((answeredCount / exam.questions.length) * 100);
  };

  // Set up tab switch detector
  useEffect(() => {
    if (!participantId) return; // Only track when exam has started
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // User switched away from the tab or minimized browser
        setTabSwitchCount(prev => prev + 1);
        
        // Apply penalty for tab switching
        setPenalties(prev => ({
          ...prev,
          tabSwitch: prev.tabSwitch + 1
        }));
        
        // Log the tab switch event to the server
        try {
          await fetch('/api/exams/monitoring-logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({
              participantId,
              eventType: 'tab_switch',
              eventData: JSON.stringify({
                count: tabSwitchCount + 1,
                timestamp: new Date().toISOString()
              })
            })
          });
        } catch (error) {
          console.error('Failed to log tab switch:', error);
        }
        
        // Show warning when user returns to the tab
        setTabSwitchWarningShown(true);
        
        // Auto-submit after too many violations
        if (tabSwitchCount + 1 >= MAX_TAB_SWITCHES && !isGrading) {
          toast.error('Quá nhiều lần chuyển tab/cửa sổ. Bài thi sẽ tự động nộp sau 30 giây!', {
            position: "top-center",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: false,
            draggable: false
          });
          
          // Set a 30-second timer to auto-submit
          setTimeout(() => {
            if (!isGrading) {
              handleSubmitExam();
            }
          }, 30000);
        }
      } else if (document.visibilityState === 'visible' && !document.fullscreenElement) {
        // Re-enter fullscreen when returning to tab
        attemptFullscreen();
      }
    };
    
    const handleWindowBlur = async () => {
      // User switched to another application
      setTabSwitchCount(prev => prev + 1);
      
      // Apply penalty for switching applications
      setPenalties(prev => ({
        ...prev,
        tabSwitch: prev.tabSwitch + 1
      }));
      
      // Log the window blur event
      try {
        await fetch('/api/exams/monitoring-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            participantId,
            eventType: 'window_blur',
            eventData: JSON.stringify({
              count: tabSwitchCount + 1,
              timestamp: new Date().toISOString()
            })
          })
        });
      } catch (error) {
        console.error('Failed to log window blur:', error);
      }
      
      // Show warning when user returns focus
      setTabSwitchWarningShown(true);
      
      // Auto-submit after too many violations
      if (tabSwitchCount + 1 >= MAX_TAB_SWITCHES && !isGrading) {
        toast.error('Quá nhiều lần chuyển ứng dụng. Bài thi sẽ tự động nộp sau 30 giây!', {
          position: "top-center",
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: false,
          draggable: false
        });
        
        // Set a 30-second timer to auto-submit
        setTimeout(() => {
          if (!isGrading) {
            handleSubmitExam();
          }
        }, 30000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [participantId, tabSwitchCount, isGrading]);

  // Add results dialog component
  const ResultsDialog = () => (
    <Box
      sx={{
        display: showResults ? 'flex' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: 9999,
        flexDirection: 'column',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        overflow: 'auto'
      }}
    >
      <Box sx={{ 
        bgcolor: 'primary.main',
        color: 'white',
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5">Kết quả bài thi</Typography>
        <IconButton 
          onClick={() => {
            // Always exit fullscreen before leaving the session page
            if (isFullscreen && document.exitFullscreen) {
              try {
                document.exitFullscreen();
              } catch(e) {}
            }

            // Navigate to dedicated results page
            if (participantId) {
              navigate(`/exams/results/${participantId}`);
            } else {
              // Fallback: just close overlay
              setShowResults(false);
            }
          }}
          sx={{ color: 'white' }}
        >
          <Cancel />
        </IconButton>
      </Box>
      <Box sx={{ p: 4, flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Tổng điểm: {score?.total ? score.total.toFixed(1) : '0'}/10
          </Typography>
          
          {score?.penaltyApplied && (
            <Box sx={{ 
              mt: 1, 
              mb: 3, 
              p: 2, 
              bgcolor: 'error.light', 
              borderRadius: 1,
              color: 'error.contrastText'
            }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Điểm bị trừ do vi phạm quy định làm bài:</strong>
              </Typography>
              <Box component="ul" sx={{ ml: 2, mt: 1 }}>
                {penalties?.tabSwitch > 0 && (
                  <Typography component="li" variant="body2">
                    Chuyển tab/ứng dụng: {penalties.tabSwitch} lần (-{penalties.tabSwitch * 5}%)
                  </Typography>
                )}
                {penalties?.fullscreenExit > 0 && (
                  <Typography component="li" variant="body2">
                    Thoát toàn màn hình: {penalties.fullscreenExit} lần (-{penalties.fullscreenExit * 3}%)
                  </Typography>
                )}
                <Typography component="li" variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                  Tổng điểm bị trừ: {score.penaltyPercentage}%
                </Typography>
                <Typography component="li" variant="body2" sx={{ mt: 1 }}>
                  Điểm gốc: {score.originalScore?.toFixed(1) || '0'}/10
                </Typography>
                <Typography component="li" variant="body2">
                  Điểm sau khi trừ: {score.total?.toFixed(1) || '0'}/10
                </Typography>
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              Chi tiết từng câu: 
              <Box sx={{ 
                ml: 1, 
                px: 1.5, 
                py: 0.5, 
                bgcolor: '#e3f2fd', 
                borderRadius: 1, 
                fontSize: '0.875rem',
                color: '#1976d2'
              }}>
                Độ tương đồng với đáp án mẫu được tính bằng so sánh nội dung và từ khóa
              </Box>
            </Typography>
            {score?.feedbacks?.map((feedback, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Câu {index + 1}: {feedback?.score?.toFixed(1) || '0'} điểm
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mt: 1, 
                  mb: 1,
                  bgcolor: '#f5f5f5',
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1, minWidth: '180px' }}>
                    <strong>Độ tương đồng với đáp án:</strong>
                  </Typography>
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      width: '100%', 
                      bgcolor: '#e0e0e0',
                      height: 12,
                      borderRadius: 5,
                      overflow: 'hidden',
                      mr: 1
                    }}>
                      <Box sx={{
                        width: `${Number(feedback.similarity || 0).toFixed(1)}%`,
                        bgcolor: Number(feedback.similarity || 0) > 70 ? 'success.main' : 
                                Number(feedback.similarity || 0) > 40 ? 'warning.main' : 'error.main',
                        height: '100%',
                        borderRadius: 5
                      }} />
                    </Box>
                    <Typography variant="body2" sx={{ 
                      fontSize: '1.1rem',
                      color: Number(feedback.similarity || 0) > 70 ? 'success.main' : 
                             Number(feedback.similarity || 0) > 40 ? 'warning.main' : 'error.main',
                      fontWeight: 'bold',
                      minWidth: '60px',
                      textAlign: 'right'
                    }}>
                      {Number(feedback.similarity || 0).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Nhận xét:</strong> {feedback.feedback || 'Không có nhận xét'}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={() => {
            // Always exit fullscreen before leaving the session page
            if (isFullscreen && document.exitFullscreen) {
              try {
                document.exitFullscreen();
              } catch(e) {}
            }

            // Navigate to dedicated results page
            if (participantId) {
              navigate(`/exams/results/${participantId}`);
            } else {
              // Fallback: just close overlay
              setShowResults(false);
            }
          }}
          variant="contained"
          color="primary"
          size="large"
          sx={{ minWidth: '200px' }}
        >
          Đóng
        </Button>
      </Box>
    </Box>
  );

  // Add a GradingProgressDialog component
  const GradingProgressDialog = () => (
    <Box
      sx={{
        display: showGradingProgress ? 'flex' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: 9999,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Paper 
        elevation={4} 
        sx={{ 
          width: '90%', 
          maxWidth: '600px',
          overflow: 'hidden',
          borderRadius: 2
        }}
      >
        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
          <Typography variant="h5">Đang chấm điểm bài thi</Typography>
        </Box>
        <Box sx={{ p: 4, minHeight: '350px' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <CircularProgress size={80} thickness={5} />
          </Box>
          
          <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
            Vui lòng chờ trong ít phút
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Hệ thống đang chấm điểm bài thi của bạn bằng cách so sánh với đáp án mẫu. Quá trình này có thể mất vài phút.
          </Typography>
          
          <Box sx={{ 
            width: '100%', 
            bgcolor: 'background.paper',
            borderRadius: 1,
            p: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                bgcolor: 'success.main',
                mr: 1,
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 0.5, transform: 'scale(0.8)' },
                  '50%': { opacity: 1, transform: 'scale(1.2)' },
                  '100%': { opacity: 0.5, transform: 'scale(0.8)' }
                }
              }} />
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                {gradingProgress.message}
              </Typography>
            </Box>
            
            {gradingProgress.total > 0 && (
              <>
                <Box sx={{ 
                  width: '100%', 
                  bgcolor: '#e0e0e0',
                  height: 10,
                  borderRadius: 5,
                  mt: 2,
                  overflow: 'hidden'
                }}>
                  <Box sx={{
                    width: `${(gradingProgress.current / gradingProgress.total) * 100}%`,
                    bgcolor: 'primary.main',
                    height: '100%',
                    borderRadius: 5,
                    transition: 'width 0.5s ease-in-out'
                  }} />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`Câu ${gradingProgress.current}/${gradingProgress.total - 1}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round((gradingProgress.current / gradingProgress.total) * 100)}%
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" align="center" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              Hệ thống đang so sánh câu trả lời của bạn với các đáp án trong cơ sở dữ liệu, kiểm tra từ khóa quan trọng và tính toán độ tương đồng để đưa ra điểm số chính xác.
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FullscreenExit sx={{ color: '#2196f3', mr: 1 }} />
            <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 'medium' }}>
              Hệ thống sẽ tự động chuyển sang trang kết quả khi chấm điểm xong
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          {startingExam ? 'Đang bắt đầu kỳ thi...' : 'Đang tải...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="error">
          <AlertTitle>Lỗi</AlertTitle>
          {error}
        </Alert>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/exams')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách kỳ thi
        </Button>
      </Box>
    );
  }

  if (!exam || !participantId) {
    return (
      <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="warning">
          <AlertTitle>Không tìm thấy</AlertTitle>
          Không tìm thấy thông tin kỳ thi hoặc bạn chưa đăng ký.
        </Alert>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/exams')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách kỳ thi
        </Button>
      </Box>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <Box ref={fullscreenRef} sx={{ 
      minHeight: '100vh', 
      bgcolor: isFullscreen ? '#f5f5f5' : 'inherit',
      p: isFullscreen ? 1.5 : 2,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: isFullscreen ? '100vh' : 'inherit',
      overflow: isFullscreen ? 'hidden' : 'visible'
    }}>
      {!isFullscreen && !isGrading && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Vui lòng vào chế độ toàn màn hình</AlertTitle>
          Hệ thống đã cố gắng chuyển sang chế độ toàn màn hình nhưng có thể đã bị trình duyệt chặn.
          Để tiếp tục làm bài thi, vui lòng nhấn nút bên dưới để vào chế độ toàn màn hình.
          <Button
            variant="contained"
            startIcon={<Fullscreen />}
            onClick={attemptFullscreen}
            sx={{ mt: 1 }}
          >
            Vào chế độ toàn màn hình
          </Button>
        </Alert>
      )}

      {tabSwitchWarningShown && tabSwitchCount > 0 && !isGrading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Cảnh báo nghiêm trọng!</AlertTitle>
          Bạn đã chuyển tab/ứng dụng {tabSwitchCount} lần. Mỗi lần chuyển tab sẽ bị trừ 5% tổng điểm.
          {tabSwitchCount >= MAX_TAB_SWITCHES - 1 && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              Nếu bạn chuyển tab thêm lần nữa, bài thi sẽ tự động nộp với điểm số thấp!
            </Typography>
          )}
        </Alert>
      )}

      {fullscreenExitCount > 0 && !isGrading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Cảnh báo!</AlertTitle>
          Bạn đã thoát chế độ toàn màn hình {fullscreenExitCount} lần. Mỗi lần thoát chế độ toàn màn hình sẽ bị trừ 3% tổng điểm.
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: isFullscreen ? 1 : 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ fontWeight: 'medium' }}>
              {exam.Title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {exam.Description}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 1, 
              bgcolor: timeLeft < 300 ? 'error.light' : timeLeft < 600 ? 'warning.light' : 'primary.light',
              color: 'white',
              borderRadius: 1,
              mb: 1,
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 1000
            }}>
              <Timer sx={{ mr: 1 }} />
              <Typography variant="h6">
                {formatTime(timeLeft)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? 'Thoát' : 'Toàn màn hình'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        flexDirection: { xs: 'column', md: 'row' },
        height: isFullscreen ? 'calc(100vh - 130px)' : 'inherit',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          width: { xs: '100%', md: '25%' }, 
          pr: { xs: 0, md: 2 },
          mb: { xs: 2, md: 0 },
          display: 'flex',
          flexDirection: 'column',
          height: isFullscreen ? '100%' : 'inherit',
          overflow: 'hidden'
        }}>
          <Paper elevation={3} sx={{ 
            p: 2, 
            mb: 2,
            flexGrow: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: isFullscreen ? '240px' : '260px',
            minHeight: '220px',
            borderRadius: isFullscreen ? 1 : 2
          }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Danh sách câu hỏi
            </Typography>
            <Divider sx={{ mb: 1 }} />
            
            <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
              <List dense>
                {exam.questions.map((question, index) => (
                  <ListItem key={question.QuestionID} disablePadding>
                    <ListItemButton
                      selected={currentQuestionIndex === index}
                      onClick={() => handleNavigateQuestion(index)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        py: 0.5,
                        bgcolor: answers[question.QuestionID] ? 'rgba(76, 175, 80, 0.1)' : 'inherit',
                        border: answers[question.QuestionID] ? '1px solid #4caf50' : 'none',
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.main',
                          }
                        }
                      }}
                    >
                      <ListItemText 
                        primary={`Câu ${index + 1}`}
                        secondary={`${answers[question.QuestionID] ? 'Đã trả lời' : 'Chưa trả lời'}`}
                        primaryTypographyProps={{
                          fontWeight: currentQuestionIndex === index ? 'bold' : 'normal',
                          fontSize: '0.9rem'
                        }}
                        secondaryTypographyProps={{
                          color: currentQuestionIndex === index ? 'inherit' : (answers[question.QuestionID] ? 'success.main' : 'error.main'),
                          fontSize: '0.75rem'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
          
          <Paper elevation={3} sx={{ 
            p: 2, 
            mb: 2, 
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: isFullscreen ? 'calc(100% - 250px)' : '300px', 
            overflow: 'auto', 
            borderRadius: isFullscreen ? 1 : 2 
          }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Thông tin kỳ thi
            </Typography>
            <Divider sx={{ mb: 1 }} />
            
            {userData && (
              <Box sx={{ 
                mb: 1.5, 
                p: 1.5, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.light',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium', color: 'primary.main' }}>
                  Thông tin thí sinh
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      p: 1,
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Họ và tên
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {userData.fullName || userData.FullName || userData.username || userData.Username || userData.name || 'Không có thông tin'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      p: 1,
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Mã số
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {userData.id || userData.UserID || userData.userId || userData.studentId || participantId || 'Không có thông tin'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Thời gian:</strong> {exam.Duration} phút
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Tổng số câu hỏi:</strong> {exam.questions.length}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Điểm đạt:</strong> {exam.PassingScore}/{exam.TotalPoints}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Loại kỳ thi:</strong> {exam.Type === 'essay' ? 'Tự luận' : exam.Type === 'multiple_choice' ? 'Trắc nghiệm' : exam.Type}
            </Typography>
            
            {exam.Instructions && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Hướng dẫn làm bài:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {exam.Instructions}
                </Typography>
              </>
            )}
          </Paper>
          
          {isFullscreen && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Warning />}
              onClick={async () => {
                // Directly submit the exam: save current answer, then grade immediately
                setSubmitting(true);
                try {
                  await handleSaveAnswer();
                } catch (err) {
                  console.warn("Error saving current answer before submission:", err);
                }
                await handleSubmitExam();
              }}
              size="large"
              fullWidth
              disabled={submitting || isGrading} // Disable when submitting or grading
              sx={{ 
                py: 1.5, 
                borderRadius: 1, 
                backgroundColor: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.dark',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                  boxShadow: 1,
                },
                fontWeight: 'bold',
                boxShadow: 3,
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::after': submitting ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'ripple 1.5s infinite',
                } : {},
                '@keyframes ripple': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' }
                }
              }}
            >
              {submitting ? (
                <>
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                  Đang xử lý...
                </>
              ) : 'Nộp bài'}
            </Button>
          )}
        </Box>
        
        <Box sx={{ 
          width: { xs: '100%', md: '75%' },
          height: isFullscreen ? '100%' : 'inherit',
          display: 'flex'
        }}>
          <Paper elevation={3} sx={{ 
            p: 3, 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: isFullscreen ? 1 : 2
          }}>
            {isFullscreen ? (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Câu hỏi {currentQuestionIndex + 1}/{exam.questions.length}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 3, overflow: 'auto', maxHeight: isFullscreen ? '20vh' : '180px' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {currentQuestion?.Content || 'Không có nội dung câu hỏi'}
                  </Typography>
                </Box>
                
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Câu trả lời của bạn:
                </Typography>
                
                <Box sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  minHeight: isFullscreen ? 'calc(65vh - 100px)' : '400px',
                  mb: 2 
                }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={isFullscreen ? 16 : 12}
                    variant="outlined"
                    placeholder="Nhập câu trả lời của bạn tại đây..."
                    value={answers[currentQuestion?.QuestionID] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion?.QuestionID, e.target.value)}
                    disabled={submitting}
                    sx={{ 
                      flexGrow: 1,
                      height: '100%',
                      '& .MuiOutlinedInput-root': {
                        height: '100%',
                        '& textarea': {
                          height: '100% !important'
                        },
                        '& fieldset': {
                          borderColor: currentQuestionIndex === 0 ? 'primary.light' : 'inherit',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleNavigateQuestion(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0 || submitting}
                    sx={{ borderRadius: 1 }}
                  >
                    Câu trước
                  </Button>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      color={saveSuccess ? "success" : "primary"}
                      onClick={handleSaveAnswer}
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={20} /> : saveSuccess ? <Check /> : null}
                      sx={{ borderRadius: 1 }}
                    >
                      {submitting ? 'Đang lưu...' : saveSuccess ? 'Đã lưu' : 'Lưu câu trả lời'}
                    </Button>
                    {saveSuccess && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          ml: 1, 
                          color: 'success.main',
                          animation: 'fadeIn 0.3s ease-in',
                          '@keyframes fadeIn': {
                            '0%': { opacity: 0 },
                            '100%': { opacity: 1 }
                          }
                        }}
                      >
                        Đã lưu
                      </Typography>
                    )}
                  </Box>
                  
                  <Button
                    variant="outlined"
                    onClick={() => handleNavigateQuestion(Math.min(exam.questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === exam.questions.length - 1 || submitting}
                    sx={{ borderRadius: 1 }}
                  >
                    Câu tiếp theo
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 4
              }}>
                <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
                  Nội dung câu hỏi và ô nhập câu trả lời chỉ hiển thị trong chế độ toàn màn hình
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Fullscreen />}
                  onClick={attemptFullscreen}
                  size="large"
                >
                  Vào chế độ toàn màn hình để làm bài
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
      
      <ResultsDialog />
      <GradingProgressDialog />
    </Box>
  );
};

export default ExamSession;
