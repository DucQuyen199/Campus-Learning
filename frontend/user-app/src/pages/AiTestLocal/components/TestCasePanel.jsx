import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/solid';

const TestCasePanel = ({ testCases, testResults, userTestCases = [], updateTestCases }) => {
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editFormData, setEditFormData] = useState({ input: '', expected: '' });

  // Function to format values for display
  const formatValue = (value) => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  // Check if a test case is user-created
  const isUserTestCase = (index) => {
    return userTestCases.some(tc => tc === testCases[index]);
  };

  // Handle edit button click
  const handleEditClick = (index) => {
    setEditingIndex(index);
    
    try {
      // Initialize form with current values
      const input = formatValue(testCases[index].input);
      const expected = formatValue(testCases[index].expected);
      
      setEditFormData({
        input: input === 'null' ? '' : input,
        expected: expected === 'null' ? '' : expected
      });
    } catch (e) {
      console.error('Error preparing edit form', e);
      setEditFormData({ input: '', expected: '' });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Save edited test case
  const handleSaveEdit = () => {
    if (editingIndex < 0) return;
    
    try {
      // Parse the input and expected values
      let input = null;
      let expected = null;
      
      try {
        input = JSON.parse(editFormData.input);
      } catch (e) {
        // If not valid JSON, use as string
        input = editFormData.input;
      }
      
      try {
        expected = JSON.parse(editFormData.expected);
      } catch (e) {
        // If not valid JSON, use as string
        expected = editFormData.expected;
      }
      
      // Create updated test case
      const updatedTestCase = {
        ...testCases[editingIndex],
        input,
        expected
      };
      
      // Create new test cases array with the updated item
      const updatedTestCases = [...testCases];
      updatedTestCases[editingIndex] = updatedTestCase;
      
      // Update test cases
      updateTestCases(updatedTestCases);
      
      // Reset editing state
      setEditingIndex(-1);
    } catch (e) {
      console.error('Error saving test case', e);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingIndex(-1);
  };

  // Delete a test case
  const handleDeleteTestCase = (index) => {
    const updatedTestCases = testCases.filter((_, idx) => idx !== index);
    updateTestCases(updatedTestCases);
  };

  return (
    <div className="space-y-2">
      {testCases.map((testCase, index) => {
        // Find matching test result if any
        const result = testResults.find(r => r.id === index);
        const isUserCase = isUserTestCase(index);
        
        return (
          <div 
            key={index} 
            className={`p-2 border rounded-lg text-xs ${
              result 
                ? (result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50')
                : isUserCase 
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="font-medium text-xs flex items-center">
                Test #{index + 1}
                {isUserCase && (
                  <span className="ml-1 text-blue-600 text-xs bg-blue-100 px-1 rounded">User</span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {isUserCase && editingIndex !== index && (
                  <>
                    <button 
                      onClick={() => handleEditClick(index)}
                      className="p-1 text-gray-600 hover:text-blue-600"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTestCase(index)}
                      className="p-1 text-gray-600 hover:text-red-600"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </>
                )}
                {result && (
                  <div>
                    {result.passed ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {editingIndex === index ? (
              // Edit form
              <div className="space-y-2 bg-white p-2 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Input (JSON):</label>
                  <textarea
                    name="input"
                    value={editFormData.input}
                    onChange={handleInputChange}
                    className="w-full text-xs p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Expected (JSON):</label>
                  <textarea
                    name="expected"
                    value={editFormData.expected}
                    onChange={handleInputChange}
                    className="w-full text-xs p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={6}
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center"
                  >
                    <CheckIcon className="h-3 w-3 mr-1" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // Normal display
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-0.5">Input:</div>
                  <pre className="text-xs bg-white p-1 rounded border border-gray-200 overflow-x-auto max-h-16">
                    {formatValue(testCase.input)}
                  </pre>
                </div>
                
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-0.5">Expected:</div>
                  <pre className="text-xs bg-white p-1 rounded border border-gray-200 overflow-x-auto max-h-16">
                    {formatValue(testCase.expected)}
                  </pre>
                </div>
                
                {result && (
                  <div className="col-span-2 mt-1">
                    <div className="text-xs font-semibold text-gray-500 mb-0.5">Actual Output:</div>
                    <pre className={`text-xs p-1 rounded border overflow-x-auto max-h-16 ${
                      result.passed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      {result.actual}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TestCasePanel; 