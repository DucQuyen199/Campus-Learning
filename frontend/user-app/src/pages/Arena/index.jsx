import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { 
  ArrowLeftIcon,
  ClockIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  DocumentTextIcon,
  BeakerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { API_URL } from '../../config';
import { 
  getCompetitionById,
  getCompetitionProblems,
  submitSolution,
  getCompletedProblems,
  getSubmittedSolution,
  checkRegistrationStatus,
  registerCompetition
} from '../../api/competitionApi';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { Tooltip, Button } from 'antd';

// Add cursor blink animation
const cursorBlinkStyle = `
  @keyframes cursorBlink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .animate-cursor-blink {
    animation: cursorBlink 1s infinite;
  }
`;

// Programming languages supported
const PROGRAMMING_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: 'js', value: 'javascript' },
  { id: 'python', name: 'Python', extension: 'py', value: 'python' },
  { id: 'java', name: 'Java', extension: 'java', value: 'java' },
  { id: 'cpp', name: 'C++', extension: 'cpp', value: 'cpp' },
  { id: 'csharp', name: 'C#', extension: 'cs', value: 'csharp' },
];

// Default editor options
const editorOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  fontSize: 16,
  tabSize: 2,
  wordWrap: 'on',
  lineNumbers: 'on',
  folding: true,
  lineDecorationsWidth: 10,
  renderLineHighlight: 'all',
  fontLigatures: true,
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: true,
  formatOnPaste: true,
  formatOnType: true,
  renderWhitespace: 'selection',
  bracketPairColorization: { enabled: true },
};

// Hàm trả về mã khởi đầu cho từng ngôn ngữ lập trình
const getDefaultStarterCode = (language) => {
  switch (language) {
    case 'javascript':
      return '// Viết code JavaScript của bạn ở đây\n\nfunction main() {\n  console.log("Hello World!");\n}\n\nmain();';
    case 'python':
      return '# Viết code Python của bạn ở đây\n\ndef main():\n    print("Hello World!")\n\nif __name__ == "__main__":\n    main()';
    case 'java':
      return 'public class Main {\n    public static void main(String[] args) {\n        // Viết code Java của bạn ở đây\n        System.out.println("Hello World!");\n    }\n}';
    case 'cpp':
      return '#include <iostream>\n\nint main() {\n    // Viết code C++ của bạn ở đây\n    std::cout << "Hello World!" << std::endl;\n    return 0;\n}';
    case 'csharp':
      return 'using System;\n\nclass Program {\n    static void Main() {\n        // Viết code C# của bạn ở đây\n        Console.WriteLine("Hello World!");\n    }\n}';
    default:
      return '// Viết code của bạn ở đây';
  }
};

// Define default templates for different programming languages
const LANGUAGE_TEMPLATES = {
  javascript: `// Bạn đang chọn ngôn ngữ JavaScript, hãy viết đúng cú pháp
// Sử dụng console.log() để in kết quả

// Ví dụ:
function solveProblem(input) {
  // Giải quyết vấn đề ở đây
  return "Kết quả của bài toán";
}

// Đây là hàm main
function main() {
  const result = solveProblem();
  console.log(result);
}

main();
`,
  python: `# Bạn đang chọn ngôn ngữ Python, hãy viết đúng cú pháp
# Sử dụng print() để xuất kết quả

# Ví dụ:
def solve_problem(input):
    # Giải quyết vấn đề ở đây
    return "Kết quả của bài toán"

# Đây là hàm main
def main():
    result = solve_problem()
    print(result)

if __name__ == "__main__":
    main()
`,
  java: `// Bạn đang chọn ngôn ngữ Java, hãy viết đúng cú pháp
// Biên dịch cho chương trình chạy ở đây: class Main với hàm main()

public class Main {
    // Hàm giải quyết vấn đề
    public static String solveProblem() {
        // Giải quyết vấn đề ở đây
        return "Kết quả của bài toán";
    }
    
    // Hàm main để chạy chương trình
    public static void main(String[] args) {
        String result = solveProblem();
        System.out.println(result);
    }
}
`,
  cpp: `// Bạn đang chọn ngôn ngữ C++, hãy viết đúng cú pháp
#include <iostream>
#include <string>
using namespace std;

// Hàm giải quyết vấn đề
string solveProblem() {
    // Giải quyết vấn đề ở đây
    return "Kết quả của bài toán";
}

// Hàm main để chạy chương trình
int main() {
    string result = solveProblem();
    cout << result << endl;
    return 0;
}
`,
  c: `// Bạn đang chọn ngôn ngữ C, hãy viết đúng cú pháp
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Hàm giải quyết vấn đề
void solveProblem() {
    // Giải quyết vấn đề ở đây
    printf("Kết quả của bài toán\\n");
}

// Hàm main để chạy chương trình
int main() {
    solveProblem();
    return 0;
}
`,
  csharp: `// Bạn đang chọn ngôn ngữ C#, hãy viết đúng cú pháp
using System;

class Program {
    // Hàm giải quyết vấn đề
    static string SolveProblem() {
        // Giải quyết vấn đề ở đây
        return "Kết quả của bài toán";
    }
    
    // Hàm main để chạy chương trình
    static void Main() {
        string result = SolveProblem();
        Console.WriteLine(result);
    }
}
`,
  ruby: `# Bạn đang chọn ngôn ngữ Ruby, hãy viết đúng cú pháp
# Sử dụng puts để in kết quả

# Hàm giải quyết vấn đề
def solve_problem
  # Giải quyết vấn đề ở đây
  return "Kết quả của bài toán"
end

# Hàm main
def main
  result = solve_problem
  puts result
end

main
`,
  typescript: `// Bạn đang chọn ngôn ngữ TypeScript, hãy viết đúng cú pháp
// Sử dụng console.log() để in kết quả

// Ví dụ:
function solveProblem(input: any): string {
  // Giải quyết vấn đề ở đây
  return "Kết quả của bài toán";
}

// Đây là hàm main
function main(): void {
  const result = solveProblem(null);
  console.log(result);
}

main();
`,
  php: `<?php
// Bạn đang chọn ngôn ngữ PHP, hãy viết đúng cú pháp
// Sử dụng echo hoặc print để in kết quả

// Hàm giải quyết vấn đề
function solveProblem() {
    // Giải quyết vấn đề ở đây
    return "Kết quả của bài toán";
}

// Hàm main để chạy chương trình
function main() {
    $result = solveProblem();
    echo $result . "\\n";
}

main();
?>
`
};

