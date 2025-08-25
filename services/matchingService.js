// This service implements the Gale-Shapley algorithm for stable matching
// between students and lecturers based on preferences

const galeShapleyMatching = (students, lecturers) => {
  // Initialize all students and lecturers to free
  const freeStudents = [...students];
  const freeLecturers = [...lecturers];
  const matches = {};
  const proposals = {};

  // Initialize empty matches and proposals
  students.forEach(student => {
    matches[student.id] = null;
    proposals[student.id] = 0;
  });

  lecturers.forEach(lecturer => {
    matches[lecturer.id] = [];
  });

  while (freeStudents.length > 0) {
    const student = freeStudents[0];
    const studentPrefs = student.preferences;
    
    // If student has proposed to all lecturers, remove from free list
    if (proposals[student.id] >= studentPrefs.length) {
      freeStudents.shift();
      continue;
    }

    // Get the next preferred lecturer for this student
    const lecturerId = studentPrefs[proposals[student.id]];
    const lecturer = lecturers.find(l => l.id === lecturerId);

    proposals[student.id]++;

    if (matches[lecturerId].length < lecturer.capacity) {
      // Lecturer has capacity, accept the proposal
      matches[lecturerId].push(student.id);
      matches[student.id] = lecturerId;
      freeStudents.shift();
    } else {
      // Lecturer is full, check if this student is preferred over the worst current match
      const currentMatches = matches[lecturerId];
      const lecturerPrefs = lecturer.preferences;
      
      // Find the worst current match for this lecturer
      let worstMatchIndex = -1;
      let worstMatchRank = -1;
      
      for (let i = 0; i < currentMatches.length; i++) {
        const rank = lecturerPrefs.indexOf(currentMatches[i]);
        if (rank > worstMatchRank) {
          worstMatchRank = rank;
          worstMatchIndex = i;
        }
      }
      
      // Check if this student is better than the worst current match
      const studentRank = lecturerPrefs.indexOf(student.id);
      
      if (studentRank < worstMatchRank) {
        // Replace the worst match with this student
        const rejectedStudentId = currentMatches[worstMatchIndex];
        matches[rejectedStudentId] = null;
        freeStudents.push(students.find(s => s.id === rejectedStudentId));
        
        currentMatches[worstMatchIndex] = student.id;
        matches[student.id] = lecturerId;
        freeStudents.shift();
      }
    }
  }

  return matches;
};

module.exports = { galeShapleyMatching };