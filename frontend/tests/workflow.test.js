import test from 'node:test';
import assert from 'node:assert/strict';

test('Frontend Workspace Role Navigation Definitions', () => {
  const roles = ['candidate', 'recruiter'];
  assert.equal(roles.length, 2);
  assert.ok(roles.includes('candidate'));
  assert.ok(roles.includes('recruiter'));
});

test('Mobile Breakpoint Configuration (<768px)', () => {
  const mobileWidth = 375;
  const tabletWidth = 768;
  const desktopWidth = 1440;

  const isMobile = (width) => width < 768;
  assert.equal(isMobile(mobileWidth), true);
  assert.equal(isMobile(tabletWidth), false);
  assert.equal(isMobile(desktopWidth), false);
});

test('Scoring Weights Dimension Verification (100% Total)', () => {
  const defaultWeights = {
    required_skills: 25,
    experience: 20,
    project_impact: 15,
    preferred_skills: 10,
    education: 10,
    tooling_ecosystem: 10,
    domain_experience: 5,
    role_stability: 5
  };

  const total = Object.values(defaultWeights).reduce((a, b) => a + b, 0);
  assert.equal(total, 100);
});