// Add a function to detect programming language from code
const detectProgrammingLanguage = (code) => {
  if (!code || code.trim() === '') return null;
  
  // Convert code to lowercase for case-insensitive matching
  const codeLC = code.toLowerCase();
  let scores = {
    python: 0,
    cpp: 0,
    java: 0,
    csharp: 0,
    javascript: 0
  };
  
  // Python indicators (more precise patterns)
  if (codeLC.includes('def ') && codeLC.includes(':')) scores.python += 5;
  if (codeLC.includes('print(')) scores.python += 3;
  if (/import\s+[a-zA-Z_][a-zA-Z0-9_]*/.test(codeLC)) scores.python += 3;
  if (codeLC.includes('elif ') || codeLC.includes('else:')) scores.python += 5;
  if (/class\s+[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(codeLC)) scores.python += 4;
  if (/for\s+[a-zA-Z_][a-zA-Z0-9_]*\s+in\s+/.test(codeLC)) scores.python += 5;
  if (codeLC.includes('range(')) scores.python += 3;
  if (codeLC.includes('__init__')) scores.python += 5;
  if (codeLC.includes('input(')) scores.python += 3;
  if (codeLC.match(/if\s+.*?\s*:/)) scores.python += 3;
  // Count indentation and ':' as strong Python indicators
  const colonCount = (codeLC.match(/:/g) || []).length;
  if (colonCount > 2) scores.python += colonCount;
  const indentCount = (code.match(/^[ \t]+/gm) || []).length;
  if (indentCount > 2) scores.python += Math.min(indentCount, 5);
  
  // C++ indicators (more precise patterns)
  if (/#include\s*<[a-zA-Z0-9_./]+>/.test(codeLC)) scores.cpp += 5;
  if (codeLC.includes('using namespace std')) scores.cpp += 5;
  if (/int\s+main\s*\(/.test(codeLC) || /void\s+main\s*\(/.test(codeLC)) scores.cpp += 4;
  if (/cout\s*<</.test(codeLC)) scores.cpp += 4;
  if (/cin\s*>>/.test(codeLC)) scores.cpp += 4;
  if (/std::[a-zA-Z0-9_]+/.test(codeLC)) scores.cpp += 3;
  if (/#define/.test(codeLC)) scores.cpp += 3;
  if (/\)\s*{\s*$/.test(codeLC)) scores.cpp += 2;
  if (/#include\s*<(vector|string|map|algorithm|iostream|cstdio)>/.test(codeLC)) scores.cpp += 4;
  
  // Java indicators (more precise patterns)
  if (/public\s+class\s+[A-Za-z0-9_]+/.test(codeLC)) scores.java += 5;
  if (/public\s+static\s+void\s+main/.test(codeLC)) scores.java += 5;
  if (/System\.out\.print(ln)?\(/.test(codeLC)) scores.java += 4;
  if (/import\s+java\./.test(codeLC)) scores.java += 5;
  if (/extends\s+[A-Za-z0-9_]+/.test(codeLC)) scores.java += 3;
  if (/implements\s+[A-Za-z0-9_]+/.test(codeLC)) scores.java += 3;
  if (/@Override/.test(codeLC)) scores.java += 5;
  if (/new\s+[A-Za-z0-9_]+\s*\(/.test(codeLC)) scores.java += 2;
  if (/String\[\]\s+args/.test(codeLC)) scores.java += 3;
  
  // C# indicators (more precise patterns)
  if (/using\s+System;/i.test(codeLC)) scores.csharp += 5;
  if (/namespace\s+[A-Za-z0-9_]+/.test(codeLC)) scores.csharp += 4;
  if (/Console\.Write(Line)?\(/.test(codeLC)) scores.csharp += 4;
  if (/static\s+void\s+Main\s*\(string\[\]\s+args\)/.test(codeLC)) scores.csharp += 5;
  if (/\.(NET|cs|csproj)/.test(codeLC)) scores.csharp += 3;
  if (/public\s+class\s+[A-Za-z0-9_]+/.test(codeLC) && /Console\./.test(codeLC)) scores.csharp += 4;
  
  // JavaScript indicators (more precise patterns)
  if (/console\.log\(/.test(codeLC)) scores.javascript += 4;
  if (/function\s+[A-Za-z0-9_]*\s*\(/.test(codeLC)) scores.javascript += 3;
  if (/const\s+/.test(codeLC) || /let\s+/.test(codeLC) || /var\s+/.test(codeLC)) scores.javascript += 3;
  if (/document\./.test(codeLC)) scores.javascript += 4;
  if (/\)\s*=>\s*{/.test(codeLC) || /\)\s*=>/.test(codeLC)) scores.javascript += 4;
  if (/\.addEventListener\(/.test(codeLC)) scores.javascript += 4;
  if (/===/.test(codeLC) || /!==/.test(codeLC)) scores.javascript += 3;
  if (/\$\(/.test(codeLC) || /jQuery\(/.test(codeLC)) scores.javascript += 4;
  if (/Promise\(/.test(codeLC) || /async\s+function/.test(codeLC) || /await\s+/.test(codeLC)) scores.javascript += 4;
  if (/\[.*\]\.map\(/.test(codeLC) || /\[.*\]\.filter\(/.test(codeLC)) scores.javascript += 3;
  
  // Common patterns that can help disambiguate
  // C++, Java & C# have semicolons and braces, Python doesn't
  if (codeLC.includes(';') && codeLC.includes('{') && codeLC.includes('}')) {
    scores.python -= 4;
  }
  
  // JavaScript doesn't usually have types before variables
  if (/int\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(codeLC) || 
      /float\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(codeLC) ||
      /double\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(codeLC)) {
    scores.javascript -= 3;
  }
  
  // Python doesn't use braces for blocks
  if (codeLC.includes('{') && codeLC.includes('}')) {
    scores.python -= 3;
  }
  
  // JavaScript doesn't usually have strict types
  if (/void\s+/.test(codeLC) || /int\s+/.test(codeLC) || /double\s+/.test(codeLC)) {
    scores.javascript -= 2;
  }
  
  // Find highest scoring language
  let maxScore = 0;
  let detectedLang = null;
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore && score >= 3) { // Only consider if score is significant
      maxScore = score;
      detectedLang = lang;
    }
  }
  
  console.log('Language detection scores:', scores, 'Detected:', detectedLang);
  
  if (detectedLang) {
    return PROGRAMMING_LANGUAGES.find(lang => lang.id === detectedLang);
  }
  
  return null;
};

// Define styles for buttons
const styles = {
  actionButton: 'flex items-center justify-center p-2 rounded-md transition-colors',
  activeButton: 'bg-blue-600 text-white'
};

const Arena = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [initializing, setInitializing] = useState(true);
  const [competition, setCompetition] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  const [solution, setSolution] = useState('');
  const [submittedSolutions, setSubmittedSolutions] = useState({}); // Add state for submitted solutions
  const [isDockerAvailable, setIsDockerAvailable] = useState(false);
  const [checkingDocker, setCheckingDocker] = useState(true);
  const [recentlyDetected, setRecentlyDetected] = useState(false); // State to track if we just loaded a submitted solution
  
  // Track problems that have been completed
  const [completedProblems, setCompletedProblems] = useState([]);
  const [solutionLocked, setSolutionLocked] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [isCompetitionActive, setIsCompetitionActive] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showTestResults, setShowTestResults] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [actualOutput, setActualOutput] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(PROGRAMMING_LANGUAGES[0]);
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalRef = useRef(null);
  
  // UI state for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    inputFormat: true,
    outputFormat: true,
    sampleCases: true,
  });

  // Add these new state variables
  const [terminalMode, setTerminalMode] = useState('command'); // 'command' or 'input'
  const [programInputs, setProgramInputs] = useState([]);
  const [expectedOutputs, setExpectedOutputs] = useState([]);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false); // Changed to false by default
  const [editorTheme, setEditorTheme] = useState('vs-light'); // Changed default to light theme
  const [terminalHeight, setTerminalHeight] = useState(300); // Increased default terminal height
  const [minTerminalHeight, setMinTerminalHeight] = useState(100); // Minimum terminal height
  const [maxTerminalHeight, setMaxTerminalHeight] = useState(600); // Maximum terminal height
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);
  const [isInputRequested, setIsInputRequested] = useState(false);
  const [executionId, setExecutionId] = useState(null);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [detectedInputs, setDetectedInputs] = useState([]);
  const [inputForms, setInputForms] = useState([]);
  const [currentInputIndex, setCurrentInputIndex] = useState(0);
  const [showInputForm, setShowInputForm] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputPrompt, setInputPrompt] = useState('');
  // Always enabled, no toggle needed
  // const [isAutoDetectEnabled, setIsAutoDetectEnabled] = useState(true);
  const [dockerCheckPerformed, setDockerCheckPerformed] = useState(false);

  // Effect to load competition data and check if user is participating
  useEffect(() => {
    const fetchInitialData = async () => {
      // If we don't have an ID, no need to proceed
      if (!id) {
        toast.error('Competition ID is required');
        navigate('/competitions');
        return;
      }
      
      try {
        // Check if user is logged in
        if (!currentUser) {
          toast.error('Please log in to participate in competitions');
          navigate('/login', { state: { from: location.pathname } });
          return;
        }
        
        // Check Docker availability
        checkDockerAvailability();
        
        // Fetch competition data
        await fetchCompetitionData();
        
        // Fetch problems for this competition
        await fetchProblems();
      } catch (error) {
        console.error('Error initializing arena:', error);
        toast.error('Failed to load competition data');
      } finally {
        setInitializing(false);
      }
      
      // Load completed problems from localStorage and API
      fetchCompletedProblems();
    };
    
    fetchInitialData();
  }, [id, navigate, currentUser]);

  // Add new function to fetch completed problems
  const fetchCompletedProblems = async () => {
    try {
      // First try to get from localStorage for immediate display
      const localStorageKey = `completedProblems_${id}`;
      const localCompleted = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      
      if (localCompleted.length > 0) {
        setCompletedProblems(localCompleted);
      }
      
      // Then try to get from API if user is logged in
      if (currentUser?.token) {
        const apiCompletedProblems = await getCompletedProblems(id, currentUser.token);
        
        if (apiCompletedProblems && apiCompletedProblems.length > 0) {
          // Combine with local storage, removing duplicates
          const allCompleted = [...new Set([...localCompleted, ...apiCompletedProblems.map(p => p.ProblemID)])];
          setCompletedProblems(allCompleted);
          
          // Update localStorage
          localStorage.setItem(localStorageKey, JSON.stringify(allCompleted));
        }
      }
    } catch (error) {
      console.error('Error fetching completed problems:', error);
    }
  };

  useEffect(() => {
    fetchCompetitionData();
    fetchProblems();
    // Silently check Docker availability on component mount
    checkDockerAvailability().then(isAvailable => {
      console.log(`Docker availability checked silently: ${isAvailable ? 'Available' : 'Not Available'}`);
    });
    
    // Apply default template for the selected language if no solution exists
    if (!solution) {
      setSolution(LANGUAGE_TEMPLATES[selectedLanguage.id] || '');
    }
    
    // Check if we have the competition title from the details page
    if (location.state?.competitionTitle) {
      document.title = `${location.state.competitionTitle} - Đấu trường`;
    }
    
    // Add the cursor blink animation style to the document
    const styleElement = document.createElement('style');
    styleElement.innerHTML = cursorBlinkStyle;
    document.head.appendChild(styleElement);
    
    // Cleanup style element on component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [id, location.state]);  // Remove selectedLanguage.id dependency to prevent reloads

  // Improve Docker availability check to be more robust
  const checkDockerAvailability = async () => {
    try {
      // Silently check Docker availability without adding to terminal history
      const response = await fetch(`${API_URL}/api/code-execution/health`, {
        headers: {
          'Authorization': currentUser?.token ? `Bearer ${currentUser.token}` : ''
        },
        timeout: 5000, // Add shorter timeout for health checks
        signal: AbortSignal.timeout(5000) // Use abort controller with timeout
      }).catch((error) => {
        console.error('Health check failed:', error);
        return { ok: false };
      });
      
      // Check if response is valid
      if (!response.ok) {
        setIsDockerAvailable(false);
        return false;
      }
      
      try {
        const data = await response.json();
        
        // Updated to match the format in executionService.js
        const isAvailable = data.status === 'ok';
        setIsDockerAvailable(isAvailable);
        
        return isAvailable;
      } catch (parseError) {
        console.error('Error parsing health check response:', parseError);
        setIsDockerAvailable(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking Docker availability:', error);
      setIsDockerAvailable(false);
      return false;
    }
  };

  useEffect(() => {
    // Set up timer for remaining time
    let timer;
    if (competition && isCompetitionActive) {
      const endTime = new Date(competition.EndTime).getTime();
      
      timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        if (distance <= 0) {
          clearInterval(timer);
          setIsCompetitionActive(false);
          toast.info('Cuộc thi đã kết thúc!');
          return;
        }
        
        // Calculate time units
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setRemainingTime({
          hours,
          minutes,
          seconds
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [competition, isCompetitionActive]);

  useEffect(() => {
    // When active problem changes, load starter code if available
    if (activeProblem?.StarterCode) {
      setSolution(activeProblem.StarterCode);
    } else if (!solution) {
      // Apply language template if no starter code AND no existing solution
      setSolution(LANGUAGE_TEMPLATES[selectedLanguage.id] || '');
    }
    
    // When a new problem is selected, set all problem information sections to expanded
    setExpandedSections({
      description: true,
      inputFormat: true,
      outputFormat: true,
      sampleCases: true,
    });
    
    // If there are visible test cases, load the first one
    if (activeProblem?.TestCasesVisible) {
      try {
        const testCases = JSON.parse(activeProblem.TestCasesVisible);
        if (testCases && testCases.length > 0) {
          setTestInput(testCases[0].input || '');
          setExpectedOutput(testCases[0].output || '');
        }
      } catch (error) {
        console.error('Error parsing test cases:', error);
      }
    }
  }, [activeProblem]);  // Remove selectedLanguage.id dependency to prevent reloads

  const fetchCompetitionData = async () => {
    try {
      setLoading(true);
      
      const data = await getCompetitionById(id, currentUser?.token);
      
      if (data) {
        setCompetition(data);
        
        // Check if competition is active
        const now = new Date();
        const startTime = new Date(data.StartTime);
        const endTime = new Date(data.EndTime);
        
        setIsCompetitionActive(now >= startTime && now < endTime);
      } else {
        toast.error('Không thể tải thông tin cuộc thi');
        navigate('/competitions');
      }
    } catch (error) {
      console.error('Error fetching competition details:', error);
      toast.error('Lỗi khi tải thông tin cuộc thi');
      navigate('/competitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const data = await getCompetitionProblems(id, currentUser?.token);
      
      if (data && data.length > 0) {
        setProblems(data);
        setActiveProblem(data[0]);
      } else {
        toast.error('Không có bài tập nào cho cuộc thi này');
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
      toast.error('Lỗi khi tải danh sách bài tập');
    }
  };

  // Update fetchSubmittedSolution to better handle the API response format
  const fetchSubmittedSolution = async (problemId) => {
    try {
      if (!currentUser?.token) {
        console.log('No authentication token available');
        addToTerminalHistory('error', 'Bạn cần đăng nhập để xem bài nộp.');
        return null;
      }
      
      console.log(`Fetching submitted solution for problem ${problemId} in competition ${id}`);
      addToTerminalHistory('system', `Đang tải bài nộp cho bài ${problemId}...`);
      
      // Kiểm tra xem đã đăng ký cuộc thi chưa
      try {
        const registrationStatus = await checkRegistrationStatus(id, currentUser.token);
        if (!registrationStatus.isRegistered) {
          addToTerminalHistory('system', 'Bạn chưa đăng ký cuộc thi này. Đang tự động đăng ký...');
          
          // Tự động đăng ký
          try {
            await registerCompetition(id, currentUser.token);
            addToTerminalHistory('success', 'Đã đăng ký cuộc thi thành công.');
          } catch (regError) {
            console.error('Error registering for competition:', regError);
            addToTerminalHistory('error', 'Không thể tự động đăng ký cuộc thi.');
            return null;
          }
        }
      } catch (statusError) {
        console.error('Error checking registration status:', statusError);
        addToTerminalHistory('error', 'Không thể kiểm tra trạng thái đăng ký cuộc thi.');
        return null;
      }
      
      try {
        const response = await getSubmittedSolution(id, problemId, currentUser.token);
        
        console.log('Full solution response:', response);
        
        if (response && response.success && response.sourceCode) {
          console.log(`Solution found for problem ${problemId}, status: ${response.status || 'unknown'}`);
          
          // Check if the solution is accepted or not
          const isAccepted = response.status === 'accepted';
          if (isAccepted) {
            addToTerminalHistory('success', 'Đã tải bài nộp thành công đã hoàn thành.');
          } else {
            addToTerminalHistory('warning', `Đã tìm thấy bài nộp đã nộp trước đó nhưng chưa hoàn thành (${response.status || 'chưa chấp nhận'}).`);
          }
          
          setRecentlyDetected(true);
          return response.sourceCode;
        }
        
        console.log(`No solution found for problem ${problemId}`);
        addToTerminalHistory('warning', 'Không tìm thấy bài nộp cho bài này.');
        setRecentlyDetected(false);
        return null;
      } catch (error) {
        console.error('Error fetching submitted solution:', error);
        
        // API now returns 200 even for errors, so we need to check if we have response data
        if (error.response && error.response.data) {
          // Extract error message from response
          const errorMessage = error.response.data.message || 'Unknown error';
          addToTerminalHistory('error', `Lỗi khi tải bài nộp: ${errorMessage}`);
        } else {
          addToTerminalHistory('error', `Lỗi khi tải bài nộp: ${error.message}`);
        }
        
        setRecentlyDetected(false);
        return null;
      }
    } catch (error) {
      console.error('Unexpected error in fetchSubmittedSolution:', error);
      addToTerminalHistory('error', 'Lỗi không xác định khi tải bài nộp.');
      setRecentlyDetected(false);
      return null;
    }
  };

  // Update handleProblemSelect to show the starter code properly
  const handleProblemSelect = async (problem) => {
    // Set the new active problem
    setActiveProblem(problem);
    
    // Check if this problem has been completed
    const isProblemCompleted = completedProblems.includes(problem.ProblemID);
    setSolutionLocked(isProblemCompleted);
    
    // Nếu bài tập đã hoàn thành, tự động đóng terminal nếu đang mở
    if (isProblemCompleted && isTerminalVisible) {
      setIsTerminalVisible(false);
    }
    
    // Reset recentlyDetected state
    setRecentlyDetected(false);
    
    // Show debug info
    console.log('Problem selected:', problem);
    console.log('Is problem completed?', isProblemCompleted);
    
    // First try to use a submitted solution 
    let foundSolution = false;
    
    // For completed problems, try to fetch the submitted solution
    if (isProblemCompleted) {
      // First add message to terminal
      addToTerminalHistory('system', 'Đang tải bài nộp đã hoàn thành...');
      
      // Check if we already have the submitted solution cached
      if (submittedSolutions[problem.ProblemID]) {
        console.log('Using cached submitted solution');
        setSolution(submittedSolutions[problem.ProblemID]);
        setRecentlyDetected(true);
        foundSolution = true;
        
        // Detect language from submitted solution
        const detectedLang = detectProgrammingLanguage(submittedSolutions[problem.ProblemID]);
        if (detectedLang && detectedLang.id !== selectedLanguage.id) {
          setSelectedLanguage(detectedLang);
          addToTerminalHistory('system', `Đã phát hiện ngôn ngữ từ bài nộp: ${detectedLang.name}`);
        }
        
        // Add warning that solution is readonly
        addToTerminalHistory('system', 'Bài tập đã hoàn thành, bạn chỉ có thể xem code.');
      } else {
        // Try to fetch the submitted solution from the API
        try {
          console.log('Fetching submitted solution from API');
          const submittedSolution = await fetchSubmittedSolution(problem.ProblemID);
          
          if (submittedSolution) {
            console.log('Submitted solution found:', submittedSolution.substring(0, 50) + '...');
            // Cache the submitted solution
            setSubmittedSolutions(prev => ({
              ...prev,
              [problem.ProblemID]: submittedSolution
            }));
            
            setSolution(submittedSolution);
            foundSolution = true;
            
            // Detect language from submitted solution
            const detectedLang = detectProgrammingLanguage(submittedSolution);
            if (detectedLang && detectedLang.id !== selectedLanguage.id) {
              setSelectedLanguage(detectedLang);
              addToTerminalHistory('system', `Đã phát hiện ngôn ngữ từ bài nộp: ${detectedLang.name}`);
            }
            
            addToTerminalHistory('success', 'Đã tải thành công bài nộp đã hoàn thành.');
            // Add warning that solution is readonly
            addToTerminalHistory('system', 'Bài tập đã hoàn thành, bạn chỉ có thể xem code.');
          }
        } catch (error) {
          console.error('Error in handleProblemSelect when fetching solution:', error);
        }
      }
    }
    
    // If nothing found, use starter code
    if (!foundSolution) {
      console.log('Using starter code');
      const starterCode = problem.StarterCode || getDefaultStarterCode(selectedLanguage.id);
      setSolution(starterCode);
      addToTerminalHistory('system', 'Đã tải mã khởi đầu.');
    }
  };

  // Modify handleEditorChange to immediately detect language on paste
  const handleEditorChange = (value) => {
    // Không cho phép sửa đổi nếu bài đã hoàn thành
    if (solutionLocked) return;
    
    // Cập nhật giá trị solution
    setSolution(value);
    
    // Thêm logic phát hiện ngôn ngữ
    if (value && value.length > 0) {
      // Nếu chúng ta vừa phát hiện được một solution đã tồn tại, bỏ qua việc phát hiện ngôn ngữ
      if (recentlyDetected) {
        setRecentlyDetected(false);
      } else {
        // For regular typing, only detect after certain triggers or enough content
        const shouldAttemptDetection = 
          value.length > 50 || // Enough content overall
          value.includes('#include') || // C/C++ indicator
          value.includes('import ') || // Java, Python, etc. indicator
          value.includes('function ') || // JavaScript indicator
          value.includes('def ') || // Python indicator
          value.includes('class ') || // OOP indicator
          value.includes('public static void main'); // Java indicator
        
        if (shouldAttemptDetection) {
          const detectedLang = detectProgrammingLanguage(value);
          if (detectedLang && detectedLang.id !== selectedLanguage.id) {
            // Language detected is different from current selection
            setSelectedLanguage(detectedLang);
            toast.success(`Đã chuyển sang ngôn ngữ ${detectedLang.name}`, {
              duration: 2000,
              icon: '🔍'
            });
          }
        }
      }
    }
  };

  const handleRunCode = async () => {
    if (!solution.trim()) {
      toast.error('Vui lòng nhập giải pháp trước khi chạy');
      return;
    }

    if (solutionLocked) {
      toast.info('Bạn đã hoàn thành bài tập này. Không thể chạy code thêm.');
      return;
    }

    // Kiểm tra Docker có sẵn không
    if (!isDockerAvailable && !dockerCheckPerformed) {
      setDockerCheckPerformed(true);
      toast.info('Đang kiểm tra kết nối đến dịch vụ chạy code...');
    }

    try {
      // Nếu có autodetect language thì cập nhật ngôn ngữ trước khi chạy
      if (solution) {
        const detectedLanguage = detectLanguage(solution);
        if (detectedLanguage && detectedLanguage !== selectedLanguage.id) {
          const langObj = languages.find(l => l.id === detectedLanguage);
          if (langObj) {
            setSelectedLanguage(langObj);
            addToTerminalHistory('system', `Đã tự động chuyển sang ngôn ngữ ${langObj.name}`);
          }
        }
      }

      // Hiển thị terminal nếu chưa hiển thị
      if (!isTerminalVisible) {
        setIsTerminalVisible(true);
      }

      // Đặt terminal ở chế độ lệnh
      setTerminalMode('command');
      addToTerminalHistory('command', `Đang chạy code ${selectedLanguage.name}...`);

      // Đặt trạng thái đang chạy
      setIsRunning(true);

      // Kiểm tra xem bài toán hiện tại có cần input không
      const requiresInput = checkIfProblemRequiresInput();
      
      // Chạy code với Docker
      const result = await executeCodeWithDocker();
      
      // Nếu có kết quả đầu ra và không có input, kiểm tra kết quả ngay lập tức
      if (result && result.stdout && !requiresInput) {
        // Tự động kiểm tra kết quả sau 300ms để đảm bảo output đã được hiển thị
        setTimeout(() => {
          autoCheckSolution(result.stdout);
        }, 300);
      } 
      // Nếu cần input nhưng không có kết nối hoặc executionId
      else if (requiresInput && (!executionId || !isDockerAvailable)) {
        // Chỉ hiển thị gợi ý khi cần nhập input
        addToTerminalHistory('system', 'Nhập input theo đề bài vào terminal để kiểm tra kết quả tự động');
      }
    } catch (error) {
      console.error('Error running code:', error);
      addToTerminalHistory('error', `Lỗi chạy code: ${error.message}`);
      setIsRunning(false);
    }
  };
  
  // Hàm kiểm tra xem bài toán có cần input không dựa trên test case
  const checkIfProblemRequiresInput = () => {
    if (!activeProblem || !activeProblem.testCases || activeProblem.testCases.length === 0) {
      return false;
    }
    
    // Kiểm tra test case đầu tiên có input không
    const firstTestCase = activeProblem.testCases[0];
    return firstTestCase && firstTestCase.input && firstTestCase.input.trim().length > 0;
  };

  const handleSubmitSolution = async () => {
    if (!activeProblem || !solution.trim()) {
      toast.error('Vui lòng nhập giải pháp trước khi nộp');
      return;
    }
    
    // Check if problem is already completed
    if (completedProblems.includes(activeProblem.ProblemID)) {
      toast.info('Bài tập này đã được hoàn thành trước đó.');
      return;
    }
    
    try {
      // Auto-detect language before submitting
      const detectedLang = detectProgrammingLanguage(solution);
      if (detectedLang && detectedLang.id !== selectedLanguage.id) {
        setSelectedLanguage(detectedLang);
        addToTerminalHistory('system', `Đã tự động phát hiện ngôn ngữ: ${detectedLang.name}`);
      }
      
      setIsSubmitting(true);
      addToTerminalHistory('system', `Đang nộp giải pháp... (ngôn ngữ: ${selectedLanguage.name})`);
      
      // Validate that we can connect to the API before attempting submission
      try {
        // Simple API check
        const apiCheck = await fetch(`${API_URL}/api/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${currentUser?.token}`
          }
        }).catch(() => ({ ok: false }));
        
        if (!apiCheck.ok) {
          addToTerminalHistory('error', 'API service is not available. Cannot submit solution.');
          toast.error('API service is not available');
          return;
        }
        
        const response = await submitSolution(
          id, 
          activeProblem.ProblemID, 
          solution, 
          currentUser?.token,
          selectedLanguage.id
        );
        
        // Cache the solution only if submission is successful
        if (response && response.success) {
          // Store in submittedSolutions
          setSubmittedSolutions(prev => ({
            ...prev,
            [activeProblem.ProblemID]: solution
          }));
        }
        
        console.log('Submission response:', response);
        
        // Handle the response
        if (response && response.success) {
          addToTerminalHistory('success', 'Nộp bài thành công!');
          
          // Parse the test results
          const results = response.data;
          setTestResults(results);
          setShowTestResults(true);
          
          // Check if all test cases passed
          const allTestsPassed = results.passed;
          const score = results.score || 0;
          const execTime = results.executionTime ? (results.executionTime / 1000).toFixed(2) : 0;
          
          // Thêm thông tin chi tiết về kết quả
          addToTerminalHistory('system', `Thời gian thực thi: ${execTime}s`);
          
          if (allTestsPassed) {
            // Nếu tất cả test cases đều đúng
            addToTerminalHistory('success', `✅ Tất cả các test cases đều đúng!`);
            addToTerminalHistory('success', `Điểm số: ${score} (Chỉ tính khi TẤT CẢ các test case đều đúng)`);
            
            // Thông báo với toast
            toast.success(`Chúc mừng! Bạn đã giải đúng bài tập và nhận được ${score} điểm!`, {
              duration: 5000,
              icon: '🎉'
            });
            
            // Đánh dấu bài tập là đã hoàn thành
            try {
              const completedProblems = JSON.parse(localStorage.getItem(`completedProblems_${id}`) || '[]');
              if (!completedProblems.includes(activeProblem.ProblemID)) {
                completedProblems.push(activeProblem.ProblemID);
                localStorage.setItem(`completedProblems_${id}`, JSON.stringify(completedProblems));
                
                // Update state
                setCompletedProblems(completedProblems);
                setSolutionLocked(true);
              }
            } catch (err) {
              console.error('Error updating completed problems in localStorage:', err);
            }
            
            // Add visual indicator that the problem is completed
            setTerminalHistory(prev => [
              ...prev,
              {
                id: Date.now() + Math.random().toString(36).substring(2, 9),
                type: 'success',
                content: '✅ Bài tập đã được đánh dấu là hoàn thành trong danh sách cuộc thi!'
              }
            ]);
            
            // Thông báo thứ hạng đã được cập nhật
            toast.success('Thứ hạng của bạn đang được cập nhật!', {
              duration: 3000,
              icon: '🏆'
            });
            
            // Thông báo về thời gian
            if (execTime < 1) {
              addToTerminalHistory('success', `⚡ Giải pháp của bạn rất nhanh! (${execTime}s)`);
              addToTerminalHistory('info', `Bạn được cộng điểm thưởng cho thời gian thực thi nhanh!`);
            } else if (execTime < 2) {
              addToTerminalHistory('success', `Thời gian thực thi tốt! (${execTime}s)`);
              addToTerminalHistory('info', `Bạn được cộng một phần điểm thưởng cho thời gian thực thi.`);
            } else {
              addToTerminalHistory('system', `Thời gian thực thi: ${execTime}s`);
            }
          } else {
            // Nếu có test case bị sai
            const passedCount = results.testCases ? results.testCases.filter(tc => tc.passed).length : 0;
            const totalCount = results.testCases ? results.testCases.length : 0;
            
            addToTerminalHistory('error', `❌ Giải pháp chưa đúng cho tất cả các test cases!`);
            addToTerminalHistory('system', `Đúng ${passedCount}/${totalCount} test cases`);
            addToTerminalHistory('warning', `Lưu ý: Điểm chỉ được tính khi TẤT CẢ các test case đều đúng.`);
            
            toast.error(`Giải pháp chưa đúng cho tất cả các test cases (${passedCount}/${totalCount})`, {
              duration: 4000
            });
          }
        } else {
          toast.error(response?.message || 'Nộp bài thất bại');
          addToTerminalHistory('error', `Submission failed: ${response?.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error submitting solution:', error);
        toast.error('Lỗi khi nộp bài');
        addToTerminalHistory('error', `Error submitting solution: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error in handleSubmitSolution:', error);
      toast.error('Lỗi không xác định khi nộp bài');
      addToTerminalHistory('error', `Unexpected error: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  const handleCompareWithTestKey = async () => {
    if (!activeProblem || !solution.trim()) {
      toast.error('Vui lòng nhập giải pháp và chạy mã trước khi so sánh');
      return;
    }
    
    if (!isDockerAvailable) {
      toast.error('Docker execution environment is not available');
      addToTerminalHistory('error', 'Docker execution environment is not available. Cannot test solution.');
      return;
    }
    
    try {
      setIsComparing(true);
      addToTerminalHistory('system', 'Testing solution against expected outputs...');
      
      // First, run the code to get actual output
      await executeCodeWithDocker();
      
      // In a real implementation, we would compare the actual output with test cases
      // For simulation purposes, we'll check if the actual output contains expected patterns
      
      setTimeout(() => {
        const actual = actualOutput.toLowerCase();
        const expected = expectedOutput.toLowerCase();
        
        // Simple pattern matching
        const isCorrect = actual.includes(expected) || 
                         (expected.length > 0 && actual.split('\n').some(line => 
                           line.trim() && expected.split('\n').some(expLine => 
                             expLine.trim() && line.includes(expLine.trim())
                           )
                         ));
        
        const resultMessage = isCorrect 
          ? 'Solution passed the test case!' 
          : 'Solution failed the test case.';
          
        const detailMessage = isCorrect 
          ? 'Your output matches the expected pattern.' 
          : 'Your output does not match the expected pattern.';
        
        setTestResults({
          success: isCorrect,
          message: resultMessage,
          details: detailMessage
        });
        
        setShowTestResults(true);
        setIsComparing(false);
        
        addToTerminalHistory(isCorrect ? 'system' : 'error', resultMessage);
        addToTerminalHistory(isCorrect ? 'system' : 'error', detailMessage);
        
        // Display expected vs actual output
        if (!isCorrect && testInput && expectedOutput) {
          addToTerminalHistory('system', 'Test case:');
          addToTerminalHistory('input', testInput);
          addToTerminalHistory('system', 'Expected output:');
          addToTerminalHistory('output', expectedOutput);
          addToTerminalHistory('system', 'Your output:');
          addToTerminalHistory(isCorrect ? 'output' : 'error', actualOutput || 'No output generated');
        }
        
        // If correct, mark the problem as completed
        if (isCorrect && activeProblem) {
          // Store the completed problem in localStorage
          try {
            const localStorageKey = `completedProblems_${id}`;
            const completedProblems = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
            
            if (!completedProblems.includes(activeProblem.ProblemID)) {
              completedProblems.push(activeProblem.ProblemID);
              localStorage.setItem(localStorageKey, JSON.stringify(completedProblems));
              
              // Add visual indicator that the problem is completed
              addToTerminalHistory('success', '✅ Bài tập đã được đánh dấu là hoàn thành trong danh sách cuộc thi!');
            }
          } catch (err) {
            console.error('Error updating completed problems in localStorage:', err);
          }
        }
        
        if (isCorrect) {
          toast.success('Giải pháp của bạn chính xác!');
        } else {
          toast.error('Giải pháp của bạn chưa chính xác');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error comparing solution:', error);
      toast.error('Lỗi khi so sánh giải pháp');
      addToTerminalHistory('error', `Error comparing solution: ${error.message}`);
      setIsComparing(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatTime = (time) => {
    if (!time) return '00:00:00';
    
    const { hours, minutes, seconds } = time;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Function to scroll to the bottom of terminal
  const scrollTerminalToBottom = () => {
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 100);
  };

  // Add focus handling for the terminal input
  const focusTerminalInput = () => {
    setTimeout(() => {
      const inputElement = document.getElementById('terminal-input');
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  // Terminal functionality
  const addToTerminalHistory = (type, content) => {
    const entry = {
      id: Date.now() + Math.random().toString(36).substring(2, 9), // Generate unique ID to avoid duplicate keys
      type,
      content,
      timestamp: new Date().toISOString()
    };
    
    setTerminalHistory(prev => [...prev, entry]);
    // Scroll to bottom of terminal
    scrollTerminalToBottom();
    // Focus the input after adding history
    focusTerminalInput();
  };
  
  const handleTerminalInputChange = (e) => {
    setTerminalInput(e.target.value);
  };
  
  // Hàm kiểm tra kết quả và tự động tính điểm
  const autoCheckSolution = async (input, output) => {
    if (!activeProblem) return;
    
    try {
      // Lấy test cases từ bài tập
      let testCases = [];
      try {
        if (activeProblem.TestCasesVisible) {
          const visibleTests = JSON.parse(activeProblem.TestCasesVisible);
          testCases = [...testCases, ...visibleTests];
        }
        if (activeProblem.TestCasesHidden) {
          const hiddenTests = JSON.parse(activeProblem.TestCasesHidden);
          testCases = [...testCases, ...hiddenTests];
        }
        
        // Nếu không có test cases, thử dùng SampleInput và SampleOutput
        if (testCases.length === 0 && activeProblem.SampleInput && activeProblem.SampleOutput) {
          testCases.push({
            input: activeProblem.SampleInput,
            output: activeProblem.SampleOutput
          });
        }
      } catch (error) {
        console.error('Error parsing test cases:', error);
      }
      
      // Nếu không có test cases nào, không thể kiểm tra
      if (testCases.length === 0) {
        addToTerminalHistory('system', 'Không thể kiểm tra kết quả: Không có test cases.');
        return false;
      }
      
      // Chuẩn hóa input và output trước khi so sánh
      const normalizedUserInput = normalizeString(input || '');
      const normalizedUserOutput = normalizeString(output || '');
      
      // Biến lưu trạng thái kiểm tra
      let foundMatchingTest = false;
      let allTestCasesPassed = true;
      let passedTestCases = [];
      let failedTestCases = [];
      
      // Kiểm tra với tất cả test cases
      for (const testCase of testCases) {
        const normalizedTestInput = normalizeString(testCase.input || '');
        const normalizedTestOutput = normalizeString(testCase.output || '');
        
        let matchedTestCase = false;
        
        // Nếu không có input hoặc test case không yêu cầu input
        if (!input || input.trim() === '' || !testCase.input || testCase.input.trim() === '') {
          // Kiểm tra trực tiếp output
          matchedTestCase = true;
          foundMatchingTest = true;
          
          // Kiểm tra nếu output khớp với expected output
          const outputMatches = compareStrings(normalizedUserOutput, normalizedTestOutput);
          
          if (outputMatches) {
            passedTestCases.push(testCase);
          } else {
            failedTestCases.push({
              ...testCase,
              userOutput: output.trim()
            });
            allTestCasesPassed = false;
          }
        } 
        // Nếu có input, kiểm tra cả input và output
        else if (compareStrings(normalizedUserInput, normalizedTestInput)) {
          matchedTestCase = true;
          foundMatchingTest = true;
          
          // Kiểm tra nếu output khớp với expected output
          const outputMatches = compareStrings(normalizedUserOutput, normalizedTestOutput);
          
          if (outputMatches) {
            passedTestCases.push(testCase);
          } else {
            failedTestCases.push({
              ...testCase,
              userOutput: output.trim()
            });
            allTestCasesPassed = false;
          }
        }
        
        // Log test case kết quả cho debug
        if (matchedTestCase) {
          console.log(`Matched test case: Input="${testCase.input || 'none'}", Expected="${testCase.output}", Actual="${output || 'none'}", Passed=${!failedTestCases.includes(testCase)}`);
        }
      }
      
      // Báo cáo kết quả kiểm tra
      if (foundMatchingTest) {
        if (allTestCasesPassed && passedTestCases.length > 0) {
          // Đánh dấu đã giải xong bài tập này nếu tất cả test cases đều pass
          addToTerminalHistory('success', '✅ Kết quả chính xác!');
          
          if (input && input.trim() !== '') {
            addToTerminalHistory('success', `Input: "${input.trim()}" => Output: "${output.trim()}"`);
          } else {
            addToTerminalHistory('success', `Output: "${output.trim()}"`);
          }
          
          // Kiểm tra xem bài tập đã được hoàn thành chưa
          const localStorageKey = `completedProblems_${id}`;
          const completedProbs = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
          
          if (!completedProbs.includes(activeProblem.ProblemID)) {
            // Thêm vào danh sách hoàn thành và lưu vào localStorage
            completedProbs.push(activeProblem.ProblemID);
            localStorage.setItem(localStorageKey, JSON.stringify(completedProbs));
            setCompletedProblems(completedProbs);
            setSolutionLocked(true);
            
            // Hiệu ứng chúc mừng
            triggerCelebration();
            
            // Thông báo
            addToTerminalHistory('success', '🎉 CHÚC MỪNG! Bài tập đã được đánh dấu là hoàn thành!');
            toast.success(`🎉 CHÚC MỪNG! Bạn đã hoàn thành bài "${activeProblem.Title}"!`, {
              duration: 5000,
              style: {
                background: '#10B981',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '16px'
              }
            });
            
            // Cập nhật điểm số và xếp hạng ngay lập tức
            await updateScoreAndRanking(activeProblem, solution, selectedLanguage.id);
          } else {
            addToTerminalHistory('system', 'Bài tập này đã hoàn thành trước đó.');
          }
          
          return true;
        } else {
          // Hiển thị chi tiết lỗi cho mỗi test case thất bại
          addToTerminalHistory('error', '❌ Kết quả chưa chính xác!');
          
          for (const failedCase of failedTestCases) {
            if (failedCase.input && failedCase.input.trim() !== '') {
              addToTerminalHistory('system', `Input: "${failedCase.input.trim()}"`);
            }
            addToTerminalHistory('system', `Expected: "${failedCase.output.trim()}"`);
            addToTerminalHistory('system', `Your output: "${failedCase.userOutput}"`);
          }
          
          // Thông báo cần phải đúng tất cả test cases để được tính điểm
          addToTerminalHistory('system', '💡 LƯU Ý: Bạn cần đạt đúng tất cả test cases để hoàn thành bài và được tính điểm.');
          
          toast.error('Kết quả chưa chính xác, hãy thử lại!', {
            duration: 3000
          });
          
          return false;
        }
      } else {
        // Nếu không khớp với test case nào, thử kiểm tra tự động với test case đầu tiên
        if (testCases.length > 0 && (!input || input.trim() === '')) {
          const firstTest = testCases[0];
          const expectedOutput = normalizeString(firstTest.output || '');
          
          if (compareStrings(normalizedUserOutput, expectedOutput)) {
            addToTerminalHistory('success', '✅ Kết quả chính xác!');
            addToTerminalHistory('success', `Output: "${output.trim()}"`);
            
            // Đánh dấu hoàn thành
            const localStorageKey = `completedProblems_${id}`;
            const completedProbs = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
            
            if (!completedProbs.includes(activeProblem.ProblemID)) {
              completedProbs.push(activeProblem.ProblemID);
              localStorage.setItem(localStorageKey, JSON.stringify(completedProbs));
              setCompletedProblems(completedProbs);
              setSolutionLocked(true);
              
              triggerCelebration();
              
              addToTerminalHistory('success', '🎉 CHÚC MỪNG! Bài tập đã được đánh dấu là hoàn thành!');
              toast.success(`🎉 CHÚC MỪNG! Bạn đã hoàn thành bài "${activeProblem.Title}"!`);
              
              await updateScoreAndRanking(activeProblem, solution, selectedLanguage.id);
            }
            
            return true;
          } else {
            addToTerminalHistory('error', '❌ Kết quả chưa chính xác!');
            addToTerminalHistory('system', `Expected output: "${firstTest.output.trim()}"`);
            addToTerminalHistory('system', `Your output: "${output.trim()}"`);
            
            return false;
          }
        }
      }
    } catch (error) {
      console.error('Error in autoCheckSolution:', error);
      addToTerminalHistory('error', `Lỗi khi kiểm tra giải pháp: ${error.message}`);
    }
    
    return false;
  };
  
  // Hàm chuẩn hóa chuỗi để so sánh
  const normalizeString = (str) => {
    if (!str) return '';
    return str
      .trim()
      .replace(/\r\n/g, '\n')  // Chuẩn hóa xuống dòng Windows
      .replace(/\s+/g, ' ')    // Gộp nhiều khoảng trắng
      .toLowerCase();          // Chuyển thành chữ thường
  };
  
  // Hàm so sánh hai chuỗi, hỗ trợ nhiều kiểu dữ liệu khác nhau
  const compareStrings = (str1, str2) => {
    if (str1 === str2) return true;
    
    // Thử chuyển thành số và so sánh
    const num1 = parseFloat(str1);
    const num2 = parseFloat(str2);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      return Math.abs(num1 - num2) < 0.0001; // So sánh số với dung sai nhỏ
    }
    
    // Kiểm tra nếu là JSON
    try {
      const json1 = JSON.parse(str1);
      const json2 = JSON.parse(str2);
      return JSON.stringify(json1) === JSON.stringify(json2);
    } catch { /* Không phải JSON */ }
    
    // So sánh chuỗi thông thường
    return str1 === str2;
  };
  
  const handleTerminalSubmit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = terminalInput.trim();
      
      if (!input) return;
      
      if (terminalMode === 'command') {
        // Command mode - process as a command
        addToTerminalHistory('command', input);
        processTerminalCommand(input);
      } else if (isInputRequested) {
        // Input mode - handle both online and offline mode
        addToTerminalHistory('input', input);
        
        // Add to program inputs in any case
        setProgramInputs(prev => [...prev, input]);
        
        // Send to execution service if connected
        sendInputToExecution(input);
        
        // Nếu có output trước đó, thử kiểm tra với input ngay
        if (actualOutput) {
          autoCheckSolution(input, actualOutput.trim());
        }
      } else {
        // Regular input mode
        addToTerminalHistory('input', input);
        setProgramInputs(prev => [...prev, input]);
      }
      
      // Clear input
      setTerminalInput('');
      
      // Focus back on the input field
      document.getElementById('terminal-input').focus();
    }
  };
  
  const processTerminalCommand = (command) => {
    // Simple command processor
    const cmd = command.toLowerCase();
    
    if (cmd === 'clear' || cmd === 'cls') {
      // Clear terminal
      setTerminalHistory([]);
      return;
    }
    
    if (cmd === 'help') {
      addToTerminalHistory('system', `Available commands:
- run: Run the current code${isDockerAvailable ? ' using Docker' : ' (Docker not available)'}
- clear/cls: Clear terminal
- help: Show this help message
- language [name]: Change programming language
- exit/quit: Exit program input mode
- docker: Check Docker status

Docker Status: ${isDockerAvailable ? 'Available ✅' : 'Not Available ❌'}
    `);
      return;
    }
    
    if (cmd === 'run') {
      handleRunCode();
      return;
    }
    
    if (cmd === 'docker') {
      checkDockerAvailability();
      addToTerminalHistory('system', `Docker status: ${isDockerAvailable ? 'Available ✅' : 'Not Available ❌'}`);
      return;
    }
    
    if (cmd.startsWith('language ')) {
      const langName = cmd.split(' ')[1];
      const language = PROGRAMMING_LANGUAGES.find(
        l => l.name.toLowerCase() === langName || l.id === langName
      );
      
      if (language) {
        setSelectedLanguage(language);
        addToTerminalHistory('system', `Language changed to ${language.name}`);
      } else {
        addToTerminalHistory('error', `Unknown language: ${langName}`);
      }
      return;
    }
    
    // Unknown command
    addToTerminalHistory('error', `Unknown command: ${command}`);
  };
  
  // Get the terminal prompt based on selected language and mode
  const getTerminalPrompt = () => {
    if (terminalMode === 'input') {
      return '> ';
    }
    
    switch (selectedLanguage.id) {
      case 'javascript':
        return 'js$ ';
      case 'python':
        return 'py$ ';
      case 'java':
        return 'java$ ';
      case 'cpp':
        return 'c++$ ';
      case 'csharp':
        return 'c#$ ';
      default:
        return '$ ';
    }
  };

  // Add toggle functions for theme and terminal visibility
  const toggleEditorTheme = () => {
    setEditorTheme(prev => prev === 'vs-dark' ? 'vs-light' : 'vs-dark');
  };
  
  const toggleTerminal = () => {
    if (solutionLocked) {
      toast.info('Bài tập đã hoàn thành, không thể hiển thị terminal');
      return;
    }
    setIsTerminalVisible(!isTerminalVisible);
  };

  // Add handlers for terminal resizing
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
    
    // Add event listeners for mouse movement and release
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  };
  
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const terminalContainer = resizeRef.current;
    if (!terminalContainer) return;
    
    const editorContainer = terminalContainer.parentElement;
    const containerRect = editorContainer.getBoundingClientRect();
    const totalHeight = containerRect.height;
    
    // Calculate terminal height based on mouse position (relative to editor container)
    // For drag up, we need to adjust the calculation
    const mouseRelativePos = e.clientY - containerRect.top;
    const newTerminalHeight = Math.max(minTerminalHeight, totalHeight - mouseRelativePos);
    
    // Limit terminal height to maxTerminalHeight
    const limitedHeight = Math.min(newTerminalHeight, maxTerminalHeight);
    
    setTerminalHeight(limitedHeight);
  };
  
  const stopResizing = () => {
    setIsResizing(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  };

  // Update the component that renders the Docker status
  const renderDockerStatus = () => {
    if (isRunning) {
      return (
        <div className={`px-2 py-1 rounded-md text-xs ${
          editorTheme === 'vs-dark'
            ? 'bg-yellow-700 text-yellow-200'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <span className="animate-pulse">Running...</span>
        </div>
      );
    }
    
    if (isDockerAvailable) {
      return (
        <div className={`px-2 py-1 rounded-md text-xs ${
          editorTheme === 'vs-dark'
            ? 'bg-green-700 text-green-200'
            : 'bg-green-100 text-green-800'
        }`}>
          Docker Ready
        </div>
      );
    }
    
    return (
      <div className={`px-2 py-1 rounded-md text-xs ${
        editorTheme === 'vs-dark'
          ? 'bg-red-700 text-red-200'
          : 'bg-red-100 text-red-800'
      }`}>
        Docker Unavailable
      </div>
    );
  };

  // Parse code for input statements
  const parseCodeForInputs = (code) => {
    const inputs = [];
    let regex;
    
    // Different regex for different languages
    switch (selectedLanguage.id) {
      case 'python':
        // Match Python input() statements with optional prompt
        regex = /input\s*\(\s*(?:["']([^"']*)["'])?\s*\)/g;
        break;
      case 'javascript':
        // JavaScript doesn't have a direct input() equivalent, but we can handle prompt()
        regex = /prompt\s*\(\s*(?:["']([^"']*)["'])?\s*\)/g;
        break;
      case 'java':
        // Match Scanner.nextLine(), Scanner.next(), etc. with surrounding context
        regex = /(Scanner\s+\w+|nextLine\(\)|next\(\)|nextInt\(\)|nextDouble\(\))/g;
        break;
      case 'cpp':
        // Match cin >> var statements
        regex = /(cin\s*>>)/g;
        break;
      case 'csharp':
        // Match Console.ReadLine() statements
        regex = /(Console\.ReadLine\(\)|Console\.Read\(\))/g;
        break;
      default:
        regex = /input\s*\(\s*(?:["']([^"']*)["'])?\s*\)/g; // Default to Python-like
    }
    
    let match;
    while ((match = regex.exec(code)) !== null) {
      // Extract the prompt if available (first capturing group)
      const prompt = match[1] || 'Enter input:';
      inputs.push({ prompt, lineNumber: getLineNumber(code, match.index) });
    }
    
    return inputs;
  };
  
  // Helper to get line number from position in code
  const getLineNumber = (code, position) => {
    const lines = code.slice(0, position).split('\n');
    return lines.length;
  };
  
  // Add function to handle input submission
  const handleInputSubmit = (e) => {
    e.preventDefault();
    
    // Add input to the program inputs
    setProgramInputs(prev => [...prev, inputValue]);
    addToTerminalHistory('input', inputValue);
    
    // Send input to execution if needed
    if (isInputRequested && executionId) {
      sendInputToExecution(inputValue);
    }
    
    // Reset form and move to next input if available
    setInputValue('');
    
    if (currentInputIndex < detectedInputs.length - 1) {
      // Move to next input
      setCurrentInputIndex(prev => prev + 1);
      setInputPrompt(detectedInputs[currentInputIndex + 1].prompt);
      addToTerminalHistory('system', `Next input: ${detectedInputs[currentInputIndex + 1].prompt}`);
    } else {
      // No more inputs
      addToTerminalHistory('system', 'All inputs processed.');
      setShowInputForm(false);
    }
  };

  // Update the executeCodeWithDocker function to properly handle multiple inputs and work with the execution service
  const executeCodeWithDocker = async () => {
    if (!activeProblem || !solution.trim()) {
      toast.error('Vui lòng nhập giải pháp trước khi chạy');
      return;
    }
    
    try {
      setIsRunning(true);
      
      // Parse code for input statements before execution
      const inputs = parseCodeForInputs(solution);
      setDetectedInputs(inputs);
      
      if (inputs.length > 0) {
        // Reset program inputs and start from first input
        setProgramInputs([]);
        setCurrentInputIndex(0);
        setInputPrompt(inputs[0].prompt);
        
        // Show terminal and set to input mode
        setTerminalMode('input');
        setIsTerminalVisible(true); 
      }
      
      // Reset terminal output
      setStdout('');
      setStderr('');
      setActualOutput('');
      
      // Attempt to execute code but allow for offline input handling
      let executionFailed = false;
      try {
        // First quick health check with a very short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Short 2s timeout
        
        // Using the health endpoint from executionService.js
        const healthCheck = await fetch(`${API_URL}/api/code-execution/health`, {
          method: 'GET',
          headers: {
            'Authorization': currentUser?.token ? `Bearer ${currentUser.token}` : ''
          },
          signal: controller.signal
        }).catch(err => {
          console.error('Health check failed:', err);
          return { ok: false };
        });
        
        clearTimeout(timeoutId);
        
        if (!healthCheck || !healthCheck.ok) {
          throw new Error('Execution service is not available');
        }
        
        // If health check passes, proceed with code execution
        const executionController = new AbortController();
        const executionTimeoutId = setTimeout(() => executionController.abort(), 30000);
        
        let response;
        try {
          // Match the endpoint path with executionService.js
          response = await axios.post(
            `${API_URL}/api/code-execution/execute`,
            {
              code: solution,
              language: selectedLanguage.id,
              stdin: testInput || ''
            },
            {
              headers: {
                'Authorization': currentUser?.token ? `Bearer ${currentUser.token}` : ''
              },
              timeout: 30000,
              signal: executionController.signal
            }
          );
        } catch (authError) {
          console.warn('Auth-based execution failed, trying test endpoint:', authError);
          response = await axios.post(
            `${API_URL}/api/code-execution/execute`, // Use the same endpoint, but without auth
            {
              code: solution,
              language: selectedLanguage.id,
              stdin: testInput || ''
            },
            {
              timeout: 30000,
              signal: executionController.signal
            }
          );
        }
        
        clearTimeout(executionTimeoutId);
        
        if (response.data.success) {
          const { data } = response.data;
          
          // Xử lý output để loại bỏ các dấu nhắc command line như "c++$" hoặc các prompt shell
          let cleanOutput = '';
          if (data.stdout) {
            cleanOutput = cleanTerminalOutput(data.stdout);
            
            // Add the output to terminal history
            addToTerminalHistory('output', cleanOutput);
            setStdout(cleanOutput);
            setActualOutput(cleanOutput);
          }
          
          if (data.stderr) {
            const cleanError = cleanTerminalOutput(data.stderr);
            addToTerminalHistory('error', cleanError);
            setStderr(cleanError);
          }
          
          // Check if the execution requires input
          if (data.isWaitingForInput || data.needsInput) {
            setIsInputRequested(true);
            setExecutionId(data.executionId);
            setTerminalMode('input');
          } else {
            setTerminalMode('command');
          }
          
          return { stdout: cleanOutput, stderr: data.stderr };
        } else {
          throw new Error(response.data.message || 'Execution failed');
        }
      } catch (apiError) {
        executionFailed = true;
        
        let errorMessage = 'Error connecting to execution service';
        
        // Special case for offline mode - still enable input collection
        if (inputs.length > 0) {
          addToTerminalHistory('error', 'Cannot connect to execution service, but you can still provide inputs in offline mode.');
          setIsInputRequested(true);
          setTerminalMode('input');
          setIsDockerAvailable(false);
        } else {
          if (apiError.code === 'ECONNREFUSED' || apiError.message?.includes('Failed to fetch')) {
            errorMessage = 'Connection refused. The execution service is not running.';
            addToTerminalHistory('error', errorMessage);
            addToTerminalHistory('system', 'Make sure the execution service is running on port 3001.');
          } else if (apiError.response) {
            if (apiError.response.status === 401) {
              errorMessage = 'Authentication error. Please log in again.';
            } else if (apiError.response.status === 404) {
              errorMessage = 'API endpoint not found. Please check your configuration.';
            } else {
              errorMessage = `Server error: ${apiError.response.data?.message || apiError.message}`;
            }
            addToTerminalHistory('error', errorMessage);
          } else {
            addToTerminalHistory('error', errorMessage);
          }
          
          toast.error(errorMessage);
        }
      }
      
      // If execution failed but we have inputs detected, enable manual input mode
      if (executionFailed && inputs.length > 0) {
        addToTerminalHistory('system', 'Enter your inputs below to test your code logic:');
        setIsInputRequested(true);
      }
    } catch (error) {
      console.error('Error executing code:', error);
      addToTerminalHistory('error', `Execution error: ${error.message}`);
      toast.error('Error executing code');
    } finally {
      setIsRunning(false);
    }
    
    return { stdout: '', stderr: '' };
  };
  
  // Hàm để làm sạch đầu ra terminal
  const cleanTerminalOutput = (output) => {
    if (!output) return '';
    
    // Loại bỏ các dấu nhắc shell như "c++$", "bash$", các ký tự ANSI, v.v.
    let cleaned = output
      // Loại bỏ các dấu nhắc terminal phổ biến
      .replace(/(\w+\$|\$|>\s*|\\.+#)$/g, '')
      // Loại bỏ các mã màu ANSI và các ký tự điều khiển
      .replace(/\x1B\[[0-9;]*[mK]/g, '')
      // Loại bỏ các dấu nhắc như "c++", "python" ở cuối
      .replace(/(c\+\+|python|nodejs|java|bash)\s*$/gi, '')
      .trim();
      
    return cleaned;
  };
  
  // Update the sendInputToExecution function to handle multiple inputs correctly
  const sendInputToExecution = async (input) => {
    if (!executionId) {
      // We're in offline mode, so just collect inputs
      addToTerminalHistory('system', 'Input collected (offline mode)');
      
      // Move to next input if available
      if (currentInputIndex < detectedInputs.length - 1) {
        setCurrentInputIndex(prev => prev + 1);
        setInputPrompt(detectedInputs[currentInputIndex + 1].prompt);
      } else {
        // Simulate simple output for offline mode
        addToTerminalHistory('system', 'All inputs collected. In offline mode, execution results are not available.');
        
        // Try to show a simple simulation for Python sum example
        if (selectedLanguage.id === 'python' && programInputs.length >= 2 && solution.includes('tong = a + b')) {
          try {
            const a = parseFloat(programInputs[0]);
            const b = parseFloat(programInputs[1]);
            if (!isNaN(a) && !isNaN(b)) {
              const sum = a + b;
              addToTerminalHistory('output', `[Offline simulation] Tổng của ${a} và ${b} là: ${sum}`);
              setActualOutput(`[Offline simulation] Tổng của ${a} và ${b} là: ${sum}`);
              
              // Kiểm tra kết quả và cập nhật điểm ngay lập tức
              await autoCheckSolution(input, `${sum}`);
            }
          } catch (e) { /* Ignore simulation errors */ }
        }
        
        setIsInputRequested(false);
        setTerminalMode('command');
      }
      return;
    }
    
    try {
      // Use the send-input endpoint from executionService.js
      let response;
      try {
        response = await axios.post(
          `${API_URL}/api/code-execution/send-input`,
          {
            executionId,
            input
          },
          {
            headers: {
              'Authorization': `Bearer ${currentUser?.token}`
            }
          }
        );
      } catch (authError) {
        console.warn('Auth-based input send failed, trying unauthenticated endpoint:', authError);
        response = await axios.post(
          `${API_URL}/api/code-execution/send-input`, // Use the same endpoint, but without auth
          {
            executionId,
            input
          }
        );
      }
      
      if (response.data.success) {
        const { data } = response.data;
        
        // Add the output to terminal history
        if (data.stdout) {
          addToTerminalHistory('output', data.stdout);
          setStdout(prev => prev + data.stdout);
          setActualOutput(prev => prev + data.stdout);
          
          // Auto-check đáp án với input và output ngay lập tức
          const output = data.stdout.trim();
          
          // Thêm timeout nhỏ để đảm bảo output đã được hiển thị đầy đủ
          setTimeout(async () => {
            await autoCheckSolution(input, output);
          }, 500);
        }
        
        if (data.stderr) {
          addToTerminalHistory('error', data.stderr);
          setStderr(prev => prev + data.stderr);
        }
        
        // Check if the execution requires more input
        if (data.isWaitingForInput || data.needsInput) {
          setIsInputRequested(true);
        } else {
          setIsInputRequested(false);
          setTerminalMode('command');
        }
      } else {
        addToTerminalHistory('error', response.data.message || 'Failed to send input');
      }
    } catch (error) {
      console.error('Error sending input:', error);
      addToTerminalHistory('error', `Error sending input: ${error.message}`);
    }
  };
  
  // Add a function to stop execution
  const stopExecution = async () => {
    if (!executionId) return;
    
    try {
      // Use the stop endpoint from executionService.js
      await axios.post(
        `${API_URL}/api/code-execution/stop`,
        { executionId },
        {
          headers: {
            'Authorization': `Bearer ${currentUser?.token}`
          }
        }
      );
      
      addToTerminalHistory('system', 'Execution stopped.');
      setIsInputRequested(false);
      setExecutionId(null);
      setTerminalMode('command');
    } catch (error) {
      console.error('Error stopping execution:', error);
      addToTerminalHistory('error', `Error stopping execution: ${error.message}`);
    }
  };

  // Replace the simulator with a better error message function
  const simulateLocalExecution = () => {
    addToTerminalHistory('error', 'Execution service is not available');
    addToTerminalHistory('system', 'Please make sure the execution service is running:');
    addToTerminalHistory('system', '1. Check that Docker is running on your system');
    addToTerminalHistory('system', '2. Ensure the execution service is started on port 3001');
    addToTerminalHistory('system', '3. Try running this command in the service directory:');
    addToTerminalHistory('command', 'node executionService.js');
  };

  // Add a component to display problems with completion indicators
  const renderProblemSelector = () => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {problems.map((problem) => {
          const isCompleted = completedProblems.includes(problem.ProblemID);
          const isActive = activeProblem && activeProblem.ProblemID === problem.ProblemID;
          
          return (
            <button
              key={problem.ProblemID}
              onClick={() => handleProblemSelect(problem)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center
                ${isActive ? 'ring-2 ring-offset-1 ' : ''}
                ${isCompleted 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }
              `}
            >
              {isCompleted && <CheckCircleIcon className="w-3 h-3 mr-1 text-green-600" />}
              {problem.Title}
            </button>
          );
        })}
      </div>
    );
  };

  // Update logic to hide the "recentlyDetected" notification after a few seconds
  useEffect(() => {
    // If recentlyDetected is true, set a timeout to clear it after 5 seconds
    if (recentlyDetected) {
      const timer = setTimeout(() => {
        setRecentlyDetected(false);
      }, 5000);
      
      // Clear the timeout if the component unmounts or recentlyDetected changes
      return () => clearTimeout(timer);
    }
  }, [recentlyDetected]);

  // So sánh chuỗi thông thường
  const triggerCelebration = () => {
    try {
      // Tạo hiệu ứng confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      // Hàm để tạo hiệu ứng confetti
      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      // Tạo timeout để chạy hiệu ứng
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        // Tính toán số lượng confetti dựa trên thời gian còn lại
        const particleCount = 50 * (timeLeft / duration);
        
        // Tạo confetti từ các phía khác nhau
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    } catch (error) {
      console.error('Error triggering celebration effect:', error);
    }
  };
  
  // Hàm cập nhật điểm số và xếp hạng lên server ngay lập tức
  const updateScoreAndRanking = async (problem, solution, language) => {
    if (!currentUser?.token || !problem?.ProblemID) {
      console.error('Missing user token or problem ID');
      return null;
    }
    
    try {
      // Cập nhật điểm số và xếp hạng
      const response = await submitSolution(
        id, 
        problem.ProblemID, 
        solution, 
        currentUser.token,
        language
      );
      
      if (response && response.success) {
        // Lấy điểm từ response hoặc từ bài tập
        const score = response.data?.score || problem.Points || 0;
        
        // Hiển thị thông báo cộng điểm
        addToTerminalHistory('success', `💯 BẠN ĐÃ ĐƯỢC CỘNG ${score} ĐIỂM!`);
        
        // Hiệu ứng thông báo đẹp mắt
        toast(
          (t) => (
            <div className="flex items-center p-4 bg-yellow-500 text-white rounded-lg">
              <div className="mr-4 text-3xl">🏆</div>
              <div>
                <div className="font-bold text-lg mb-1">Điểm số cập nhật!</div>
                <div className="text-2xl font-extrabold">+{score} điểm</div>
              </div>
            </div>
          ),
          {
            duration: 6000,
            icon: false
          }
        );
        
        // Thông báo rõ ràng về cách tính điểm
        addToTerminalHistory('system', `💡 LƯU Ý: Điểm chỉ được tính khi tất cả test cases đều đúng.`);
        
        toast.success(`Thứ hạng của bạn đang được cập nhật!`, {
          duration: 5000,
          icon: '🏆',
          style: {
            background: '#3B82F6',
            color: 'white'
          }
        });
        
        return response;
      }
    } catch (error) {
      console.error('Error updating score:', error);
      addToTerminalHistory('error', `Lỗi khi cập nhật điểm: ${error.message}`);
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="flex flex-col items-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Không tìm thấy cuộc thi</h3>
          <p className="text-gray-500 mb-6">Cuộc thi này không tồn tại hoặc đã bị xóa</p>
          <button 
            onClick={() => navigate('/competitions')}
            className="text-purple-600 hover:text-purple-700 flex items-center"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Quay lại danh sách cuộc thi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm">
          <button 
            onClick={() => navigate(`/competitions/${id}`)}
            className="text-gray-500 hover:text-gray-700 flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Quay lại
          </button>
          <span className="text-gray-500">/</span>
          <span className="text-gray-900">{competition.Title}</span>
        </div>
        
        {isCompetitionActive && remainingTime && (
          <div className="flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            <ClockIcon className="w-5 h-5 mr-2" />
            <span className="font-mono font-bold">{formatTime(remainingTime)}</span>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left side: Problems list with inline dropdowns */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Danh sách bài tập</h2>
          <div className="space-y-4">
            {renderProblemSelector()}
            
            {/* Problem details sections */}
            {activeProblem && (
              <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg">
                {/* Collapsible problem description */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 bg-white">
                  <button 
                    onClick={() => toggleSection('description')}
                    className="w-full flex justify-between items-center p-2 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium text-sm">Mô tả bài toán</span>
                    </div>
                    {expandedSections.description 
                      ? <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                      : <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    }
                  </button>
                  
                  {expandedSections.description && (
                    <div className="p-3 border-t border-gray-200">
                      {activeProblem.ImageURL && (
                        <div className="mb-3">
                          <img 
                            src={activeProblem.ImageURL} 
                            alt={activeProblem.Title} 
                            className="rounded-lg max-h-48 object-contain mx-auto"
                          />
                        </div>
                      )}
                      
                      <div className="prose max-w-none text-sm">
                        <p>{activeProblem.Description}</p>
                      </div>
                      
                      {/* Completion status */}
                      {completedProblems.includes(activeProblem.ProblemID) && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-green-700 text-sm">Bài tập này đã được hoàn thành!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                  
                {/* Collapsible input format */}
                {activeProblem.InputFormat && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 bg-white">
                    <button 
                      onClick={() => toggleSection('inputFormat')}
                      className="w-full flex justify-between items-center p-2 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <InformationCircleIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium text-sm">Định dạng đầu vào</span>
                      </div>
                      {expandedSections.inputFormat 
                        ? <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                        : <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                      }
                    </button>
                    
                    {expandedSections.inputFormat && (
                      <div className="p-3 border-t border-gray-200 text-sm">
                        <p>{activeProblem.InputFormat}</p>
                      </div>
                    )}
                  </div>
                )}
                  
                {/* Collapsible output format */}
                {activeProblem.OutputFormat && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 bg-white">
                    <button 
                      onClick={() => toggleSection('outputFormat')}
                      className="w-full flex justify-between items-center p-2 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <InformationCircleIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium text-sm">Định dạng đầu ra</span>
                      </div>
                      {expandedSections.outputFormat 
                        ? <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                        : <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                      }
                    </button>
                    
                    {expandedSections.outputFormat && (
                      <div className="p-3 border-t border-gray-200 text-sm">
                        <p>{activeProblem.OutputFormat}</p>
                      </div>
                    )}
                  </div>
                )}
                  
                {/* Collapsible sample cases */}
                {activeProblem.SampleInput && activeProblem.SampleOutput && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <button 
                      onClick={() => toggleSection('sampleCases')}
                      className="w-full flex justify-between items-center p-2 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <BeakerIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium text-sm">Mẫu test</span>
                      </div>
                      {expandedSections.sampleCases 
                        ? <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                        : <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                      }
                    </button>
                    
                    {expandedSections.sampleCases && (
                      <div className="p-3 border-t border-gray-200">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-sm font-medium mb-1">Mẫu đầu vào:</h3>
                            <div className="bg-gray-100 p-2 rounded-lg font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                              {activeProblem.SampleInput}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium mb-1">Mẫu đầu ra:</h3>
                            <div className="bg-gray-100 p-2 rounded-lg font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                              {activeProblem.SampleOutput}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side: Terminal-style code editor */}
        <div className="lg:col-span-3">
          {activeProblem ? (
            <>
              <div className={`rounded-xl shadow-lg overflow-hidden border ${
                editorTheme === 'vs-dark' 
                  ? 'bg-black border-gray-700' 
                  : 'bg-white border-gray-300'
              }`}>
                {/* Terminal header */}
                <div className={`p-3 flex justify-between items-center border-b ${
                  editorTheme === 'vs-dark' 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  <div className="flex items-center">
                    <div className="flex space-x-2 mr-4">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <h3 className={`text-sm font-mono ${
                      editorTheme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {activeProblem.Title} — <span className={editorTheme === 'vs-dark' ? 'text-green-400' : 'text-green-600'}>Code Editor</span>
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Add Docker status indicator */}
                    {renderDockerStatus()}
                    
                    <button
                      onClick={toggleEditorTheme}
                      className={`px-3 py-1 rounded-md text-xs font-medium ${
                        editorTheme === 'vs-dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } font-medium`}
                    >
                      {editorTheme === 'vs-dark' ? 'Light Theme' : 'Dark Theme'}
                    </button>
                    
                    {!solutionLocked && (
                      <Tooltip title="Terminal">
                        <Button
                          className={`${styles.actionButton} ${
                            isTerminalVisible ? styles.activeButton : ''
                          }`}
                          icon={<CodeBracketIcon />}
                          onClick={toggleTerminal}
                          disabled={solutionLocked}
                        />
                      </Tooltip>
                    )}
                    
                    {/* Display language as a simple badge */}
                    <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
                      editorTheme === 'vs-dark'
                        ? 'bg-gray-800 text-gray-300 border border-gray-700'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}>
                      <span className="flex items-center">
                        <span className="relative w-2 h-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        {selectedLanguage.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Code editor */}
                <div className="relative">
                  <Editor
                    key={`editor-${activeProblem?.ProblemID || 'default'}`}
                    height={`calc(100vh - ${solutionLocked ? terminalHeight + 150 : terminalHeight + 180}px)`}
                    theme={editorTheme}
                    language={selectedLanguage.value}
                    value={solution}
                    options={{
                      ...editorOptions,
                      readOnly: solutionLocked // Editor chỉ đọc khi bài tập đã hoàn thành
                    }}
                    onChange={handleEditorChange}
                    className={`rounded-t-lg ${
                      editorTheme === 'vs-dark' ? 'shadow-lg' : 'shadow-md'
                    } ${solutionLocked ? 'editor-readonly' : ''}`}
                  />
                  
                  {/* Hiển thị overlay khi bài đã hoàn thành */}
                  {solutionLocked && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl font-medium text-xs shadow-md z-10">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        <span>Đã hoàn thành - Chỉ đọc</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Terminal console section - conditionally rendered */}
                {isTerminalVisible && !solutionLocked && (
                  <div className="relative">
                    {/* Resizable handle */}
                    <div 
                      className={`cursor-row-resize h-4 w-full flex items-center justify-center ${
                        editorTheme === 'vs-dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                      onMouseDown={startResizing}
                      style={{ cursor: 'ns-resize' }}
                    >
                      <div className="w-32 h-1 rounded-full bg-gray-500 opacity-70"></div>
                      <div className="absolute pointer-events-none text-xs text-gray-500 opacity-60">
                        {isResizing ? `${Math.round(terminalHeight)}px` : "Drag to resize"}
                      </div>
                    </div>
                    
                    <div 
                      ref={resizeRef}
                      className={`border-t ${
                        editorTheme === 'vs-dark' 
                          ? 'bg-gray-900 border-gray-700' 
                          : 'bg-gray-100 border-gray-300'
                      }`}
                      style={{ height: `${terminalHeight}px`, transition: isResizing ? 'none' : 'height 0.1s ease-out' }}
                    >
                      <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className={`text-sm font-mono flex items-center ${
                            editorTheme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {terminalMode === 'command' ? 'Terminal' : 'Program Input'}
                            {isInputRequested && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                editorTheme === 'vs-dark' ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
                              }`}>
                                Waiting for input
                              </span>
                            )}
                          </h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setTerminalHistory([])}
                              className={`px-2 py-1 rounded-md text-xs font-medium flex items-center ${
                                editorTheme === 'vs-dark'
                                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Clear
                            </button>
                            {isInputRequested && executionId && (
                              <button
                                onClick={stopExecution}
                                className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 flex items-center"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Stop
                              </button>
                            )}
                            <button
                              onClick={handleRunCode}
                              disabled={isRunning || !isCompetitionActive || solutionLocked} // Thêm điều kiện solutionLocked
                              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center ${
                                isRunning || !isCompetitionActive || solutionLocked // Thêm điều kiện solutionLocked
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                              title={solutionLocked ? "Bài này đã hoàn thành, không thể chạy lại" : ""}
                            >
                              {isRunning ? (
                                <>
                                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></span>
                                  Running...
                                </>
                              ) : solutionLocked ? (
                                <>
                                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                                  Đã hoàn thành
                                </>
                              ) : (
                                <>
                                  <PlayIcon className="w-3 h-3 mr-1" />
                                  Run Code
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Terminal with history and input */}
                        <div 
                          ref={terminalRef}
                          className={`overflow-y-auto border mb-1 rounded-md shadow-sm ${
                            editorTheme === 'vs-dark'
                              ? 'border-gray-700'
                              : 'border-gray-300'
                          }`}
                          style={{ height: `${terminalHeight - 100}px` }}
                        >
                          {/* Terminal header */}
                          <div className="bg-gray-800 p-1 flex items-center justify-between">
                            <div className="flex space-x-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {terminalMode === 'command' ? 'Terminal' : 'Program Input'}
                              {isInputRequested && (
                                <span className="ml-1 text-blue-400">(waiting for input)</span>
                              )}
                            </div>
                            <div className="w-4"></div>
                          </div>

                          {/* Terminal content */}
                          <div 
                            className={`p-4 font-mono text-sm ${
                              editorTheme === 'vs-dark'
                                ? 'bg-black text-gray-300'
                                : 'bg-white text-gray-800'
                            }`}
                            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", minHeight: `${terminalHeight - 120}px` }}
                            onClick={focusTerminalInput}
                          >
                            {executionId && (
                              <div className={`mb-2 text-xs ${
                                editorTheme === 'vs-dark' ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                <span>Session ID: {executionId.substring(0, 8)}...</span>
                              </div>
                            )}
                            
                            {terminalHistory.length > 0 ? (
                              <div className="space-y-1">
                                {terminalHistory.map(entry => (
                                  <div key={entry.id} className={`${
                                    entry.type === 'command' 
                                      ? editorTheme === 'vs-dark' ? 'text-green-400' : 'text-green-600' 
                                    : entry.type === 'input' 
                                      ? editorTheme === 'vs-dark' ? 'text-cyan-400' : 'text-cyan-600'
                                      : entry.type === 'error'
                                        ? editorTheme === 'vs-dark' ? 'text-red-400' : 'text-red-600'
                                      : entry.type === 'system'
                                        ? editorTheme === 'vs-dark' ? 'text-blue-400' : 'text-blue-600'
                                      : entry.type === 'code'
                                        ? editorTheme === 'vs-dark' ? 'text-yellow-200 bg-gray-800 p-2 rounded my-2 block' : 'text-gray-800 bg-gray-100 p-2 rounded my-2 block'
                                      : entry.type === 'output'
                                        ? editorTheme === 'vs-dark' ? 'text-gray-300 font-bold' : 'text-gray-900 font-bold'
                                      : editorTheme === 'vs-dark' ? 'text-gray-300' : 'text-gray-800'
                                  }`}>
                                    {(entry.type === 'command' || entry.type === 'input') && (
                                      <span className={editorTheme === 'vs-dark' ? 'text-yellow-400' : 'text-yellow-600'}>{
                                        entry.type === 'input' ? '> ' : getTerminalPrompt()
                                      }</span>
                                    )}
                                    <span className="whitespace-pre-wrap terminal-output">{entry.content}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className={editorTheme === 'vs-dark' ? 'text-gray-500' : 'text-gray-400'}>
                                {`// Terminal ready. Type 'help' for available commands or 'run' to execute code.`}
                              </p>
                            )}
                            
                            {/* Integrated terminal input field */}
                            <div className="flex items-center mt-4 terminal-input-line">
                              <span className={`${
                                editorTheme === 'vs-dark' ? 'text-yellow-400' : 'text-yellow-600'
                              } font-mono`}>
                                {isInputRequested ? '> ' : getTerminalPrompt()}
                              </span>
                              <form onSubmit={(e) => { e.preventDefault(); handleTerminalSubmit({key: 'Enter'}); }} className="flex-1 relative">
                                <input
                                  id="terminal-input"
                                  type="text"
                                  value={terminalInput}
                                  onChange={handleTerminalInputChange}
                                  onKeyDown={handleTerminalSubmit}
                                  className={`w-full bg-transparent focus:outline-none pr-2 font-mono ${
                                    editorTheme === 'vs-dark'
                                      ? 'text-gray-300'
                                      : 'text-black'
                                  }`}
                                  placeholder={isInputRequested 
                                    ? (detectedInputs[currentInputIndex]?.prompt || "Enter input...")
                                    : "Type commands here (try 'help')"}
                                  spellCheck="false"
                                  autoComplete="off"
                                  autoFocus
                                />
                                <span className={`absolute right-0 top-0 h-full w-[2px] ${
                                  editorTheme === 'vs-dark' ? 'bg-gray-300' : 'bg-gray-700'
                                } animate-cursor-blink`}></span>
                              </form>
                            </div>
                          </div>
                        </div>
                        
                        {/* Test results */}
                        {showTestResults && testResults && (
                          <div className={`p-2 border-t ${
                            editorTheme === 'vs-dark'
                              ? 'bg-gray-900 border-gray-700'
                              : 'bg-gray-100 border-gray-300'
                          } ${
                            testResults.success 
                              ? editorTheme === 'vs-dark' ? 'text-green-400' : 'text-green-600'
                              : editorTheme === 'vs-dark' ? 'text-red-400' : 'text-red-600'
                          }`}>
                            <div className="flex items-start">
                              {testResults.success ? (
                                <CheckCircleIcon className={`w-4 h-4 mr-2 flex-shrink-0 mt-0.5 ${
                                  editorTheme === 'vs-dark' ? 'text-green-500' : 'text-green-600'
                                }`} />
                              ) : (
                                <XCircleIcon className={`w-4 h-4 mr-2 flex-shrink-0 mt-0.5 ${
                                  editorTheme === 'vs-dark' ? 'text-red-500' : 'text-red-600'
                                }`} />
                              )}
                              <div>
                                <h4 className={`font-medium text-xs ${
                                  testResults.success 
                                    ? editorTheme === 'vs-dark' ? 'text-green-300' : 'text-green-600'
                                    : editorTheme === 'vs-dark' ? 'text-red-300' : 'text-red-600'
                                }`}>
                                  {testResults.message}
                                </h4>
                                <p className={`text-xs mt-1 ${
                                  editorTheme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {testResults.details}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className={`flex justify-end space-x-3 p-3 border-t ${
                          editorTheme === 'vs-dark'
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-gray-100 border-gray-300'
                        }`}>
                          <button
                            onClick={handleRunCode}
                            disabled={isRunning || !isCompetitionActive || solutionLocked} // Thêm điều kiện solutionLocked
                            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center ${
                              isRunning || !isCompetitionActive || solutionLocked // Thêm điều kiện solutionLocked
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                            title={solutionLocked ? "Bài này đã hoàn thành, không thể chạy lại" : ""}
                          >
                            {isRunning ? (
                              <>
                                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></span>
                                Running...
                              </>
                            ) : solutionLocked ? (
                              <>
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Đã hoàn thành
                              </>
                            ) : (
                              <>
                                <PlayIcon className="w-3 h-3 mr-1" />
                                Run Code
                              </>
                            )}
                          </button>
                          
                          {/* Thông tin xem code đã hoàn thành chưa */}
                          {solutionLocked && (
                            <div className={`px-3 py-1 rounded-md text-xs font-medium flex items-center bg-green-100 text-green-800`}>
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Đã hoàn thành
                            </div>
                          )}
                          
                          {/* Hướng dẫn về việc tự động kiểm tra */}
                          <div className="flex-1 flex items-center">
                            <InformationCircleIcon className={`w-3 h-3 mr-1 ${
                              editorTheme === 'vs-dark' ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                            <span className={`text-xs ${
                              editorTheme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Chạy code và nhập test case để tự động kiểm tra bài làm
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`flex flex-col items-center justify-center h-64 p-4 rounded-xl shadow-lg ${
              editorTheme === 'vs-dark'
                ? 'bg-black text-gray-400'
                : 'bg-white text-gray-500'
            }`}>
              <CodeBracketIcon className={`w-16 h-16 mb-4 ${
                editorTheme === 'vs-dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <p className="text-sm">Select a problem to start coding</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Arena;