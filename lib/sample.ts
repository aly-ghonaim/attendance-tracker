import type { Extraction } from './extract';

// Group 1 (Year 2), Cybersecurity & Networks, Term 1, read by hand from the UEL timetable and the
// 2025-26 academic calendar. Weekdays: 0=Sun..6=Sat. Only the holiday inside the term is listed.
export const uelTerm1: Extraction = {
  start: '2025-09-27',
  classesEnd: '2025-12-18',
  holidays: [{ from: '2025-10-06', to: '2025-10-06' }],
  courses: [
    {
      name: 'Database Systems',
      slots: [
        { day: 1, time: '11:30', type: 'lab' },
        { day: 2, time: '08:30', type: 'lab' },
        { day: 3, time: '12:00', type: 'lecture' },
        { day: 3, time: '13:30', type: 'lecture' },
      ],
    },
    {
      name: 'Mental Wealth Professional Life 2',
      slots: [
        { day: 3, time: '08:30', type: 'lab' },
        { day: 4, time: '10:00', type: 'lab' },
        { day: 4, time: '11:30', type: 'lecture' },
        { day: 4, time: '15:00', type: 'lecture' },
      ],
    },
    {
      name: 'Cyber Security',
      slots: [
        { day: 1, time: '08:30', type: 'lab' },
        { day: 1, time: '10:00', type: 'lab' },
        { day: 2, time: '13:30', type: 'lecture' },
        { day: 2, time: '15:00', type: 'lecture' },
      ],
    },
  ],
};
