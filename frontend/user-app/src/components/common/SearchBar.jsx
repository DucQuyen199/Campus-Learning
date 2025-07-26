import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../api/searchApi';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [show, setShow] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  // Fetch search when expanded
  useEffect(() => {
    if (!searchExpanded || !query.trim()) {
      setShow(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchApi.globalSearch(query);
        setResults(res.data);
        setShow(true);
      } catch (error) {
        console.error(error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchExpanded]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShow(false);
        setSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (type, id) => {
    switch(type) {
      case 'courses': navigate(`/courses/${id}`); break;
      case 'users': navigate(`/profile/${id}`); break;
      case 'posts': navigate(`/posts?postId=${id}`); break;
      case 'events': navigate(`/events/${id}`); break;
      case 'exams': navigate(`/exams/${id}`); break;
      case 'competitions': navigate(`/competitions/${id}`); break;
      default: break;
    }
    setShow(false);
    setSearchExpanded(false);
    setQuery('');
  };

  return (
    <div className="relative hidden md:block" ref={ref}>
      <div className={`flex items-center transition-all duration-300 ${searchExpanded ? 'w-56 lg:w-64 xl:w-72' : 'w-10'}`}>​
        <button
          type="button"
          className={`absolute left-0 p-2.5 text-gray-500 hover:text-blue-600 z-10 ${searchExpanded ? 'bg-transparent' : 'bg-white dark:bg-gray-700 rounded-full shadow-md'}`}
          onClick={() => setSearchExpanded(true)}
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
        {searchExpanded && (
          <input
            type="text"
            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm text-gray-900 dark:text-gray-100 transition-all"
            placeholder="Tìm kiếm..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        )}
      </div>

      {show && results && (
        <div className="absolute bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 max-h-64 overflow-y-auto border border-gray-100 dark:border-gray-700"
             style={{ marginTop: '12px', marginLeft: '-5px', marginRight: '-5px', width: 'calc(100% + 10px)' }}>
          {['users','courses','posts','events','exams','competitions'].map(type => (
            results[type] && results[type].length > 0 && (
              <div key={type} className="p-2">
                <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-1">{type}</div>
                {results[type].map(item => (
                  <div
                    key={item.id}
                    className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                    onClick={() => handleSelect(type, item.id)}
                  >
                    {item.title}{item.subtitle ? ` - ${item.subtitle}` : ''}
                  </div>
                ))}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 