import test from 'node:test';
import assert from 'node:assert/strict';
import { getApiBaseUrl } from '../src/utils/api.js';

test('uses configured VITE_API_URL when present', () => {
  const base = getApiBaseUrl({ VITE_API_URL: 'https://api.example.com' }, { location: { origin: 'https://app.example.com', hostname: 'app.example.com' } });
  assert.equal(base, 'https://api.example.com');
});

test('uses localhost backend for local development', () => {
  const base = getApiBaseUrl({}, { location: { origin: 'http://localhost:3000', hostname: 'localhost' } });
  assert.equal(base, 'http://localhost:8000');
});

test('uses production Render backend when deployed and no API URL is configured', () => {
  const base = getApiBaseUrl({}, { location: { origin: 'https://ai-carrer-inteligence.vercel.app', hostname: 'ai-carrer-inteligence.vercel.app' } });
  assert.equal(base, 'https://ai-carrer-inteligence-1.onrender.com');
});
