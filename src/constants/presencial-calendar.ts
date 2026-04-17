export interface AttendanceWeek {
  week: number;
  dates: string;
  location: string;
}

export const PRESENCIAL_CALENDAR: Record<number, AttendanceWeek[]> = {
  1: [ // TSAS 1C (1.1.x)
    { week: 1, dates: '16/3 al 20/3', location: 'SALÓN PB' },
    { week: 7, dates: '27/4 al 1/5', location: 'Disposición Docente' },
    { week: 8, dates: '4/5 al 8/5', location: 'Disposición Docente' },
    { week: 9, dates: '11/5 al 15/5', location: 'SALÓN PB' },
    { week: 15, dates: '22/6 al 26/6', location: 'Disposición Docente' },
    { week: 16, dates: '29/6 al 3/7', location: 'Disposición Docente' },
  ],
  2: [ // TSAS 2C (1.2.x)
    { week: 4, dates: '6/4 al 10/4', location: 'SALÓN PB' },
    { week: 7, dates: '27/4 al 1/5', location: 'Disposición Docente' },
    { week: 8, dates: '4/5 al 8/5', location: 'Disposición Docente' },
    { week: 12, dates: '1/6 al 5/6', location: 'SALÓN PB' },
    { week: 15, dates: '22/6 al 26/6', location: 'Disposición Docente' },
    { week: 16, dates: '29/6 al 3/7', location: 'Disposición Docente' },
  ],
  3: [ // TSAS 3C (2.1.x)
    { week: 6, dates: '20/4 al 24/4', location: '201 2° Piso' },
    { week: 7, dates: '27/4 al 1/5', location: 'Disposición Docente' },
    { week: 8, dates: '4/5 al 8/5', location: 'Disposición Docente' },
    { week: 14, dates: '15/6 al 19/6', location: '201 2° Piso' },
    { week: 15, dates: '22/6 al 26/6', location: 'Disposición Docente' },
    { week: 16, dates: '29/6 al 3/7', location: 'Disposición Docente' },
  ],
  4: [ // TSAS 4C (2.2.x)
    { week: 3, dates: '30/3 al 3/4', location: '202 2° Piso' },
    { week: 7, dates: '27/4 al 1/5', location: 'Disposición Docente' },
    { week: 8, dates: '4/5 al 8/5', location: 'Disposición Docente' },
    { week: 11, dates: '25/5 al 29/5', location: '202 2° Piso' },
    { week: 15, dates: '22/6 al 26/6', location: 'Disposición Docente' },
    { week: 16, dates: '29/6 al 3/7', location: 'Disposición Docente' },
  ],
  5: [ // TSAS 5C (3.1.x)
    { week: 4, dates: '6/4 al 10/4', location: '201 2° Piso' },
    { week: 7, dates: '27/4 al 1/5', location: 'Disposición Docente' },
    { week: 8, dates: '4/5 al 8/5', location: 'Disposición Docente' },
    { week: 12, dates: '1/6 al 5/6', location: '201 2° Piso' },
    { week: 15, dates: '22/6 al 26/6', location: 'Disposición Docente' },
    { week: 16, dates: '29/6 al 3/7', location: 'Disposición Docente' },
  ],
};

export const getCuatrimestreFromCode = (code: string): number => {
  if (code.startsWith('1.1.')) return 1;
  if (code.startsWith('1.2.')) return 2;
  if (code.startsWith('2.1.')) return 3;
  if (code.startsWith('2.2.')) return 2; // Error in my logic or user? 
  // Wait, TSAS 4C is 2nd year 2nd cuatrimestre. 
  // Let's re-map:
  // 1.1 -> 1
  // 1.2 -> 2
  // 2.1 -> 3
  // 2.2 -> 4
  // 3.1 -> 5
  if (code.startsWith('2.2.')) return 4;
  if (code.startsWith('3.1.')) return 5;
  return 0;
};
