import http from 'k6/http';
import { check } from 'k6';

// Test de charge de l'endpoint critique POST /api/files (US01).
// Nécessite un access token valide (obtenu hors k6) :
//
//   TOKEN=$(curl -s -XPOST localhost:8080/api/auth/register \
//     -H 'Content-Type: application/json' \
//     -d '{"email":"k6@example.com","password":"password123"}' | jq -r .accessToken)
//   k6 run -e BASE_URL=http://localhost:8080 -e TOKEN="$TOKEN" -e SIZE_MB=1 k6/upload.js

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TOKEN = __ENV.TOKEN;
const SIZE_MB = Number(__ENV.SIZE_MB || 1);

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '30s', target: 5 },
        { duration: '5s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<3000'],
  },
};

const payload = new Uint8Array(SIZE_MB * 1024 * 1024).buffer;

export default function () {
  const res = http.post(
    `${BASE_URL}/api/files`,
    {
      file: http.file(payload, `bench-${SIZE_MB}mb.bin`, 'application/octet-stream'),
      expirationDays: '7',
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } },
  );
  check(res, {
    'status is 201': (r) => r.status === 201,
    'body has a token': (r) => !!r.json('token'),
  });
}
