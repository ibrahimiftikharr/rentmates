/**
 * Helper function to emit dashboard metric updates via Socket.IO
 * Call this whenever a student's dashboard metrics might have changed
 */
const emitDashboardUpdate = (io, userId, eventType = 'metrics_updated') => {
  if (!io || !userId) return;
  
  try {
    // Emit to student's room
    io.to(`student_${userId}`).emit(eventType, {
      timestamp: new Date(),
      userId
    });
    
    console.log(`✓ Emitted ${eventType} to student_${userId}`);
  } catch (error) {
    console.error('Error emitting dashboard update:', error);
  }
};

/**
 * Emit activity update
 */
const emitActivityUpdate = (io, userId, activity) => {
  if (!io || !userId) return;
  
  try {
    io.to(`student_${userId}`).emit('new_activity', {
      timestamp: new Date(),
      userId,
      activity
    });
    
    console.log(`✓ Emitted new_activity to student_${userId}`);
  } catch (error) {
    console.error('Error emitting activity update:', error);
  }
};

module.exports = {
  emitDashboardUpdate,
  emitActivityUpdate
};
