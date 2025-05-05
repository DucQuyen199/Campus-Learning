const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseEnrollment = sequelize.define('CourseEnrollment', {
  EnrollmentID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  CourseID: {
    type: DataTypes.BIGINT
  },
  UserID: {
    type: DataTypes.BIGINT
  },
  Progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  LastAccessedLessonID: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  EnrolledAt: {
    type: DataTypes.STRING(30),
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  CompletedAt: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  CertificateIssued: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  Status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'completed', 'dropped', 'suspended']]
    }
  }
}, {
  tableName: 'CourseEnrollments',
  timestamps: false
});

module.exports = CourseEnrollment; 