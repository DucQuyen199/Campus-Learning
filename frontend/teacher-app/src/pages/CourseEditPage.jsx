import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetCourseByIdQuery, useUpdateCourseMutation } from '../api/courseApi';
import { 
  ArrowLeftIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const CourseEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetCourseByIdQuery(id);
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    level: '',
    category: '',
    subCategory: '',
    requirements: '',
    objectives: '',
    price: 0,
    discountPrice: 0,
    imageUrl: '',
    videoUrl: '',
    duration: 0
  });
  
  const [errors, setErrors] = useState({});
  
  // When data is loaded, populate the form
  useEffect(() => {
    if (data?.course) {
      const course = data.course;
      setFormData({
        title: course.Title || '',
        description: course.Description || '',
        shortDescription: course.ShortDescription || '',
        level: course.Level || '',
        category: course.Category || '',
        subCategory: course.SubCategory || '',
        requirements: course.Requirements || '',
        objectives: course.Objectives || '',
        price: course.Price || 0,
        discountPrice: course.DiscountPrice || 0,
        imageUrl: course.ImageUrl || '',
        videoUrl: course.VideoUrl || '',
        duration: course.Duration || 0
      });
    }
  }, [data]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề khóa học không được để trống';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả khóa học không được để trống';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin khóa học');
      return;
    }
    
    try {
      await updateCourse({
        id,
        courseData: {
          title: formData.title,
          description: formData.description,
          shortDescription: formData.shortDescription,
          level: formData.level,
          category: formData.category,
          subCategory: formData.subCategory,
          requirements: formData.requirements,
          objectives: formData.objectives,
          price: parseFloat(formData.price),
          discountPrice: parseFloat(formData.discountPrice),
          imageUrl: formData.imageUrl,
          videoUrl: formData.videoUrl,
          duration: parseInt(formData.duration, 10)
        }
      }).unwrap();
      
      toast.success('Cập nhật khóa học thành công');
      navigate(`/courses/${id}`);
    } catch (err) {
      console.error('Failed to update course:', err);
      toast.error('Có lỗi xảy ra khi cập nhật khóa học');
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin khóa học...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-500 text-center">
        <p>Không thể tải thông tin khóa học. Vui lòng thử lại.</p>
        <p className="mt-2">{error.message || 'Lỗi không xác định'}</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Back button */}
      <div className="mb-6">
        <Link to={`/courses/${id}`} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại chi tiết khóa học
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Chỉnh sửa khóa học
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề khóa học*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`block w-full rounded-md border ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500`}
                placeholder="Nhập tiêu đề khóa học"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>
            
            {/* Short Description */}
            <div className="col-span-2">
              <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả ngắn
              </label>
              <input
                type="text"
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Nhập mô tả ngắn về khóa học"
              />
            </div>
            
            {/* Description */}
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả chi tiết*
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className={`block w-full rounded-md border ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500`}
                placeholder="Nhập mô tả chi tiết về khóa học"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>
            
            {/* Category & SubCategory */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Danh mục khóa học"
              />
            </div>
            
            <div>
              <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục con
              </label>
              <input
                type="text"
                id="subCategory"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Danh mục con"
              />
            </div>
            
            {/* Level & Duration */}
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                Cấp độ
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              >
                <option value="">Chọn cấp độ</option>
                <option value="beginner">Cơ bản</option>
                <option value="intermediate">Trung cấp</option>
                <option value="advanced">Nâng cao</option>
                <option value="expert">Chuyên sâu</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Thời lượng (giờ)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                min="0"
                value={formData.duration}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Nhập thời lượng khóa học"
              />
            </div>
            
            {/* Requirements & Objectives */}
            <div className="col-span-2">
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
                Yêu cầu
              </label>
              <textarea
                id="requirements"
                name="requirements"
                rows={3}
                value={formData.requirements}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Nhập yêu cầu đầu vào của khóa học"
              />
              <p className="mt-1 text-xs text-gray-500">
                Nhập danh sách các yêu cầu, mỗi yêu cầu trên một dòng
              </p>
            </div>
            
            <div className="col-span-2">
              <label htmlFor="objectives" className="block text-sm font-medium text-gray-700 mb-1">
                Mục tiêu học tập
              </label>
              <textarea
                id="objectives"
                name="objectives"
                rows={3}
                value={formData.objectives}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Nhập mục tiêu học tập của khóa học"
              />
              <p className="mt-1 text-xs text-gray-500">
                Nhập danh sách các mục tiêu, mỗi mục tiêu trên một dòng
              </p>
            </div>
            
            {/* Price & Discount Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Giá gốc (VNĐ)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Nhập giá khóa học"
              />
            </div>
            
            <div>
              <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Giá khuyến mãi (VNĐ)
              </label>
              <input
                type="number"
                id="discountPrice"
                name="discountPrice"
                min="0"
                value={formData.discountPrice}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Nhập giá khuyến mãi (nếu có)"
              />
            </div>
            
            {/* Image & Video */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                URL hình ảnh
              </label>
              <input
                type="text"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Nhập URL hình ảnh"
              />
            </div>
            
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                URL video
              </label>
              <input
                type="text"
                id="videoUrl"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Nhập URL video giới thiệu"
              />
            </div>
          </div>
          
          {/* Submit buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              to={`/courses/${id}`}
              className="btn btn-outline-secondary"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isUpdating}
              className="btn btn-primary"
            >
              {isUpdating ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEditPage; 