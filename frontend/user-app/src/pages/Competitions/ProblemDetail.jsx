import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProblemDetails, submitSolution, getSubmissionDetails, getCompetitionDetails } from '@/api/competitionService';
import { toast } from 'react-toastify';
import Editor from '@monaco-editor/react';
import { format } from 'date-fns';

const ProblemDetail = () => {
  const { competitionId, problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [problemList, setProblemList] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [tabActive, setTabActive] = useState('problem'); // 'problem', 'submissions'
  const [results, setResults] = useState(null);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const editorRef = useRef(null);

  // Language options
  const languages = [
    { id: 'cpp', name: 'C++', extension: 'cpp' },
    { id: 'c', name: 'C', extension: 'c' },
    { id: 'java', name: 'Java', extension: 'java' },
    { id: 'python', name: 'Python', extension: 'py' },
    { id: 'javascript', name: 'JavaScript', extension: 'js' },
  ];

  // Language-specific starter code
  const starterCodes = {
    cpp: `#include <iostream>
using namespace std;

int main() {
    // Your code here
    
    return 0;
}`,
    c: `#include <stdio.h>

int main() {
    // Your code here
    
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Your code here
    }
}`,
    python: `# Your code here
`,
    javascript: `// Your code here
`
  };

  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      try {
        const response = await getCompetitionDetails(competitionId);
        if (response.success && response.data.problems) {
          setProblemList(response.data.problems);
        } else {
          console.error('Failed to fetch problem list');
        }
      } catch (err) {
        console.error('Error fetching competition details:', err);
      }
    };

    fetchCompetitionDetails();
  }, [competitionId]);

  useEffect(() => {
    const fetchProblemDetails = async () => {
      try {
        setLoading(true);
        const response = await getProblemDetails(competitionId, problemId);
        
        // Handle different error types
        if (!response.success) {
          if (response.isAuthError) {
            toast.error('Please log in to view problem details');
            navigate('/login', { state: { from: `/competitions/${competitionId}/problems/${problemId}` } });
            setLoading(false);
            return;
          }
          
          if (response.isPermissionError) {
            toast.error(response.message || 'You do not have permission to view this problem');
            setLoading(false);
            return;
          }
          
          if (response.isServerError) {
            toast.error(response.message || 'Server error occurred');
            setLoading(false);
            return;
          }
          
          // Handle any other error
          toast.error(response.message || 'Failed to load problem details');
          setLoading(false);
          return;
        }
        
        setProblem(response.data);
        
        // Set submissions from the correct location in the response
        if (response.userSubmissions) {
          setSubmissions(response.userSubmissions);
        }
        
        // Set initial code from starter code or language template
        if (response.data.StarterCode) {
          setCode(response.data.StarterCode);
        } else {
          setCode(starterCodes[language]);
        }

        // Parse test cases if available
        try {
          if (response.data.TestCasesVisible) {
            try {
              // Try to parse as JSON
              const visibleTestCases = JSON.parse(response.data.TestCasesVisible);
              response.data.TestCasesVisible = Array.isArray(visibleTestCases) ? visibleTestCases : [];
            } catch (error) {
              console.error('Error parsing visible test cases:', error);
              response.data.TestCasesVisible = [];
            }
          }
        } catch (error) {
          console.error('Error handling test cases:', error);
          response.data.TestCasesVisible = [];
        }
        
      } catch (err) {
        console.error('Error fetching problem details:', err);
        toast.error('An error occurred while fetching problem details');
      } finally {
        setLoading(false);
      }
    };

    fetchProblemDetails();
  }, [competitionId, problemId, language, navigate]);

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    
    // If user hasn't written any code yet, set the starter code for the new language
    if (!code || code === starterCodes[language]) {
      setCode(starterCodes[newLanguage]);
    }
  };

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  // Submit solution
  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.warning('Please write some code before submitting');
      return;
    }

    try {
      setSubmitting(true);
      setResults(null);
      
      const response = await submitSolution(competitionId, problemId, code, language);
      
      if (response.success) {
        toast.success('Solution submitted successfully');
        
        // Polling for submission results
        let submissionStatus = 'pending';
        let attempts = 0;
        const maxAttempts = 10;
        const pollingInterval = 2000; // 2 seconds
        
        const checkSubmissionStatus = async () => {
          try {
            attempts++;
            console.log(`Checking submission status (attempt ${attempts}/${maxAttempts})...`);
            
            // Fetch the latest problem data including submissions
            const problemData = await getProblemDetails(competitionId, problemId);
            
            if (problemData.isServerError) {
              toast.error(problemData.message || 'Server error occurred');
              setSubmitting(false);
              return;
            }
            
            if (!problemData.success) {
              toast.error(problemData.message || 'Failed to fetch submission status');
              setSubmitting(false);
              return;
            }
            
            // Find the latest submission
            const latestSubmission = problemData.userSubmissions?.[0];
            
            if (!latestSubmission) {
              console.error('No submissions found after submitting code');
              setSubmitting(false);
              return;
            }
            
            console.log('Latest submission status:', latestSubmission.Status);
            submissionStatus = latestSubmission.Status.toLowerCase();
            
            // Update UI with the latest submission
            setSubmissions(problemData.userSubmissions || []);
            
            // If still pending/running and we haven't exceeded max attempts, poll again
            if (['pending', 'running', 'compiling'].includes(submissionStatus) && attempts < maxAttempts) {
              setTimeout(checkSubmissionStatus, pollingInterval);
            } else {
              // Final status update
              setSubmitting(false);
              
              // Handle the final submission status
              if (submissionStatus === 'accepted') {
                toast.success('Solution accepted! 🎉');
              } else if (submissionStatus === 'wrong_answer') {
                toast.error('Wrong answer. Try again!');
              } else if (submissionStatus === 'compilation_error') {
                toast.error('Compilation error. Check your code syntax.');
              } else if (submissionStatus === 'runtime_error') {
                toast.error('Runtime error. Check your code logic.');
              } else if (submissionStatus === 'time_limit_exceeded') {
                toast.error('Time limit exceeded. Optimize your solution.');
              } else if (submissionStatus === 'memory_limit_exceeded') {
                toast.error('Memory limit exceeded. Optimize your solution.');
              } else {
                toast.error('An error occurred while judging your submission.');
              }
              
              // Display detailed results
              setResults({
                status: submissionStatus,
                message: latestSubmission.ErrorMessage || 'No error message provided.',
                score: latestSubmission.Score,
                executionTime: latestSubmission.ExecutionTime,
                memoryUsed: latestSubmission.MemoryUsed
              });
            }
          } catch (error) {
            console.error('Error checking submission status:', error);
            setSubmitting(false);
            toast.error('Failed to check submission status');
          }
        };
        
        // Start polling
        setTimeout(checkSubmissionStatus, 1000);
      } else {
        toast.error(response.message || 'Failed to submit solution');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error(error.response?.data?.message || 'Error submitting code');
      setSubmitting(false);
    }
  };

  // View a specific submission
  const handleViewSubmission = async (submissionId) => {
    try {
      const response = await getSubmissionDetails(submissionId);
      if (response.success) {
        setViewingSubmission(response.data);
        setTabActive('submissions');
      } else {
        toast.error('Failed to load submission details');
      }
    } catch (err) {
      console.error('Error fetching submission details:', err);
      toast.error('Error fetching submission details');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Accepted</span>;
      case 'wrong_answer':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Wrong Answer</span>;
      case 'compilation_error':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Compilation Error</span>;
      case 'runtime_error':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">Runtime Error</span>;
      case 'time_limit_exceeded':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Time Limit Exceeded</span>;
      case 'memory_limit_exceeded':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">Memory Limit Exceeded</span>;
      case 'pending':
      case 'running':
      case 'compiling':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center">
          <svg className="w-3 h-3 mr-1 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {status === 'pending' ? 'Pending' : status === 'running' ? 'Running' : 'Compiling'}
        </span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatDateTime = (dateTime) => {
    try {
      return format(new Date(dateTime), 'HH:mm:ss dd/MM/yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          Problem not found
        </div>
        <div className="mt-4">
          <Link to={`/competitions/${competitionId}`} className="text-blue-600 hover:text-blue-800">
            ← Back to competition
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to={`/competitions/${competitionId}`} className="text-blue-600 hover:text-blue-800">
          ← Back to competition
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Problem description - now 35% */}
        <div className="lg:col-span-4 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 px-4 text-center ${
                tabActive === 'problem'
                  ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setTabActive('problem')}
            >
              Problem
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center ${
                tabActive === 'submissions'
                  ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setTabActive('submissions')}
            >
              Submissions
            </button>
          </div>
          
          <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            {tabActive === 'problem' ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-2xl font-bold">{problem.Title}</h1>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      problem.Difficulty === 'Dễ' ? 'bg-green-100 text-green-800' : 
                      problem.Difficulty === 'Trung bình' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {problem.Difficulty}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">{problem.Points} points</span>
                  </div>
                </div>
                
                {/* Add problem list section to allow selection */}
                <div className="mb-6 border-b pb-4">
                  <h3 className="text-md font-semibold mb-2">Problem List</h3>
                  <div className="flex flex-wrap gap-2">
                    {problemList && problemList.map((p) => (
                      <button
                        key={p.ProblemID}
                        onClick={() => p.ProblemID !== parseInt(problemId) && navigate(`/competitions/${competitionId}/problems/${p.ProblemID}`)}
                        className={`px-3 py-1 text-sm rounded-full ${
                          p.ProblemID === parseInt(problemId)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {p.Title}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <div className="mb-6">
                    <p>{problem.Description}</p>
                  </div>
                  
                  {problem.InputFormat && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Input Format</h3>
                      <p>{problem.InputFormat}</p>
                    </div>
                  )}
                  
                  {problem.OutputFormat && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Output Format</h3>
                      <p>{problem.OutputFormat}</p>
                    </div>
                  )}
                  
                  {problem.Constraints && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Constraints</h3>
                      <p>{problem.Constraints}</p>
                    </div>
                  )}
                  
                  {(problem.SampleInput || problem.SampleOutput) && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Examples</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {problem.SampleInput && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Sample Input</h4>
                            <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">{problem.SampleInput}</pre>
                          </div>
                        )}
                        
                        {problem.SampleOutput && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Sample Output</h4>
                            <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">{problem.SampleOutput}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {problem.Explanation && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Explanation</h3>
                      <p>{problem.Explanation}</p>
                    </div>
                  )}
                  
                  {problem.TestCasesVisible && problem.TestCasesVisible.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Test Cases</h3>
                      <div className="space-y-4">
                        {problem.TestCasesVisible.map((testCase, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Input</h4>
                                <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">{testCase.input}</pre>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-2">Expected Output</h4>
                                <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">{testCase.output}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Your Submissions</h2>
                
                {viewingSubmission ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Submission #{viewingSubmission.SubmissionID}</h3>
                      <button 
                        onClick={() => setViewingSubmission(null)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Back to submissions
                      </button>
                    </div>
                    
                    <div className="mb-4 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <div className="mt-1">{getStatusBadge(viewingSubmission.Status)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Score:</span>
                        <div className="mt-1 font-medium">{viewingSubmission.Score} points</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Time:</span>
                        <div className="mt-1">{viewingSubmission.ExecutionTime || 0} seconds</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Memory:</span>
                        <div className="mt-1">{viewingSubmission.MemoryUsed || 0} KB</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Language:</span>
                        <div className="mt-1">{viewingSubmission.Language}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Submitted at:</span>
                        <div className="mt-1">{formatDateTime(viewingSubmission.SubmittedAt)}</div>
                      </div>
                    </div>
                    
                    {viewingSubmission.ErrorMessage && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-red-600 mb-2">Error:</h4>
                        <pre className="bg-red-50 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap text-red-700">
                          {viewingSubmission.ErrorMessage}
                        </pre>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Your code:</h4>
                      <div className="border rounded-md overflow-hidden">
                        <Editor
                          height="300px"
                          language={viewingSubmission.Language}
                          value={viewingSubmission.SourceCode}
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No submissions yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Language
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitted
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((submission) => (
                          <tr key={submission.SubmissionID} 
                              className="hover:bg-gray-50 cursor-pointer" 
                              onClick={() => handleViewSubmission(submission.SubmissionID)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {submission.SubmissionID}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(submission.Status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {submission.Score}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {submission.Language}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {submission.ExecutionTime || '-'} s
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(submission.SubmittedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Code editor - now 65% */}
        <div className="lg:col-span-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <label htmlFor="language" className="text-sm font-medium text-gray-700">Language:</label>
              <select
                id="language"
                value={language}
                onChange={handleLanguageChange}
                className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                submitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
          
          <div className="border-b">
            <Editor
              height="500px"
              language={language}
              value={code}
              onChange={setCode}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
              }}
            />
          </div>
          
          {/* Results */}
          {results && (
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Results</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">Status:</span>
                  {getStatusBadge(results.status)}
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">Score:</span>
                  <span className="text-sm font-medium">{results.score} / {problem.Points}</span>
                </div>
                
                {results.executionTime && (
                  <div>
                    <span className="text-sm font-medium mr-2">Execution Time:</span>
                    <span className="text-sm">{results.executionTime} seconds</span>
                  </div>
                )}
                
                {results.memoryUsed && (
                  <div>
                    <span className="text-sm font-medium mr-2">Memory Used:</span>
                    <span className="text-sm">{results.memoryUsed} KB</span>
                  </div>
                )}
                
                {results.message && (
                  <div>
                    <span className="text-sm font-medium text-red-600 mb-1 block">Error:</span>
                    <pre className="bg-red-50 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap text-red-700">
                      {results.message}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail; 