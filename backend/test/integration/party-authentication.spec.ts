import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/bootstrap/configure-app.js';
import { validateEnv, type AppConfig } from '../../src/config/env.validation.js';
import { hashPassword } from '../../src/infrastructure/security/password-hash.js';

const EMAIL = 'demo@kynwallet.test';
const PASSWORD = 'contraseña-de-prueba-15';
const JWT_SECRET = 'x'.repeat(40);

async function buildConfig(): Promise<AppConfig> {
  const demoAccounts = JSON.stringify([
    { email: EMAIL, displayName: 'Titular Demo', passwordHash: await hashPassword(PASSWORD) },
  ]);
  return validateEnv({
    JWT_SECRET,
    DEMO_ACCOUNTS: demoAccounts,
    SIMULATED_LATENCY_MS: '0',
  });
}

describe('API de autenticación (integración)', () => {
  let app: INestApplication;
  let config: AppConfig;

  beforeEach(async () => {
    config = await buildConfig();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(config)],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const sessions = '/api/v1/party-authentication/sessions';

  describe('POST /sessions', () => {
    it('devuelve 201 con token Bearer y nombre visible, sin correo ni contraseña', async () => {
      const response = await request(app.getHttpServer())
        .post(sessions)
        .send({ email: EMAIL, password: PASSWORD })
        .expect(201);

      expect(response.body).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: 900,
        party: { displayName: 'Titular Demo' },
      });
      expect(typeof response.body.accessToken).toBe('string');
      expect(JSON.stringify(response.body)).not.toContain(EMAIL);
    });

    it('normaliza el correo antes de buscarlo', async () => {
      await request(app.getHttpServer())
        .post(sessions)
        .send({ email: '  DEMO@kynwallet.test ', password: PASSWORD })
        .expect(201);
    });

    it('responde 401 con el mismo problema si la contraseña es incorrecta', async () => {
      const response = await request(app.getHttpServer())
        .post(sessions)
        .send({ email: EMAIL, password: 'contraseña-incorrecta-15' })
        .expect(401)
        .expect('Content-Type', /application\/problem\+json/);

      expect(response.body).toMatchObject({ status: 401, code: 'invalid-credentials' });
    });

    it('responde exactamente igual si el correo no existe (C1)', async () => {
      const wrongPassword = await request(app.getHttpServer())
        .post(sessions)
        .send({ email: EMAIL, password: 'contraseña-incorrecta-15' });
      const unknownEmail = await request(app.getHttpServer())
        .post(sessions)
        .send({ email: 'nadie@kynwallet.test', password: 'contraseña-incorrecta-15' });

      expect(unknownEmail.status).toBe(401);
      expect(unknownEmail.body).toEqual(wrongPassword.body);
    });

    it('responde 400 indicando solo el campo inválido, sin trazas', async () => {
      const response = await request(app.getHttpServer())
        .post(sessions)
        .send({ email: EMAIL, password: 'corta' })
        .expect(400)
        .expect('Content-Type', /application\/problem\+json/);

      expect(response.body).toMatchObject({ code: 'validation-failed', fields: ['password'] });
      expect(JSON.stringify(response.body)).not.toMatch(/at |stack/);
    });

    it('rechaza propiedades no permitidas (whitelist)', async () => {
      await request(app.getHttpServer())
        .post(sessions)
        .send({ email: EMAIL, password: PASSWORD, role: 'admin' })
        .expect(400);
    });

    it('aplica cabeceras de seguridad de helmet', async () => {
      const response = await request(app.getHttpServer())
        .post(sessions)
        .send({ email: EMAIL, password: PASSWORD });
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('responde 429 con Retry-After tras superar el límite', async () => {
      for (let i = 0; i < 5; i += 1) {
        await request(app.getHttpServer()).post(sessions).send({ email: EMAIL, password: 'contraseña-incorrecta-15' });
      }
      const response = await request(app.getHttpServer())
        .post(sessions)
        .send({ email: EMAIL, password: PASSWORD })
        .expect(429)
        .expect('Retry-After', '60');

      expect(response.body).toMatchObject({ code: 'rate-limited' });
    });
  });

  describe('GET /sessions/current', () => {
    it('responde 401 con WWW-Authenticate sin token', async () => {
      const response = await request(app.getHttpServer())
        .get(`${sessions}/current`)
        .expect(401);

      expect(response.headers['www-authenticate']).toBe('Bearer');
      expect(response.body).toMatchObject({ code: 'unauthenticated' });
    });

    it('devuelve el titular con un token válido', async () => {
      const login = await request(app.getHttpServer())
        .post(sessions)
        .send({ email: EMAIL, password: PASSWORD });

      const response = await request(app.getHttpServer())
        .get(`${sessions}/current`)
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({ party: { displayName: 'Titular Demo' } });
    });

    it('rechaza un token firmado con otro secreto', async () => {
      const forged = await new JwtService({ secret: 'y'.repeat(40) }).signAsync(
        { name: 'Falso' },
        { subject: 'x', issuer: config.jwtIssuer, audience: config.jwtAudience, algorithm: 'HS256' },
      );
      await request(app.getHttpServer())
        .get(`${sessions}/current`)
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });

    it('rechaza un token con audiencia distinta', async () => {
      const wrongAudience = await new JwtService({ secret: JWT_SECRET }).signAsync(
        { name: 'Titular' },
        { subject: 'x', issuer: config.jwtIssuer, audience: 'otra-app', algorithm: 'HS256' },
      );
      await request(app.getHttpServer())
        .get(`${sessions}/current`)
        .set('Authorization', `Bearer ${wrongAudience}`)
        .expect(401);
    });
  });
});
