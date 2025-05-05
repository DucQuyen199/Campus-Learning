import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Typography
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const CourseForm = ({ onSubmit, initialValues = {} }) => {
  const formik = useFormik({
    initialValues: {
      title: initialValues.title || '',
      description: initialValues.description || '',
      level: initialValues.level || 'beginner',
      category: initialValues.category || '',
      language: initialValues.language || 'vi',
      duration: initialValues.duration || '',
      capacity: initialValues.capacity || '',
      price: initialValues.price || '',
      requirements: initialValues.requirements || '',
      objectives: initialValues.objectives || '',
      syllabus: initialValues.syllabus || '',
    },
    validationSchema: Yup.object({
      title: Yup.string().required('Title is required'),
      description: Yup.string().required('Description is required'),
      level: Yup.string().required('Level is required'),
      category: Yup.string().required('Category is required'),
      duration: Yup.number().required('Duration is required'),
      capacity: Yup.number().required('Capacity is required'),
      price: Yup.number().required('Price is required'),
    }),
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="title"
            label="Course Title"
            value={formik.values.title}
            onChange={formik.handleChange}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            name="description"
            label="Description"
            value={formik.values.description}
            onChange={formik.handleChange}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Level</InputLabel>
            <Select
              name="level"
              value={formik.values.level}
              onChange={formik.handleChange}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
              <MenuItem value="expert">Expert</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Add other form fields */}

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
          >
            {initialValues.id ? 'Update Course' : 'Create Course'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseForm; 