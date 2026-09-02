import http from 'k6/http';
import { check } from 'k6';

// Test de charge de référence sur l'endpoint le plus léger (/api/ping).
// Sert d'étalon (surcoût framework à vide). Les tests réels visent
// POST /api/files et GET /api/d/{token} — voir PERF.md.
//
//   k6 run k6/ping-smoke.js
//   k6 run -e BASE_URL=http://localhost:8080 k6/ping-smoke.js

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '5s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/ping`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is {"status":"ok"}': (r) => r.json('status') === 'ok',
  });
}
