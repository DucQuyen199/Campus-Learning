/*-----------------------------------------------------------------
* File: rankingController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { User, Ranking, Achievement, UserAchievement } = require('../models');
const { Op } = require('sequelize');

// Get all rankings ordered by total points
exports.getAllRankings = async (req, res) => {
  try {
    const { timeRange = 'all', limit = 100 } = req.query;
    
    let orderField = 'TotalPoints';
    
    // Set the correct field to order by based on time range
    if (timeRange === 'week') {
      orderField = 'WeeklyScore';
    } else if (timeRange === 'month') {
      orderField = 'MonthlyScore';
    }
    
    const rankings = await Ranking.findAll({
      include: [
        {
          model: User,
          attributes: ['UserID', 'Username', 'FullName', 'Email', 'Image']
        }
      ],
      order: [[orderField, 'DESC']],
      limit: parseInt(limit)
    });
    
    // Format the response
    const formattedRankings = rankings.map(ranking => ({
      id: ranking.User.UserID,
      name: ranking.User.FullName || ranking.User.Username,
      avatar: ranking.User.Image,
      points: timeRange === 'week' ? ranking.WeeklyScore : 
              timeRange === 'month' ? ranking.MonthlyScore : 
              ranking.TotalPoints,
      tier: ranking.Tier,
      completedCourses: null, // This would come from a course enrollment count
    }));
    
    res.status(200).json(formattedRankings);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ message: 'Failed to fetch rankings', error: error.message });
  }
};

// Utility function to ensure a user has a ranking record
const ensureUserRanking = async (userId) => {
  try {
    // Try to find existing ranking
    let ranking = await Ranking.findOne({
      where: { UserID: userId }
    });
    
    // If doesn't exist, create a default one
    if (!ranking) {
      console.log(`Creating default ranking for user ${userId}`);
      
      // Create with null value for date field to use DB default
      // This avoids SQL Server date conversion issues
      ranking = await Ranking.create({
        UserID: userId,
        Tier: 'BRONZE',
        TotalPoints: 0,
        EventPoints: 0,
        CoursePoints: 0,
        ProblemsSolved: 0,
        Accuracy: 0,
        Wins: 0,
        WeeklyScore: 0,
        MonthlyScore: 0,
        LastCalculatedAt: null // Let SQL Server use default value
      });
    }
    
    return ranking;
  } catch (error) {
    console.error('Failed to ensure user ranking:', error);
    throw error;
  }
};

// Export the function for use in other controllers
exports.ensureUserRanking = ensureUserRanking;

// Get user's ranking by ID
exports.getUserRanking = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user has a ranking record
    const ranking = await ensureUserRanking(userId);
    
    // Get user details
    const user = await User.findByPk(ranking.UserID, {
      attributes: ['UserID', 'Username', 'FullName', 'Email', 'Image']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's achievements
    const achievements = await UserAchievement.findAll({
      where: { UserID: userId },
      include: [{ model: Achievement }]
    });
    
    const userRanking = {
      id: user.UserID,
      name: user.FullName || user.Username,
      avatar: user.Image,
      totalPoints: ranking.TotalPoints,
      weeklyPoints: ranking.WeeklyScore,
      monthlyPoints: ranking.MonthlyScore,
      tier: ranking.Tier,
      problemsSolved: ranking.ProblemsSolved,
      accuracy: ranking.Accuracy,
      wins: ranking.Wins,
      achievements: achievements.map(a => ({
        id: a.Achievement?.AchievementID,
        name: a.Achievement?.Name,
        description: a.Achievement?.Description,
        icon: a.Achievement?.Icon,
        earnedAt: a.EarnedAt
      }))
    };
    
    res.status(200).json(userRanking);
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    res.status(500).json({ message: 'Failed to fetch user ranking', error: error.message });
  }
};

// Add points to a user's ranking
exports.addPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, reason, type } = req.body;
    
    if (!points || !reason || !type) {
      return res.status(400).json({ message: 'Points, reason, and type are required' });
    }
    
    // Find or create user ranking
    const [ranking, created] = await Ranking.findOrCreate({
      where: { UserID: userId },
      defaults: {
        UserID: userId,
        TotalPoints: 0,
        EventPoints: 0,
        CoursePoints: 0,
        WeeklyScore: 0,
        MonthlyScore: 0,
        Tier: 'BRONZE'
      }
    });
    
    // Update the appropriate fields
    const numPoints = parseInt(points);
    
    // Update field based on type
    if (type.toUpperCase() === 'EVENT') {
      ranking.EventPoints += numPoints;
    } else if (type.toUpperCase() === 'COURSE') {
      ranking.CoursePoints += numPoints;
    }
    
    // Update total, weekly, and monthly scores
    ranking.TotalPoints += numPoints;
    ranking.WeeklyScore += numPoints;
    ranking.MonthlyScore += numPoints;
    
    // Determine the new tier based on total points
    if (ranking.TotalPoints >= 10000) {
      ranking.Tier = 'MASTER';
    } else if (ranking.TotalPoints >= 5000) {
      ranking.Tier = 'DIAMOND';
    } else if (ranking.TotalPoints >= 2500) {
      ranking.Tier = 'PLATINUM';
    } else if (ranking.TotalPoints >= 1000) {
      ranking.Tier = 'GOLD';
    } else if (ranking.TotalPoints >= 500) {
      ranking.Tier = 'SILVER';
    } else {
      ranking.Tier = 'BRONZE';
    }
    
    ranking.LastCalculatedAt = new Date();
    await ranking.save();
    
    res.status(200).json({
      message: 'Points added successfully',
      newTotal: ranking.TotalPoints,
      newTier: ranking.Tier
    });
  } catch (error) {
    console.error('Error adding points:', error);
    res.status(500).json({ message: 'Failed to add points', error: error.message });
  }
};

// Reset weekly rankings (Admin only)
exports.resetWeeklyRankings = async (req, res) => {
  try {
    await Ranking.update(
      { WeeklyScore: 0 },
      { where: {} }
    );
    
    res.status(200).json({ message: 'Weekly rankings reset successfully' });
  } catch (error) {
    console.error('Error resetting weekly rankings:', error);
    res.status(500).json({ message: 'Failed to reset weekly rankings', error: error.message });
  }
};

// Reset monthly rankings (Admin only)
exports.resetMonthlyRankings = async (req, res) => {
  try {
    await Ranking.update(
      { MonthlyScore: 0 },
      { where: {} }
    );
    
    res.status(200).json({ message: 'Monthly rankings reset successfully' });
  } catch (error) {
    console.error('Error resetting monthly rankings:', error);
    res.status(500).json({ message: 'Failed to reset monthly rankings', error: error.message });
  }
}; 
