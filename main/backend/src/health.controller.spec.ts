import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok with the running service', () => {
    process.env.SERVICE = 'monitorizacao';
    expect(new HealthController().check()).toEqual({
      status: 'ok',
      service: 'monitorizacao',
    });
  });
});
