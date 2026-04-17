export interface Subject {
  year: string;
  code: string;
  name: string;
  period: string;
  hours: string;
  correlatives: string[];
  schedule: Record<string, string>;
  teacher: string;
  moodleUrl?: string;
  meetUrl?: string;
}

export const TSAS_PLAN: Subject[] = [
  { 
    year: '1°', code: '1.1.1', name: 'Técnicas de Programación', period: '1° Cuat.', hours: '9', 
    correlatives: [], 
    schedule: { 'Lunes': '18:00 a 22:10', 'Martes': '20:10 a 22:10' },
    teacher: 'Ignacio Bonini',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25892',
    meetUrl: 'https://meet.google.com/xhe-hpvw-vai'
  },
  { 
    year: '1°', code: '1.1.2', name: 'Elementos de Análisis Matemático', period: '1° Cuat.', hours: '6', 
    correlatives: [], 
    schedule: { 'Viernes': '18:00 a 22:10' },
    teacher: 'Fernando Pillon',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25893',
    meetUrl: 'https://meet.google.com/wwz-zjxb-mqk'
  },
  { 
    year: '1°', code: '1.1.3', name: 'Administración y Gestión de Bases de Datos', period: '1° Cuat.', hours: '9', 
    correlatives: [], 
    schedule: { 'Martes': '18:00 a 20:10', 'Miércoles': '18:00 a 22:10' },
    teacher: 'Patricia Lussiano',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25894',
    meetUrl: 'https://meet.google.com/yjg-ichs-rhi'
  },
  { 
    year: '1°', code: '1.1.4', name: 'Lógica Computacional', period: '1° Cuat.', hours: '6', 
    correlatives: [], 
    schedule: { 'Viernes': '18:00 a 22:10' },
    teacher: 'Ignacio Ziccardi',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25895',
    meetUrl: 'https://meet.google.com/oyh-bymu-hed'
  },
  { 
    year: '1°', code: '1.2.1', name: 'Desarrollo de Sistemas Orientado a Objetos', period: '2° Cuat.', hours: '6', 
    correlatives: ['1.1.1', '1.1.3', '1.1.4'], 
    schedule: { 'Miércoles': '18:00 a 22:10' },
    teacher: 'Pablo Vllariño',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25897',
    meetUrl: 'https://meet.google.com/igm-ojtt-eab'
  },
  { 
    year: '1°', code: '1.2.2', name: 'Estadística y Probabilidad para el Análisis de Sistemas', period: '2° Cuat.', hours: '5', 
    correlatives: [], 
    schedule: { 'Lunes': '18:00 a 21:30' },
    teacher: 'Yanina Reynoso',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25898',
    meetUrl: 'https://meet.google.com/ifb-wxsv-prm'
  },
  { 
    year: '1°', code: '1.2.3', name: 'Modelado y Diseño de Software', period: '2° Cuat.', hours: '6', 
    correlatives: ['1.1.1'], 
    schedule: { 'Viernes': '18:00 a 22:15' },
    teacher: 'Estela Escobar',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25899',
    meetUrl: 'https://meet.google.com/jmn-usgv-kxh'
  },
  { 
    year: '1°', code: '1.2.4', name: 'Inglés', period: '2° Cuat.', hours: '6', 
    correlatives: [], 
    schedule: { 'Martes': '18:00 a 22:15' },
    teacher: 'Carolina Celi',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25900',
    meetUrl: 'https://meet.google.com/epj-npmd-shr'
  },
  { 
    year: '1°', code: '1.2.5', name: 'PPI: Aproximación al campo laboral', period: '2° Cuat.', hours: '7', 
    correlatives: [], 
    schedule: { 'Jueves': '18:00 a 22:10' },
    teacher: 'Melina Tirado',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25896',
    meetUrl: 'https://meet.google.com/nps-fwhn-cik'
  },
  { 
    year: '2°', code: '2.1.1', name: 'Análisis de Sistemas', period: '1° Cuat.', hours: '6', 
    correlatives: [], 
    schedule: { 'Lunes': '18:00 a 22:10' },
    teacher: 'Alejandro Leon',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25901',
    meetUrl: 'https://meet.google.com/wbg-qmvg-ecw'
  },
  { 
    year: '2°', code: '2.1.2', name: 'Ingeniería de Software', period: '1° Cuat.', hours: '6', 
    correlatives: [], 
    schedule: { 'Jueves': '18:00 a 22:10' },
    teacher: 'Gabriel Conti',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25902',
    meetUrl: 'https://meet.google.com/mxm-kany-zej'
  },
  { 
    year: '2°', code: '2.1.3', name: 'Taller de Comunicación', period: '1° Cuat.', hours: '6', 
    correlatives: [], 
    schedule: { 'Viernes': '18:00 a 22:10' },
    teacher: 'Luis Blasco',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25903',
    meetUrl: 'https://meet.google.com/kqg-ukeo-sof'
  },
  { 
    year: '2°', code: '2.1.4', name: 'Diseño e Implementación de Pruebas de Software', period: '1° Cuat.', hours: '5', 
    correlatives: ['1.2.1'], 
    schedule: { 'Martes': '18:00 a 22:10' },
    teacher: 'Cristian Mendez',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25904',
    meetUrl: 'https://meet.google.com/hzk-ykfn-zwt'
  },
  { 
    year: '2°', code: '2.1.5', name: 'PPII: Relevamiento de requerimientos de usuario', period: '1° Cuat.', hours: '7', 
    correlatives: [], 
    schedule: { 'Miércoles': '18:00 a 22:10' },
    teacher: 'Maximiliano Marchetti',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25905',
    meetUrl: 'https://classroom.google.com/c/Nzk2NjQ2NzgzNDc5?cjc=3nempffp'
  },
  { 
    year: '2°', code: '2.2.1', name: 'Trabajo, Tecnología y Sociedad', period: '2° Cuat.', hours: '3', 
    correlatives: [], 
    schedule: { 'Jueves': '18:00 a 20:00' },
    teacher: 'Patricia Leptratti',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25906',
    meetUrl: 'https://meet.google.com/kwg-doow-ywe'
  },
  { 
    year: '2°', code: '2.2.2', name: 'Redes y Ciberseguridad', period: '2° Cuat.', hours: '9', 
    correlatives: [], 
    schedule: { 'Miércoles': '18:00 a 22:10', 'Jueves': '20:00 a 22:10' },
    teacher: 'Martin Santoro',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25907',
    meetUrl: 'https://meet.google.com/ryp-oyas-ybe'
  },
  { 
    year: '2°', code: '2.2.3', name: 'Gestión de Proyectos', period: '2° Cuat.', hours: '5', 
    correlatives: [], 
    schedule: { 'Martes': '18:00 a 21:20' },
    teacher: 'Maria Moutri',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25909',
    meetUrl: 'https://meet.google.com/doj-ikps-evh'
  },
  { 
    year: '2°', code: '2.2.4', name: 'Seminario de Actualización en Tecnología Web', period: '2° Cuat.', hours: '6', 
    correlatives: ['1.2.1'], 
    schedule: { 'Viernes': '18:00 a 22:10' },
    teacher: 'Silvina Filipi',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25908',
    meetUrl: 'https://meet.google.com/rxe-tyrk-dei'
  },
  { 
    year: '2°', code: '2.2.5', name: 'PPIII: Diseño y arquitectura de sistemas', period: '2° Cuat.', hours: '7', 
    correlatives: [], 
    schedule: { 'Lunes': '18:00 a 22:10', 'Martes': '21:20 a 22:10' },
    teacher: 'Patricia Litovicius',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25910',
    meetUrl: 'https://meet.google.com/grs-fgoz-ixh'
  },
  { 
    year: '3°', code: '3.1.1', name: 'Sistemas de Gestión', period: '1° Cuat.', hours: '5', 
    correlatives: ['1.1.3'], 
    schedule: { 'Viernes': '18:00 a 22:10' },
    teacher: 'Patricia Lussiano'
  },
  { 
    year: '3°', code: '3.1.2', name: 'Liderazgo y Gestión de Equipos', period: '1° Cuat.', hours: '6', 
    correlatives: ['2.1.1', '2.1.2'], 
    schedule: { 'Lunes': '18:00 a 22:10' },
    teacher: 'German ECKERDT'
  },
  { 
    year: '3°', code: '3.1.3', name: 'Aseguramiento de Calidad de los Sistemas', period: '1° Cuat.', hours: '3', 
    correlatives: ['2.1.4'], 
    schedule: { 'Miércoles': '18:00 a 20:10' },
    teacher: 'Carlos Arroyo Diaz',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=27085',
    meetUrl: 'https://meet.google.com/gqf-fgzu-gse'
  },
  { 
    year: '3°', code: '3.1.4', name: 'Arquitectura de Sistemas en la Nube', period: '1° Cuat.', hours: '6', 
    correlatives: ['2.2.2'], 
    schedule: { 'Jueves': '18:00 a 22:10' },
    teacher: 'Lucas Rusatti',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=27086',
    meetUrl: 'https://meet.google.com/ftc-jopb-bif'
  },
  { 
    year: '3°', code: '3.1.5', name: 'PPIV: Proyecto integrador', period: '1° Cuat.', hours: '9', 
    correlatives: ['2.1.5', '2.2.5'], 
    schedule: { 'Martes': '18:00 a 22:10', 'Miércoles': '20:20 a 22:10' },
    teacher: 'Javier Farioli',
    moodleUrl: 'https://aulasvirtuales.bue.edu.ar/course/view.php?id=25911',
    meetUrl: 'https://meet.google.com/ndi-zisg-ekk'
  },
];
