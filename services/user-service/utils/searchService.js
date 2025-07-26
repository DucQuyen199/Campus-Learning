const { pool } = require('../config/db');

async function globalSearch(query) {
  const like = `%${query}%`;
  const [users, courses, posts, events, exams, competitions] = await Promise.all([
    pool.request().input('query', like).query(
      `SELECT TOP 10 UserID as id, Username as title, FullName as subtitle
       FROM Users
       WHERE Username LIKE @query OR FullName LIKE @query`
    ),
    pool.request().input('query', like).query(
      `SELECT TOP 10 CourseID as id, Title as title, ShortDescription as subtitle
       FROM Courses
       WHERE Title LIKE @query OR ShortDescription LIKE @query`
    ),
    pool.request().input('query', like).query(
      `SELECT TOP 10 PostID as id, SUBSTRING(Content, 1, 100) as title, NULL as subtitle
       FROM Posts
       WHERE Content LIKE @query`
    ),
    pool.request().input('query', like).query(
      `SELECT TOP 10 EventID as id, Title as title, Location as subtitle
       FROM Events
       WHERE Title LIKE @query OR Location LIKE @query`
    ),
    pool.request().input('query', like).query(
      `SELECT TOP 10 ExamID as id, Title as title, NULL as subtitle
       FROM Exams
       WHERE Title LIKE @query`
    ),
    pool.request().input('query', like).query(
      `SELECT TOP 10 CompetitionID as id, Title as title, NULL as subtitle
       FROM Competitions
       WHERE Title LIKE @query`
    )
  ]);

  return {
    users: users.recordset,
    courses: courses.recordset,
    posts: posts.recordset,
    events: events.recordset,
    exams: exams.recordset,
    competitions: competitions.recordset
  };
}

module.exports = { globalSearch }; 