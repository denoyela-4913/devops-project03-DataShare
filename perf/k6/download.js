import http from 'k6/http';
import { check } from 'k6';

// Test de charge de l'endpoint le plus sollicité GET/POST /api/d/{token} (US02) :
// chaque destinataire d'un lien de partage tape dessus. Contrairement à upload.js,
// ce script est auto-suffisant : setup() crée un utilisateur jetable et upload un
// fichier une seule fois (hors mesure de charge), puis toutes les VUs téléchargent
// ce même lien en concurrence — reproduit le cas réel d'un lien partagé à plusieurs
// destinataires. Pas de variante mot de passe (hors scope).
//
//   k6 run -e BASE_URL=http://localhost:8080 -e SIZE_MB=1 k6/download.js
//  ou avec docker :
//   docker run --rm -i grafana/k6 run -e BASE_URL=http://host.docker.internal:8080 - < k6/download.js

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
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
    http_req_duration: ['p(95)<1500'],
  },
};

export function setup() {
  const email = `k6-download-${Date.now()}@example.com`;
  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ email, password: 'password123' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (registerRes.status !== 201) {
    throw new Error(`setup: register failed (${registerRes.status}): ${registerRes.body}`);
  }
  const accessToken = registerRes.json('accessToken');

  const payload = new Uint8Array(SIZE_MB * 1024 * 1024).buffer;
  const uploadRes = http.post(
    `${BASE_URL}/api/files`,
    {
      file: http.file(payload, `bench-${SIZE_MB}mb.bin`, 'application/octet-stream'),
      expirationDays: '7',
    },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (uploadRes.status !== 201) {
    throw new Error(`setup: upload failed (${uploadRes.status}): ${uploadRes.body}`);
  }

  return { token: uploadRes.json('token') };
}

export default function (data) {
  const metaRes = http.get(`${BASE_URL}/api/d/${data.token}`);
  check(metaRes, {
    'metadata status is 200': (r) => r.status === 200,
    'metadata is not password protected': (r) => r.json('passwordProtected') === false,
  });

  const downloadRes = http.post(`${BASE_URL}/api/d/${data.token}`, JSON.stringify({}), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(downloadRes, {
    'download status is 200': (r) => r.status === 200,
    'download has content-disposition': (r) => !!r.headers['Content-Disposition'],
  });
}
