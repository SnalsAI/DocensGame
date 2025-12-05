import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('EDU-ATELIER API')
    .setDescription(`
## EDU-ATELIER - Piattaforma EdTech per la Scuola Italiana

API REST per la gestione di:
- **Contenuti educativi** con AI generativa
- **Video lezioni** con avatar parlanti
- **Quiz e giochi** multiplayer
- **Supporto DSA/BES/L2** con accessibilità avanzata

### Autenticazione
Tutte le API richiedono autenticazione JWT tramite Keycloak.
Includi l'header \`Authorization: Bearer <token>\` in ogni richiesta.

### Rate Limiting
- API pubbliche: 100 req/min
- API autenticate: 300 req/min
- WebSocket: illimitato

### Errori comuni
- \`401\` - Token mancante o non valido
- \`403\` - Permessi insufficienti
- \`404\` - Risorsa non trovata
- \`429\` - Rate limit superato
    `)
    .setVersion('1.0.0')
    .setContact('EDU-ATELIER Team', 'https://edu-atelier.it', 'support@edu-atelier.it')
    .setLicense('AGPL-3.0', 'https://www.gnu.org/licenses/agpl-3.0.html')
    .addServer('http://localhost:3001', 'Development')
    .addServer('https://api.edu-atelier.example.com', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token from Keycloak',
      },
      'JWT-auth',
    )
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication & authorization')
    .addTag('users', 'User management & profiles')
    .addTag('classrooms', 'Classroom management')
    .addTag('content', 'Content management & AI generation')
    .addTag('lessons', 'Video lessons with H5P')
    .addTag('quizzes', 'Quiz & exercises')
    .addTag('games', 'Multiplayer game sessions')
    .addTag('gamification', 'XP, badges & leaderboards')
    .addTag('accessibility', 'DSA/BES/L2 support')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 EDU-ATELIER Backend running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
