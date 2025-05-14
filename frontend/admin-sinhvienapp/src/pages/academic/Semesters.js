import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Semesters = () => {
  const [semesters, setSemesters] = useState([]);
  const [filteredSemesters, setFilteredSemesters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);

  // Mock data
  const mockSemesters = [
    {
      id: 1,
      name: 'Spring 2023',
      startDate: '2023-01-10',
      endDate: '2023-05-31',
      isActive: true,
      numberOfSubjects: 15,
      numberOfStudents: 520,
      status: 'Completed'
    },
    {
      id: 2,
      name: 'Fall 2023',
      startDate: '2023-08-15',
      endDate: '2023-12-20',
      isActive: true,
      numberOfSubjects: 18,
      numberOfStudents: 650,
      status: 'Completed'
    },
    {
      id: 3,
      name: 'Spring 2024',
      startDate: '2024-01-15',
      endDate: '2024-05-30',
      isActive: true,
      numberOfSubjects: 20,
      numberOfStudents: 680,
      status: 'In Progress'
    },
    {
      id: 4,
      name: 'Fall 2024',
      startDate: '2024-08-20',
      endDate: '2024-12-25',
      isActive: false,
      numberOfSubjects: 0,
      numberOfStudents: 0,
      status: 'Planned'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSemesters(mockSemesters);
      setFilteredSemesters(mockSemesters);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = semesters.filter(semester => 
        semester.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSemesters(filtered);
    } else {
      setFilteredSemesters(semesters);
    }
  }, [searchTerm, semesters]);

  const handleDeleteClick = (semester) => {
    setSelectedSemester(semester);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // Simulate API call to delete semester
    const updatedSemesters = semesters.filter(
      semester => semester.id !== selectedSemester.id
    );
    setSemesters(updatedSemesters);
    setDeleteDialogOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Planned':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Academic Semesters
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          label="Search Semesters"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '300px' }}
          InputProps={{
            endAdornment: <SearchIcon color="action" />,
          }}
        />
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/academic/semesters/add"
        >
          Add Semester
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Subjects</TableCell>
              <TableCell align="center">Students</TableCell>
              <TableCell align="center">Active</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredSemesters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No semesters found
                </TableCell>
              </TableRow>
            ) : (
              filteredSemesters.map((semester) => (
                <TableRow key={semester.id}>
                  <TableCell>{semester.name}</TableCell>
                  <TableCell>{semester.startDate}</TableCell>
                  <TableCell>{semester.endDate}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={semester.status} 
                      color={getStatusColor(semester.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">{semester.numberOfSubjects}</TableCell>
                  <TableCell align="center">{semester.numberOfStudents}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={semester.isActive ? 'Yes' : 'No'} 
                      color={semester.isActive ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        component={Link} 
                        to={`/academic/semesters/${semester.id}`}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        component={Link} 
                        to={`/academic/semesters/${semester.id}/edit`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small"
                        onClick={() => handleDeleteClick(semester)}
                        disabled={semester.status === 'In Progress'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Semester</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the semester "{selectedSemester?.name}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Semesters; 