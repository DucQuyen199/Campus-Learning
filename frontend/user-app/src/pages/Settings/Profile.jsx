import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, getUserProfile } from '@/store/slices/userSlice';
import { toast } from 'react-toastify';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { userServices } from '@/services/api';

const Profile = () => {
  const dispatch = useDispatch();
  const { profileInfo, extendedProfile, loading, error, success, message } = useSelector(state => state.user);
  
  const [educationLoading, setEducationLoading] = useState(false);
  const [workExpLoading, setWorkExpLoading] = useState(false);
  const [verifiedEmails, setVerifiedEmails] = useState([]);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    bio: '',
    school: '',
    pronouns: '',
    url: '',
    orcidId: '',
    email: '',
    location: '',
    education: [],
    workExperience: [],
    skills: [],
    interests: []
  });

  // Show success/error messages
  useEffect(() => {
    if (success && message) {
      toast.success(message);
    }
    if (error) {
      toast.error(error);
    }
  }, [success, error, message]);

  // Fetch user profile data when component mounts
  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

  // Initialize profile data when extended profile is fetched
  useEffect(() => {
    if (extendedProfile) {
      try {
        // Parse JSON fields if they are strings
        const parseJsonField = (field) => {
          if (!field) return [];
          if (typeof field === 'string') {
            try { return JSON.parse(field); } 
            catch (e) { return []; }
          }
          return field;
        };

        const parseSocialLinks = (field) => {
          if (!field) return {};
          if (typeof field === 'string') {
            try { return JSON.parse(field); } 
            catch (e) { return {}; }
          }
          return field;
        };

        const parsedEducation = parseJsonField(extendedProfile.Education);
        const parsedWorkExp = parseJsonField(extendedProfile.WorkExperience);
        
        setProfileData({
          fullName: extendedProfile.FullName || '',
          bio: extendedProfile.Bio || '',
          school: extendedProfile.School || '',
          pronouns: extendedProfile.Pronouns || '',
          url: extendedProfile.Url || '',
          orcidId: extendedProfile.OrcidId || '',
          email: extendedProfile.Email || '',
          education: parsedEducation,
          workExperience: parsedWorkExp,
          skills: parseJsonField(extendedProfile.Skills),
          interests: parseJsonField(extendedProfile.Interests),
          socialLinks: parseSocialLinks(extendedProfile.SocialLinks)
        });
      } catch (error) {
        console.error("Error parsing profile data:", error);
        toast.error("Có lỗi khi tải dữ liệu hồ sơ");
      }
    } else if (profileInfo) {
      setProfileData(prevData => ({
        ...prevData,
        fullName: profileInfo.fullName || '',
        email: profileInfo.email || '',
        school: profileInfo.school || ''
      }));
    }
  }, [extendedProfile, profileInfo]);

  // Fetch verified email list for dropdown
  useEffect(() => {
    userServices.getEmails()
      .then(res => {
        const emails = res.data.emails || [];
        const verified = emails.filter(e => e.IsVerified === 1 || e.IsVerified === true);
        setVerifiedEmails(verified);
        // if current public email not set yet, preselect primary verified email
        if (!profileData.email && verified.length) {
          const primary = verified.find(e => e.IsPrimary === 1 || e.IsPrimary === true) || verified[0];
          setProfileData(prev => ({ ...prev, email: primary.Email }));
        }
      })
      .catch(err => console.error('Error fetch verified emails', err));
  }, []);

  // Handle profile field change
  const handleProfileChange = (field, value) => {
    setProfileData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  // Handle profile form submit
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    const profilePayload = {
      fullName: profileData.fullName,
      bio: profileData.bio, 
      school: profileData.school,
      pronouns: profileData.pronouns,
      education: profileData.education,
      workExperience: profileData.workExperience,
      skills: profileData.skills || [],
      interests: profileData.interests || [],
      socialLinks: profileData.socialLinks || {},
      orcidId: profileData.orcidId,
      url: profileData.url
    };
    
    dispatch(updateUserProfile(profilePayload));
  };

  // Function to add a new education item
  const handleAddEducation = () => {
    const newEducation = {
      id: Date.now(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    
    setProfileData(prevData => ({
      ...prevData,
      education: [...(prevData.education || []), newEducation]
    }));
  };

  // Function to update an education item
  const handleUpdateEducation = (id, field, value) => {
    setProfileData(prevData => ({
      ...prevData,
      education: prevData.education.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Function to remove an education item
  const handleRemoveEducation = (id) => {
    setProfileData(prevData => ({
      ...prevData,
      education: prevData.education.filter(item => item.id !== id)
    }));
  };

  // Function to add a new work experience item
  const handleAddWorkExperience = () => {
    const newWorkExperience = {
      id: Date.now(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    
    setProfileData(prevData => ({
      ...prevData,
      workExperience: [...(prevData.workExperience || []), newWorkExperience]
    }));
  };

  // Function to update a work experience item
  const handleUpdateWorkExperience = (id, field, value) => {
    setProfileData(prevData => ({
      ...prevData,
      workExperience: prevData.workExperience.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Function to remove a work experience item
  const handleRemoveWorkExperience = (id) => {
    setProfileData(prevData => ({
      ...prevData,
      workExperience: prevData.workExperience.filter(item => item.id !== id)
    }));
  };

  // Function to add a skill
  const handleAddSkill = (skill) => {
    if (!skill || profileData.skills?.includes(skill)) return;
    
    setProfileData(prevData => ({
      ...prevData,
      skills: [...(prevData.skills || []), skill]
    }));
  };

  // Function to remove a skill
  const handleRemoveSkill = (skillToRemove) => {
    setProfileData(prevData => ({
      ...prevData,
      skills: prevData.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Function to add an interest
  const handleAddInterest = (interest) => {
    if (!interest || profileData.interests?.includes(interest)) return;
    
    setProfileData(prevData => ({
      ...prevData,
      interests: [...(prevData.interests || []), interest]
    }));
  };

  // Function to remove an interest
  const handleRemoveInterest = (interestToRemove) => {
    setProfileData(prevData => ({
      ...prevData,
      interests: prevData.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  // Function to handle enter key for adding skills/interests
  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value) {
        if (type === 'skill') {
          handleAddSkill(value);
        } else if (type === 'interest') {
          handleAddInterest(value);
        }
        e.target.value = '';
      }
    }
  };

  // Function to save education section
  const handleSaveEducation = async () => {
    try {
      setEducationLoading(true);
      await userServices.updateEducation(profileData.education);
      toast.success("Thông tin học vấn đã được cập nhật!");
    } catch (error) {
      console.error("Error saving education:", error);
      toast.error("Có lỗi khi lưu thông tin học vấn");
    } finally {
      setEducationLoading(false);
    }
  };

  // Function to save work experience section
  const handleSaveWorkExperience = async () => {
    try {
      setWorkExpLoading(true);
      await userServices.updateWorkExperience(profileData.workExperience);
      toast.success("Thông tin kinh nghiệm làm việc đã được cập nhật!");
    } catch (error) {
      console.error("Error saving work experience:", error);
      toast.error("Có lỗi khi lưu thông tin kinh nghiệm làm việc");
    } finally {
      setWorkExpLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Hồ sơ cá nhân
      </h2>
      
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tên
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={profileData.fullName}
            onChange={(e) => handleProfileChange('fullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500">
            Tên của bạn có thể xuất hiện khi bạn đóng góp hoặc được đề cập. Bạn có thể xóa nó bất cứ lúc nào.
          </p>
        </div>
        
        {/* Email dropdown */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email công khai
          </label>
          <div className="relative">
            <select
              id="email"
              value={profileData.email || ''}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Chọn email đã xác thực để hiển thị</option>
              {verifiedEmails.map(item => (
                <option key={item.Email} value={item.Email}>{item.Email}{item.IsPrimary ? ' (Chính)' : ''}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Bạn đã đặt địa chỉ email ở chế độ riêng tư. Để chuyển đổi quyền riêng tư email, hãy vào <span className="text-blue-500">cài đặt email</span> và bỏ chọn "Giữ địa chỉ email riêng tư."
          </p>
        </div>
        
        {/* Bio */}
        <div className="space-y-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Tiểu sử
          </label>
          <textarea
            id="bio"
            name="bio"
            rows="4"
            value={profileData.bio || ''}
            onChange={(e) => handleProfileChange('bio', e.target.value)}
            placeholder="Hãy cho chúng tôi biết một chút về bạn"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
          <p className="text-xs text-gray-500">
            Bạn có thể @đề cập đến người dùng và tổ chức khác để liên kết đến họ.
          </p>
        </div>
        
        {/* School */}
        <div className="space-y-2">
          <label htmlFor="school" className="block text-sm font-medium text-gray-700">
            Trường học
          </label>
          <input
            type="text"
            id="school"
            name="school"
            value={profileData.school || ''}
            onChange={(e) => handleProfileChange('school', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tên trường học của bạn"
          />
        </div>
        
        {/* Pronouns */}
        <div className="space-y-2">
          <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700">
            Đại từ nhân xưng
          </label>
          <div className="relative">
            <select
              id="pronouns"
              value={profileData.pronouns || ''}
              onChange={(e) => handleProfileChange('pronouns', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Không chỉ định</option>
              <option value="he/him">anh/của anh</option>
              <option value="she/her">chị/của chị</option>
              <option value="they/them">họ/của họ</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Học vấn</h3>
            <button
              type="button"
              onClick={handleAddEducation}
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Thêm học vấn
            </button>
          </div>
          
          {profileData.education && profileData.education.length > 0 ? (
            profileData.education.map((edu, index) => (
              <div key={edu.id || index} className="p-4 border rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Học vấn {index + 1}</h4>
                  <button 
                    type="button"
                    onClick={() => handleRemoveEducation(edu.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trường học
                    </label>
                    <input
                      type="text"
                      value={edu.school || ''}
                      onChange={(e) => handleUpdateEducation(edu.id, 'school', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bằng cấp
                    </label>
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngành học
                  </label>
                  <input
                    type="text"
                    value={edu.field || ''}
                    onChange={(e) => handleUpdateEducation(edu.id, 'field', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      value={edu.startDate || ''}
                      onChange={(e) => handleUpdateEducation(edu.id, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      value={edu.endDate || ''}
                      onChange={(e) => handleUpdateEducation(edu.id, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={edu.current}
                    />
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id={`current-edu-${edu.id}`}
                    checked={edu.current || false}
                    onChange={(e) => handleUpdateEducation(edu.id, 'current', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`current-edu-${edu.id}`} className="ml-2 block text-sm text-gray-700">
                    Đang học
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    rows="2"
                    value={edu.description || ''}
                    onChange={(e) => handleUpdateEducation(edu.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-500 text-center bg-gray-50 border border-dashed rounded-md">
              Chưa có thông tin học vấn. Nhấn "Thêm học vấn" để bắt đầu.
            </div>
          )}

          {profileData.education && profileData.education.length > 0 && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveEducation}
                disabled={educationLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                {educationLoading ? "Đang lưu..." : "Lưu thông tin học vấn"}
              </button>
            </div>
          )}
        </div>

        {/* Work Experience Section */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Kinh nghiệm làm việc</h3>
            <button
              type="button"
              onClick={handleAddWorkExperience}
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Thêm kinh nghiệm
            </button>
          </div>
          
          {profileData.workExperience && profileData.workExperience.length > 0 ? (
            profileData.workExperience.map((work, index) => (
              <div key={work.id || index} className="p-4 border rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Kinh nghiệm {index + 1}</h4>
                  <button 
                    type="button"
                    onClick={() => handleRemoveWorkExperience(work.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Công ty
                    </label>
                    <input
                      type="text"
                      value={work.company || ''}
                      onChange={(e) => handleUpdateWorkExperience(work.id, 'company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vị trí
                    </label>
                    <input
                      type="text"
                      value={work.position || ''}
                      onChange={(e) => handleUpdateWorkExperience(work.id, 'position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={work.location || ''}
                    onChange={(e) => handleUpdateWorkExperience(work.id, 'location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Thành phố, Quốc gia"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      value={work.startDate || ''}
                      onChange={(e) => handleUpdateWorkExperience(work.id, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      value={work.endDate || ''}
                      onChange={(e) => handleUpdateWorkExperience(work.id, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={work.current}
                    />
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id={`current-work-${work.id}`}
                    checked={work.current || false}
                    onChange={(e) => handleUpdateWorkExperience(work.id, 'current', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`current-work-${work.id}`} className="ml-2 block text-sm text-gray-700">
                    Đang làm việc tại đây
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả công việc
                  </label>
                  <textarea
                    rows="2"
                    value={work.description || ''}
                    onChange={(e) => handleUpdateWorkExperience(work.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Mô tả trách nhiệm và thành tựu của bạn"
                  ></textarea>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-500 text-center bg-gray-50 border border-dashed rounded-md">
              Chưa có thông tin kinh nghiệm làm việc. Nhấn "Thêm kinh nghiệm" để bắt đầu.
            </div>
          )}

          {profileData.workExperience && profileData.workExperience.length > 0 && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveWorkExperience}
                disabled={workExpLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                {workExpLoading ? "Đang lưu..." : "Lưu kinh nghiệm làm việc"}
              </button>
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800">Kỹ năng</h3>
          
          <div className="mb-2">
            <label htmlFor="skill-input" className="block text-sm font-medium text-gray-700 mb-1">
              Thêm kỹ năng mới
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="skill-input"
                placeholder="Nhập kỹ năng và nhấn Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => handleKeyPress(e, 'skill')}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('skill-input');
                  if (input.value.trim()) {
                    handleAddSkill(input.value.trim());
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Thêm
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {profileData.skills && profileData.skills.length > 0 ? (
              profileData.skills.map((skill, index) => (
                <div 
                  key={index} 
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic w-full">Chưa có kỹ năng nào</div>
            )}
          </div>
        </div>

        {/* Interests Section */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800">Sở thích</h3>
          
          <div className="mb-2">
            <label htmlFor="interest-input" className="block text-sm font-medium text-gray-700 mb-1">
              Thêm sở thích mới
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="interest-input"
                placeholder="Nhập sở thích và nhấn Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => handleKeyPress(e, 'interest')}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('interest-input');
                  if (input.value.trim()) {
                    handleAddInterest(input.value.trim());
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Thêm
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {profileData.interests && profileData.interests.length > 0 ? (
              profileData.interests.map((interest, index) => (
                <div 
                  key={index} 
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  <span>{interest}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic w-full">Chưa có sở thích nào</div>
            )}
          </div>
        </div>

        {/* URL */}
        <div className="space-y-2 border-t pt-4">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            URL trang web cá nhân
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={profileData.url || ''}
            onChange={(e) => handleProfileChange('url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com"
          />
        </div>
        
        {/* ORCID iD */}
        <div className="space-y-2">
          <label htmlFor="orcid" className="block text-sm font-medium text-gray-700">
            ORCID iD
          </label>
          <input
            type="text"
            id="orcid"
            name="orcid"
            value={profileData.orcidId || ''}
            onChange={(e) => handleProfileChange('orcidId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0000-0000-0000-0000"
          />
          <p className="text-xs text-gray-500">
            ORCID cung cấp một định danh liên tục - ORCID iD - giúp phân biệt bạn với các nhà nghiên cứu khác. Tìm hiểu thêm tại <a href="https://orcid.org" className="text-blue-500">ORCID.org</a>.
          </p>
        </div>
        
        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </span>
            ) : "Cập nhật hồ sơ"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
