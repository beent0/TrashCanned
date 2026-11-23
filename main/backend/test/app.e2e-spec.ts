import { Test } from '@nestjs/testing';
import { INestApplication, Type } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CoreModule } from '../src/core/core.module';
import { ExperienceModule } from '../src/experience/experience.module';
import { MonitorizacaoModule } from '../src/monitorizacao/monitorizacao.module';

describe.each<[string, Type]>([
  ['core', CoreModule],
  ['experience', ExperienceModule],
  ['monitorizacao', MonitorizacaoModule],
])('%s (e2e)', (_name, root) => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [root],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('GET /api/v1/health', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => expect(res.body).toMatchObject({ status: 'ok' }));
  });

  afterEach(async () => {
    await app.close();
  });
});
