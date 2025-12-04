import { PrismaClient, UserRole, ContentType, ContentStatus, GameType, QuizType, SummaryType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@edu-atelier.it' },
    update: {},
    create: {
      keycloakId: 'admin-keycloak-id',
      email: 'admin@edu-atelier.it',
      firstName: 'Admin',
      lastName: 'Sistema',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  // Create Teacher User
  const teacherUser = await prisma.user.upsert({
    where: { email: 'docente@scuola.it' },
    update: {},
    create: {
      keycloakId: 'teacher-keycloak-id',
      email: 'docente@scuola.it',
      firstName: 'Mario',
      lastName: 'Rossi',
      role: UserRole.TEACHER,
      teacherProfile: {
        create: {
          schoolName: 'Liceo Scientifico Galilei',
          subjects: ['Italiano', 'Storia'],
          bio: 'Docente con 15 anni di esperienza nella didattica digitale.',
          yearsOfExp: 15,
        },
      },
    },
  });
  console.log('✅ Created teacher user:', teacherUser.email);

  // Create Student Users
  const student1 = await prisma.user.upsert({
    where: { email: 'studente@scuola.it' },
    update: {},
    create: {
      keycloakId: 'student1-keycloak-id',
      email: 'studente@scuola.it',
      firstName: 'Giulia',
      lastName: 'Bianchi',
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          isDsa: false,
          isBes: false,
          isL2: false,
          audioEnabled: true,
        },
      },
    },
  });
  console.log('✅ Created student user:', student1.email);

  const studentDsa = await prisma.user.upsert({
    where: { email: 'studente.dsa@scuola.it' },
    update: {},
    create: {
      keycloakId: 'student-dsa-keycloak-id',
      email: 'studente.dsa@scuola.it',
      firstName: 'Marco',
      lastName: 'Verdi',
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          isDsa: true,
          dsaType: 'dislessia',
          isBes: false,
          isL2: false,
          preferredFontSize: 'large',
          highContrast: false,
          audioEnabled: true,
          extraTime: 50,
        },
      },
    },
  });
  console.log('✅ Created DSA student user:', studentDsa.email);

  const studentL2 = await prisma.user.upsert({
    where: { email: 'studente.l2@scuola.it' },
    update: {},
    create: {
      keycloakId: 'student-l2-keycloak-id',
      email: 'studente.l2@scuola.it',
      firstName: 'Ana',
      lastName: 'Popescu',
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          isDsa: false,
          isBes: false,
          isL2: true,
          l2Level: 'B1',
          audioEnabled: true,
          extraTime: 30,
        },
      },
    },
  });
  console.log('✅ Created L2 student user:', studentL2.email);

  // Create Classroom
  const classroom = await prisma.classroom.upsert({
    where: { code: 'DEMO2024' },
    update: {},
    create: {
      name: 'Classe 3A - Italiano',
      description: 'Classe demo per test della piattaforma',
      code: 'DEMO2024',
      teacherId: teacherUser.id,
      schoolYear: '2024/2025',
      subject: 'Italiano',
    },
  });
  console.log('✅ Created classroom:', classroom.name);

  // Enroll students
  await prisma.classroomStudent.upsert({
    where: {
      classroomId_studentId: {
        classroomId: classroom.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      classroomId: classroom.id,
      studentId: student1.id,
    },
  });

  await prisma.classroomStudent.upsert({
    where: {
      classroomId_studentId: {
        classroomId: classroom.id,
        studentId: studentDsa.id,
      },
    },
    update: {},
    create: {
      classroomId: classroom.id,
      studentId: studentDsa.id,
    },
  });

  await prisma.classroomStudent.upsert({
    where: {
      classroomId_studentId: {
        classroomId: classroom.id,
        studentId: studentL2.id,
      },
    },
    update: {},
    create: {
      classroomId: classroom.id,
      studentId: studentL2.id,
    },
  });
  console.log('✅ Enrolled students in classroom');

  // Create sample content
  const content = await prisma.content.create({
    data: {
      title: 'La Rivoluzione Francese',
      description: 'Introduzione alla Rivoluzione Francese: cause, eventi principali e conseguenze',
      type: ContentType.TEXT,
      classroomId: classroom.id,
      authorId: teacherUser.id,
      rawContent: `La Rivoluzione Francese fu un periodo di radicale sconvolgimento politico e sociale in Francia che ebbe inizio nel 1789 e si concluse nel 1799.

Le cause principali furono:
- La crisi finanziaria dello Stato francese
- Le disuguaglianze sociali tra i tre stati (clero, nobiltà, terzo stato)
- L'influenza delle idee illuministe
- La fame e la povertà diffuse tra il popolo

Eventi principali:
1. 14 luglio 1789: Presa della Bastiglia
2. 26 agosto 1789: Dichiarazione dei diritti dell'uomo e del cittadino
3. 1792: Proclamazione della Repubblica
4. 1793-1794: Il Terrore sotto Robespierre
5. 1799: Colpo di stato di Napoleone Bonaparte

Conseguenze:
La Rivoluzione Francese portò alla fine della monarchia assoluta, alla nascita dei concetti moderni di cittadinanza e diritti umani, e influenzò profondamente tutta l'Europa.`,
      status: ContentStatus.READY,
      parsedData: {
        concepts: ['Rivoluzione', 'Francia', 'Monarchia', 'Repubblica', 'Diritti'],
        keyPoints: [
          'Inizio nel 1789',
          'Presa della Bastiglia',
          'Dichiarazione dei diritti',
          'Il Terrore',
          'Fine monarchia assoluta',
        ],
        entities: {
          persone: ['Robespierre', 'Napoleone Bonaparte'],
          luoghi: ['Francia', 'Bastiglia', 'Europa'],
          date: ['1789', '1792', '1793', '1794', '1799'],
        },
      },
    },
  });
  console.log('✅ Created sample content:', content.title);

  // Create summary
  await prisma.summary.create({
    data: {
      contentId: content.id,
      type: SummaryType.BRIEF,
      text: 'La Rivoluzione Francese (1789-1799) fu un periodo di cambiamento radicale che portò alla fine della monarchia assoluta e alla nascita della Repubblica.',
    },
  });

  await prisma.summary.create({
    data: {
      contentId: content.id,
      type: SummaryType.DSA_ADAPTED,
      text: 'La Rivoluzione Francese iniziò nel 1789.\n\nIl popolo era arrabbiato perché:\n- Non aveva da mangiare\n- Pagava troppe tasse\n- Il re aveva troppo potere\n\nEvento importante: il 14 luglio 1789 il popolo prese la Bastiglia (una prigione).\n\nRisultato: la Francia divenne una Repubblica.',
      level: 'dsa',
    },
  });
  console.log('✅ Created summaries');

  // Create quiz
  const quiz = await prisma.quiz.create({
    data: {
      contentId: content.id,
      title: 'Quiz: La Rivoluzione Francese',
      type: QuizType.MULTIPLE_CHOICE,
      questions: [
        {
          id: 'q1',
          question: 'In quale anno iniziò la Rivoluzione Francese?',
          type: 'multiple_choice',
          options: ['1776', '1789', '1799', '1804'],
          correctAnswer: '1789',
          explanation: 'La Rivoluzione Francese ebbe inizio nel 1789 con la convocazione degli Stati Generali.',
        },
        {
          id: 'q2',
          question: 'Quale evento è considerato il simbolo dell\'inizio della Rivoluzione?',
          type: 'multiple_choice',
          options: ['La fuga del re', 'La Presa della Bastiglia', 'La morte di Luigi XVI', 'Il colpo di stato di Napoleone'],
          correctAnswer: 'La Presa della Bastiglia',
          explanation: 'La Presa della Bastiglia il 14 luglio 1789 è considerata il simbolo dell\'inizio della Rivoluzione.',
        },
        {
          id: 'q3',
          question: 'Chi fu il leader durante il periodo del Terrore?',
          type: 'multiple_choice',
          options: ['Napoleone', 'Luigi XVI', 'Robespierre', 'Voltaire'],
          correctAnswer: 'Robespierre',
          explanation: 'Maximilien Robespierre fu il principale leader durante il periodo del Terrore (1793-1794).',
        },
        {
          id: 'q4',
          question: 'La Dichiarazione dei diritti dell\'uomo fu proclamata nel 1789.',
          type: 'true_false',
          options: ['Vero', 'Falso'],
          correctAnswer: 'Vero',
          explanation: 'La Dichiarazione dei diritti dell\'uomo e del cittadino fu adottata il 26 agosto 1789.',
        },
        {
          id: 'q5',
          question: 'Chi pose fine alla Rivoluzione con un colpo di stato nel 1799?',
          type: 'multiple_choice',
          options: ['Robespierre', 'Luigi XVIII', 'Napoleone Bonaparte', 'Marat'],
          correctAnswer: 'Napoleone Bonaparte',
          explanation: 'Napoleone Bonaparte pose fine alla Rivoluzione con il colpo di stato del 18 brumaio (9 novembre 1799).',
        },
      ],
      settings: {
        timeLimit: 300,
        shuffleQuestions: true,
        showFeedback: true,
      },
    },
  });
  console.log('✅ Created quiz:', quiz.title);

  // Create concept map
  await prisma.conceptMap.create({
    data: {
      contentId: content.id,
      title: 'Mappa: La Rivoluzione Francese',
      nodes: [
        { id: 'main', label: 'Rivoluzione Francese', type: 'main', x: 400, y: 50 },
        { id: 'cause', label: 'Cause', type: 'category', x: 200, y: 150 },
        { id: 'eventi', label: 'Eventi', type: 'category', x: 400, y: 150 },
        { id: 'conseguenze', label: 'Conseguenze', type: 'category', x: 600, y: 150 },
        { id: 'crisi', label: 'Crisi finanziaria', type: 'concept', x: 100, y: 250 },
        { id: 'disuguaglianze', label: 'Disuguaglianze sociali', type: 'concept', x: 200, y: 250 },
        { id: 'illuminismo', label: 'Illuminismo', type: 'concept', x: 300, y: 250 },
        { id: 'bastiglia', label: 'Presa Bastiglia', type: 'concept', x: 350, y: 250 },
        { id: 'terrore', label: 'Il Terrore', type: 'concept', x: 450, y: 250 },
        { id: 'repubblica', label: 'Repubblica', type: 'concept', x: 550, y: 250 },
        { id: 'diritti', label: 'Diritti umani', type: 'concept', x: 650, y: 250 },
      ],
      edges: [
        { source: 'main', target: 'cause', label: 'ha' },
        { source: 'main', target: 'eventi', label: 'comprende' },
        { source: 'main', target: 'conseguenze', label: 'porta a' },
        { source: 'cause', target: 'crisi', label: '' },
        { source: 'cause', target: 'disuguaglianze', label: '' },
        { source: 'cause', target: 'illuminismo', label: '' },
        { source: 'eventi', target: 'bastiglia', label: '' },
        { source: 'eventi', target: 'terrore', label: '' },
        { source: 'conseguenze', target: 'repubblica', label: '' },
        { source: 'conseguenze', target: 'diritti', label: '' },
      ],
    },
  });
  console.log('✅ Created concept map');

  // Create badges
  const badges = [
    {
      name: 'Primo Quiz',
      description: 'Hai completato il tuo primo quiz!',
      iconUrl: '/badges/first-quiz.png',
      criteria: { type: 'quiz_completed', count: 1 },
      xpValue: 10,
    },
    {
      name: 'Studente Modello',
      description: 'Hai completato 10 quiz con almeno 80% di risposte corrette',
      iconUrl: '/badges/model-student.png',
      criteria: { type: 'quiz_score', minScore: 80, count: 10 },
      xpValue: 50,
    },
    {
      name: 'Campione',
      description: 'Hai vinto la tua prima partita multiplayer!',
      iconUrl: '/badges/champion.png',
      criteria: { type: 'game_win', count: 1 },
      xpValue: 25,
    },
    {
      name: 'Maratoneta',
      description: 'Hai guardato 10 video-lezioni complete',
      iconUrl: '/badges/marathon.png',
      criteria: { type: 'lessons_completed', count: 10 },
      xpValue: 30,
    },
    {
      name: 'Collaboratore',
      description: 'Hai partecipato a 5 giochi cooperativi',
      iconUrl: '/badges/collaborator.png',
      criteria: { type: 'coop_games', count: 5 },
      xpValue: 20,
    },
    {
      name: 'Esploratore',
      description: 'Hai esplorato 5 mappe concettuali',
      iconUrl: '/badges/explorer.png',
      criteria: { type: 'maps_viewed', count: 5 },
      xpValue: 15,
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }
  console.log('✅ Created badges');

  // Create avatars
  const avatars = [
    {
      name: 'Avatar Default',
      imageUrl: '/avatars/default.png',
      voiceId: 'default',
      isDefault: true,
    },
    {
      name: 'Professore',
      imageUrl: '/avatars/teacher-male-1.png',
      voiceId: 'male-1',
      isDefault: false,
    },
    {
      name: 'Professoressa',
      imageUrl: '/avatars/teacher-female-1.png',
      voiceId: 'female-1',
      isDefault: false,
    },
    {
      name: 'Tutor Animato',
      imageUrl: '/avatars/animated-1.png',
      voiceId: 'default',
      isDefault: false,
    },
  ];

  for (const avatar of avatars) {
    await prisma.avatar.create({
      data: avatar,
    });
  }
  console.log('✅ Created avatars');

  // Give some XP to students
  await prisma.xPReward.create({
    data: {
      userId: student1.id,
      amount: 50,
      source: 'DAILY_LOGIN',
    },
  });

  await prisma.xPReward.create({
    data: {
      userId: studentDsa.id,
      amount: 30,
      source: 'LESSON_COMPLETED',
      sourceId: content.id,
    },
  });
  console.log('✅ Created initial XP rewards');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Admin: admin@edu-atelier.it / admin123');
  console.log('   Teacher: docente@scuola.it / docente123');
  console.log('   Student: studente@scuola.it / studente123');
  console.log('   Classroom Code: DEMO2024');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
