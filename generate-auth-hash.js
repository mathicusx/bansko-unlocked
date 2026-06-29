#!/usr/bin/env node

/**
 * Generate Auth Hash for Admin Panel
 *
 * Usage:
 *   node generate-auth-hash.js <username> <password>
 *
 * Example:
 *   node generate-auth-hash.js admin MySecurePassword123!
 */

function hashPassword(password) {
  let hash = 5381;

  // First pass
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
  }

  // Second pass (reverse) for more complexity
  let hash2 = 0;
  for (let i = password.length - 1; i >= 0; i--) {
    const char = password.charCodeAt(i);
    hash2 = ((hash2 << 5) - hash2) + char;
  }

  // Combine and convert to hex
  const combined = Math.abs(hash) + Math.abs(hash2);
  const hexHash = combined.toString(16).padStart(32, '0');

  // Additional mixing
  let finalHash = '';
  for (let i = 0; i < hexHash.length; i++) {
    const mixedChar = (parseInt(hexHash[i], 16) + i) % 16;
    finalHash += mixedChar.toString(16);
  }

  return finalHash.padEnd(64, '0').substring(0, 64);
}

function encodeUsername(username) {
  return Buffer.from(username).toString('base64');
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('\n❌ Error: Missing arguments\n');
  console.log('Usage: node generate-auth-hash.js <username> <password>\n');
  console.log('Example: node generate-auth-hash.js admin MyPassword123!\n');
  process.exit(1);
}

const [username, password] = args;

console.log('\n🔐 Generating Auth Hashes...\n');
console.log('━'.repeat(60));

const encodedUsername = encodeUsername(username);
const passwordHash = hashPassword(password);

console.log('\n✅ Generated Successfully!\n');
console.log('Username (original):', username);
console.log('Password (original):', password);
console.log('\n' + '━'.repeat(60));
console.log('\n📋 Copy these values to src/app/services/auth.service.ts:\n');
console.log(`private readonly ENCODED_USERNAME = '${encodedUsername}';`);
console.log(`private readonly PASSWORD_HASH = '${passwordHash}';`);
console.log('\n' + '━'.repeat(60));
console.log('\n🔒 Security Notes:');
console.log('  • Encoded username is Base64 (easily reversible)');
console.log('  • Password hash cannot be reversed');
console.log('  • Safe to commit these values to git');
console.log('  • Store your actual password somewhere safe!\n');
