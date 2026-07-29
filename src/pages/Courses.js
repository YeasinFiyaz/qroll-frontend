import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [enrollMsg, setEnrollMsg] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await API.get('/courses/my-courses');
      setCourses(res.data);
    } catch (err) {}
  };

  const createCourse = async () => {
    setMessage(''); setError('');
    try {
      await API.post('/courses/create', {
        course_name: courseName,
        course_code: courseCode,
      });
      setMessage('Course created successfully!');
      setCourseName(''); setCourseCode('');
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course');
    }
  };

  const enrollStudent = async (course_id) => {
    setEnrollMsg('');
    try {
      const res = await API.post('/courses/enroll', { student_email: studentEmail, course_id });
      setEnrollMsg(res.data.message);
      setStudentEmail('');
      loadStudents(course_id);
    } catch (err) {
      setEnrollMsg(err.response?.data?.error || 'Failed to enroll student');
    }
  };

  const loadStudents = async (course_id) => {
    try {
      const res = await API.get(`/courses/${course_id}/students`);
      setStudents(res.data);
    } catch (err) {}
  };

  const selectCourse = (course) => {
    setSelectedCourse(course);
    setEnrollMsg('');
    setStudentEmail('');
    loadStudents(course.course_id);
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.heading}>Course Management</h2>

        {/* Create Course */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Create New Course</h3>
          <input
            style={styles.input}
            type="text"
            placeholder="Course Name (e.g. Software Engineering)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Course Code (e.g. CSE301)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          />
          <button style={styles.button} onClick={createCourse}>
            Create Course
          </button>
          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </div>

        {/* My Courses */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>My Courses</h3>
          {courses.length === 0 ? (
            <p style={styles.hint}>No courses yet. Create one above!</p>
          ) : (
            courses.map((course) => (
              <div
                key={course.course_id}
                style={{
                  ...styles.courseRow,
                  backgroundColor: selectedCourse?.course_id === course.course_id
                    ? '#EEF6FB' : '#f9f9f9',
                }}
                onClick={() => selectCourse(course)}
              >
                <div>
                  <b style={{ color: '#1F3864' }}>{course.course_name}</b>
                  <span style={styles.badge}>{course.course_code}</span>
                </div>
                <span style={styles.hint}>ID: {course.course_id}</span>
              </div>
            ))
          )}
        </div>

        {/* Enroll Student */}
        {selectedCourse && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              Enroll Student into {selectedCourse.course_name}
            </h3>
            <input
              style={styles.input}
              type="email"
              placeholder="Student email address"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
            />
            <button
              style={styles.button}
              onClick={() => enrollStudent(selectedCourse.course_id)}
            >
              Enroll Student
            </button>
            {enrollMsg && (
              <p style={enrollMsg.includes('success') ? styles.success : styles.error}>
                {enrollMsg}
              </p>
            )}

            {/* Enrolled Students List */}
            {students.length > 0 && (
              <>
                <h4 style={{ color: '#2E75B6', marginTop: '20px' }}>
                  Enrolled Students ({students.length})
                </h4>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                        <td style={styles.td}>{s.name}</td>
                        <td style={styles.td}>{s.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '680px', margin: '40px auto', padding: '0 20px' },
  heading: { color: '#1F3864', marginBottom: '24px' },
  card: {
    backgroundColor: '#fff', padding: '24px',
    borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  },
  cardTitle: { color: '#2E75B6', marginBottom: '16px' },
  input: {
    width: '100%', padding: '10px', marginBottom: '12px',
    borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '14px', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '12px', backgroundColor: '#2E75B6',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '15px', cursor: 'pointer',
  },
  success: { color: 'green', marginTop: '8px', fontWeight: 'bold' },
  error: { color: 'red', marginTop: '8px' },
  hint: { color: '#888', fontSize: '13px' },
  courseRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '12px 16px',
    borderRadius: '8px', marginBottom: '8px',
    cursor: 'pointer', border: '1px solid #eee',
  },
  badge: {
    backgroundColor: '#2E75B6', color: '#fff',
    padding: '2px 10px', borderRadius: '12px',
    fontSize: '12px', marginLeft: '10px',
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' },
  th: {
    backgroundColor: '#2E75B6', color: '#fff',
    padding: '10px', textAlign: 'left', fontSize: '13px',
  },
  td: { padding: '10px', fontSize: '13px' },
  rowEven: { backgroundColor: '#f9f9f9' },
  rowOdd: { backgroundColor: '#fff' },
};

export default Courses;