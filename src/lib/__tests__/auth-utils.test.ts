import { signToken, verifyToken } from '../auth-utils';
import { strict as assert } from 'assert';

console.log('Running auth-utils tests...');

// Test 1: Sign and verify a valid token
const userId = 'user-123';
const token = signToken(userId);
console.log('Signed token:', token);
assert.ok(token.includes('.'), 'Token should contain a dot');
const verifiedId = verifyToken(token);
assert.equal(verifiedId, userId, 'Verified ID should match original ID');
console.log('Test 1 Passed: Sign and verify');

// Test 2: Tampered token (modify signature)
const tamperedToken = token.slice(0, -1) + 'X';
const verifiedTampered = verifyToken(tamperedToken);
assert.equal(verifiedTampered, null, 'Tampered token should return null');
console.log('Test 2 Passed: Tampered signature');

// Test 3: Tampered payload
const parts = token.split('.');
const signature = parts[1];
// Create a fake payload that is valid base64url but different content
const tamperedPayload = Buffer.from('user-999').toString('base64url');
const tamperedToken2 = `${tamperedPayload}.${signature}`;
const verifiedTampered2 = verifyToken(tamperedToken2);
assert.equal(verifiedTampered2, null, 'Tampered payload should return null');
console.log('Test 3 Passed: Tampered payload');

// Test 4: Malformed token
assert.equal(verifyToken('invalidtoken'), null);
assert.equal(verifyToken(''), null);
// @ts-expect-error Testing invalid type
assert.equal(verifyToken(null), null);
console.log('Test 4 Passed: Malformed token');

// Test 5: Special characters in payload
const specialId = 'user-@#$%^&*()';
const specialToken = signToken(specialId);
assert.equal(verifyToken(specialToken), specialId);
console.log('Test 5 Passed: Special characters');

console.log('All tests passed!');
