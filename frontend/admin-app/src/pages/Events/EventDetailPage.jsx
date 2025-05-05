import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, Grid, Chip, Button,
  Card, CardMedia, CardContent, Divider, List, ListItem, ListItemText,
  CircularProgress, Tab, Tabs
} from '@mui/material';
import { ArrowBack, CalendarToday, LocationOn, Group, Euro, AccessTime } from '@mui/icons-material';
import { format, parse } from 'date-fns';
import { getEventById, getEventLanguages, getEventTechnologies, getEventPrizes, getEventSchedule } from '../../api/events';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await getEventById(id);
        setEvent(response.data);

        try {
          const langRes = await getEventLanguages(id);
          setLanguages(langRes.data || []);
        } catch (error) {
          console.warn('Error fetching languages:', error);
        }

        try {
          const techRes = await getEventTechnologies(id);
          setTechnologies(techRes.data || []);
        } catch (error) {
          console.warn('Error fetching technologies:', error);
        }

        try {
          const prizeRes = await getEventPrizes(id);
          setPrizes(prizeRes.data || []);
        } catch (error) {
          console.warn('Error fetching prizes:', error);
        }

        try {
          const scheduleRes = await getEventSchedule(id);
          setSchedule(scheduleRes.data || []);
        } catch (error) {
          console.warn('Error fetching schedule:', error);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  const handleBack = () => {
    navigate('/events');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'MMMM dd, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  const formatEventTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      if (typeof timeStr === 'string') {
        // Chuẩn hóa định dạng thời gian
        const time = timeStr.trim();
        // Kiểm tra định dạng HH:MM:SS
        if (/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(time)) {
          return format(parse(time, 'HH:mm:ss', new Date()), 'h:mm a');
        }
        // Kiểm tra định dạng HH:MM
        else if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
          return format(parse(time, 'HH:mm', new Date()), 'h:mm a');
        }
      }
      return timeStr;
    } catch (error) {
      return timeStr;
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      case 'expert':
        return 'Expert';
      default:
        return difficulty;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return 'primary';
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatScheduleTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    try {
      return format(new Date(dateTimeStr), 'MMM dd, yyyy - h:mm a');
    } catch (error) {
      return dateTimeStr;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" my={10}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="lg">
        <Box my={4}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Back to Events
          </Button>
          <Typography variant="h4" align="center" my={10}>
            Event not found
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Events
        </Button>

        {/* Event Header */}
        <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
          {event.ImageUrl && (
            <Box sx={{ height: '300px', overflow: 'hidden', position: 'relative' }}>
              <CardMedia
                component="img"
                image={event.ImageUrl}
                alt={event.Title}
                sx={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  padding: 2
                }}
              >
                <Typography variant="h4" component="h1">
                  {event.Title}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <Chip 
                    label={event.Status} 
                    color={getStatusColor(event.Status)}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                    {formatEventDate(event.EventDate)} at {formatEventTime(event.EventTime)}
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                    {event.Location}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {!event.ImageUrl && (
            <Box sx={{ padding: 3 }}>
              <Typography variant="h4" component="h1">
                {event.Title}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <Chip 
                  label={event.Status} 
                  color={getStatusColor(event.Status)}
                  size="small"
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                  {formatEventDate(event.EventDate)} at {formatEventTime(event.EventTime)}
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                  {event.Location}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Tabs */}
        <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="event details tabs">
            <Tab label="Details" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Schedule" id="tab-1" aria-controls="tabpanel-1" />
            <Tab label="Prizes" id="tab-2" aria-controls="tabpanel-2" />
            <Tab label="Languages & Tech" id="tab-3" aria-controls="tabpanel-3" />
          </Tabs>
        </Box>

        {/* Details Tab */}
        <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" aria-labelledby="tab-0" sx={{ mb: 4 }}>
          {tabValue === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {event.Description || 'No description provided.'}
                  </Typography>
                </Paper>

                {/* Languages and Technologies */}
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Technical Details
                  </Typography>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Programming Languages
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {languages.length > 0 ? (
                      languages.map((lang, index) => (
                        <Chip 
                          key={index} 
                          label={lang.Language} 
                          variant="outlined" 
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No programming languages specified
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="subtitle1" gutterBottom>
                    Technologies
                  </Typography>
                  <Box>
                    {technologies.length > 0 ? (
                      technologies.map((tech, index) => (
                        <Chip 
                          key={index} 
                          label={tech.Technology} 
                          variant="outlined" 
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No technologies specified
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Event Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Category:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {event.Category || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Difficulty:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {getDifficultyLabel(event.Difficulty) || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Organizer:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {event.Organizer || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Image URL:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {event.ImageUrl || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" 
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Group fontSize="small" sx={{ mr: 0.5 }} />
                        Attendees:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {event.CurrentAttendees || 0}/{event.MaxAttendees || 'Unlimited'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Euro fontSize="small" sx={{ mr: 0.5 }} />
                        Price:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {event.Price > 0 ? `$${event.Price}` : 'Free'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created At:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {event.CreatedAt ? format(new Date(event.CreatedAt), 'MMM dd, yyyy') : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Schedule Tab */}
        <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" aria-labelledby="tab-1" sx={{ mb: 4 }}>
          {tabValue === 1 && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Event Schedule
              </Typography>
              
              {schedule.length > 0 ? (
                <List>
                  {schedule.map((item, index) => (
                    <React.Fragment key={item.ScheduleID || index}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={item.ActivityName}
                          secondary={
                            <React.Fragment>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AccessTime fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {formatScheduleTime(item.StartTime)} - {formatScheduleTime(item.EndTime)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography component="span" variant="body2">
                                  {item.Location || event.Location || 'N/A'}
                                </Typography>
                              </Box>
                              {item.Speaker && (
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>Speaker:</strong> {item.Speaker}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {item.Description || 'No description provided.'}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < schedule.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" align="center" py={4}>
                  No schedule information available
                </Typography>
              )}
            </Paper>
          )}
        </Box>

        {/* Prizes Tab */}
        <Box role="tabpanel" hidden={tabValue !== 2} id="tabpanel-2" aria-labelledby="tab-2" sx={{ mb: 4 }}>
          {tabValue === 2 && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Prizes
              </Typography>
              
              {prizes.length > 0 ? (
                <Grid container spacing={3}>
                  {prizes.map((prize, index) => (
                    <Grid item xs={12} sm={6} md={4} key={prize.PrizeID || index}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h5" component="div" color="primary" gutterBottom>
                            {prize.Rank === 1 ? '🥇 1st Place' : 
                             prize.Rank === 2 ? '🥈 2nd Place' : 
                             prize.Rank === 3 ? '🥉 3rd Place' : 
                             `${prize.Rank}th Place`}
                          </Typography>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            {prize.Name || (prize.PrizeAmount > 0 ? `$${prize.PrizeAmount}` : 'Recognition Prize')}
                          </Typography>
                          <Typography variant="body2">
                            {prize.Description || 'No description provided.'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary" align="center" py={4}>
                  No prize information available
                </Typography>
              )}
            </Paper>
          )}
        </Box>

        {/* Languages & Tech Tab */}
        <Box role="tabpanel" hidden={tabValue !== 3} id="tabpanel-3" aria-labelledby="tab-3" sx={{ mb: 4 }}>
          {tabValue === 3 && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Programming Languages & Technologies
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Programming Languages
              </Typography>
              <Box sx={{ mb: 4 }}>
                {languages.length > 0 ? (
                  languages.map((lang, index) => (
                    <Chip 
                      key={index} 
                      label={lang.Language} 
                      color="primary"
                      variant="outlined" 
                      size="medium"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No programming languages specified
                  </Typography>
                )}
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Technologies
              </Typography>
              <Box>
                {technologies.length > 0 ? (
                  technologies.map((tech, index) => (
                    <Chip 
                      key={index} 
                      label={tech.Technology} 
                      color="secondary"
                      variant="outlined" 
                      size="medium"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No technologies specified
                  </Typography>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default EventDetailPage; 