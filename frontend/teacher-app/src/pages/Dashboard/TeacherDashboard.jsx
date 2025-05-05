import React, { useState, useEffect } from 'react';
import { 
    Grid, 
    Card, 
    Typography, 
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { teacherApi } from '../../api/teacherApi';

const TeacherDashboard = () => {
    const [stats, setStats] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, coursesData] = await Promise.all([
                    teacherApi.getStats(),
                    teacherApi.getCourses()
                ]);
                setStats(statsData);
                setCourses(coursesData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <Box p={3}>
            <Grid container spacing={3}>
                {/* Thống kê */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <Box p={2}>
                            <Typography variant="h6">Tổng số khóa học</Typography>
                            <Typography variant="h3">{stats?.TotalCourses || 0}</Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <Box p={2}>
                            <Typography variant="h6">Tổng số học sinh</Typography>
                            <Typography variant="h3">{stats?.TotalStudents || 0}</Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <Box p={2}>
                            <Typography variant="h6">Đánh giá trung bình</Typography>
                            <Typography variant="h3">
                                {stats?.AverageRating ? stats.AverageRating.toFixed(1) : 'N/A'}/5
                            </Typography>
                        </Box>
                    </Card>
                </Grid>

                {/* Danh sách khóa học */}
                <Grid item xs={12}>
                    <Paper>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tên khóa học</TableCell>
                                    <TableCell>Số học sinh</TableCell>
                                    <TableCell>Đánh giá</TableCell>
                                    <TableCell>Trạng thái</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {courses.map((course) => (
                                    <TableRow key={course.CourseID}>
                                        <TableCell>{course.Title}</TableCell>
                                        <TableCell>{course.StudentCount}</TableCell>
                                        <TableCell>{course.AverageRating?.toFixed(1) || 'N/A'}</TableCell>
                                        <TableCell>{course.Status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeacherDashboard; 