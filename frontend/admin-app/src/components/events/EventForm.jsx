/*-----------------------------------------------------------------
* File: EventForm.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const EventForm = ({ onSubmit, initialValues = {} }) => {
  const formik = useFormik({
    initialValues: {
      title: initialValues.title || '',
      description: initialValues.description || '',
      category: initialValues.category || '',
      eventDate: initialValues.eventDate || null,
      eventTime: initialValues.eventTime || null,
      location: initialValues.location || '',
      maxAttendees: initialValues.maxAttendees || '',
      price: initialValues.price || '',
      organizer: initialValues.organizer || '',
      difficulty: initialValues.difficulty || 'beginner',
    },
    validationSchema: Yup.object({
      title: Yup.string().required('Title is required'),
      description: Yup.string().required('Description is required'),
      category: Yup.string().required('Category is required'),
      eventDate: Yup.date().required('Event date is required'),
      eventTime: Yup.date().required('Event time is required'),
      location: Yup.string().required('Location is required'),
      maxAttendees: Yup.number().required('Maximum attendees is required'),
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
            label="Event Title"
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
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
            >
              {/* Add category options here */}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <DatePicker
            label="Event Date"
            value={formik.values.eventDate}
            onChange={(newValue) => {
              formik.setFieldValue('eventDate', newValue);
            }}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TimePicker
            label="Event Time"
            value={formik.values.eventTime}
            onChange={(newValue) => {
              formik.setFieldValue('eventTime', newValue);
            }}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            name="location"
            label="Location"
            value={formik.values.location}
            onChange={formik.handleChange}
            error={formik.touched.location && Boolean(formik.errors.location)}
            helperText={formik.touched.location && formik.errors.location}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            name="maxAttendees"
            label="Maximum Attendees"
            type="number"
            value={formik.values.maxAttendees}
            onChange={formik.handleChange}
            error={formik.touched.maxAttendees && Boolean(formik.errors.maxAttendees)}
            helperText={formik.touched.maxAttendees && formik.errors.maxAttendees}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            name="price"
            label="Price"
            type="number"
            value={formik.values.price}
            onChange={formik.handleChange}
            error={formik.touched.price && Boolean(formik.errors.price)}
            helperText={formik.touched.price && formik.errors.price}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            name="organizer"
            label="Organizer"
            value={formik.values.organizer}
            onChange={formik.handleChange}
            error={formik.touched.organizer && Boolean(formik.errors.organizer)}
            helperText={formik.touched.organizer && formik.errors.organizer}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Difficulty</InputLabel>
            <Select
              name="difficulty"
              value={formik.values.difficulty}
              onChange={formik.handleChange}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
              <MenuItem value="expert">Expert</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
          >
            {initialValues.id ? 'Update Event' : 'Create Event'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventForm; 
