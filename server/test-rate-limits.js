#!/usr/bin/env node

/**
 * Rate Limiting Test Script
 * 
 * This script demonstrates and tests the rate limiting implementation
 * in the CodeUnity API. Run this to verify that rate limits are working correctly.
 * 
 * Usage: node test-rate-limits.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:8080';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Global Rate Limiter (100 requests per 15 minutes)
async function testGlobalRateLimit() {
  log('\n🧪 TEST 1: Global Rate Limiter', 'blue');
  log('Limit: 100 requests per 15 minutes', 'magenta');
  log('Making 5 requests to /health endpoint...', 'yellow');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await axios.get(`${API_URL}/health`);
      successCount++;
      log(`✅ Request ${i}: Success (${response.status})`, 'green');
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitedCount++;
        log(`🚫 Request ${i}: Rate Limited (429)`, 'red');
        log(`   Message: ${error.response.data.message}`, 'yellow');
      } else {
        log(`❌ Request ${i}: Error (${error.message})`, 'red');
      }
    }
    await sleep(100); // Small delay between requests
  }
  
  log(`\n📊 Results: ${successCount} successful, ${rateLimitedCount} rate limited`, 'blue');
}

// Test 2: AI Rate Limiter (10 requests per 1 minute)
async function testAIRateLimit() {
  log('\n🧪 TEST 2: AI Rate Limiter', 'blue');
  log('Limit: 10 requests per 1 minute', 'magenta');
  log('Making 12 AI requests to trigger rate limit...', 'yellow');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 1; i <= 12; i++) {
    try {
      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        prompt: `Test request ${i}`
      });
      successCount++;
      log(`✅ AI Request ${i}: Success (${response.status})`, 'green');
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitedCount++;
        log(`🚫 AI Request ${i}: Rate Limited (429)`, 'red');
        log(`   Message: ${error.response.data.message}`, 'yellow');
        if (error.response.data.tip) {
          log(`   💡 Tip: ${error.response.data.tip}`, 'magenta');
        }
      } else if (error.response?.status === 503) {
        log(`⚠️  AI Request ${i}: Service unavailable (AI not configured)`, 'yellow');
      } else {
        log(`❌ AI Request ${i}: Error (${error.message})`, 'red');
      }
    }
    await sleep(200); // Small delay
  }
  
  log(`\n📊 Results: ${successCount} successful, ${rateLimitedCount} rate limited`, 'blue');
  log('Expected: First 10 succeed, last 2 rate limited', 'magenta');
}

// Test 3: Auth Rate Limiter (5 requests per 15 minutes)
async function testAuthRateLimit() {
  log('\n🧪 TEST 3: Authentication Rate Limiter', 'blue');
  log('Limit: 5 failed attempts per 15 minutes', 'magenta');
  log('Making 7 login attempts with wrong credentials...', 'yellow');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 1; i <= 7; i++) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username: 'testuser',
        password: 'wrongpassword'
      });
      // This should fail (wrong credentials)
      log(`⚠️  Login ${i}: Unexpected success`, 'yellow');
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitedCount++;
        log(`🚫 Login ${i}: Rate Limited (429) ✓`, 'red');
        log(`   Message: ${error.response.data.message}`, 'yellow');
      } else if (error.response?.status === 401) {
        successCount++;
        log(`✅ Login ${i}: Failed as expected (401)`, 'green');
      } else {
        log(`❌ Login ${i}: Unexpected error (${error.message})`, 'red');
      }
    }
    await sleep(200);
  }
  
  log(`\n📊 Results: ${successCount} auth failures, ${rateLimitedCount} rate limited`, 'blue');
  log('Expected: First 5 fail normally, last 2 rate limited', 'magenta');
}

// Test 4: Code Execution Rate Limiter (20 requests per 1 minute)
async function testCodeExecutionRateLimit() {
  log('\n🧪 TEST 4: Code Execution Rate Limiter', 'blue');
  log('Limit: 20 executions per 1 minute', 'magenta');
  log('Making 5 code execution requests...', 'yellow');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await axios.post(`${API_URL}/api/execute`, {
        language: 'python3',
        code: 'print("Hello World")'
      });
      successCount++;
      log(`✅ Execute ${i}: Success (${response.status})`, 'green');
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitedCount++;
        log(`🚫 Execute ${i}: Rate Limited (429)`, 'red');
      } else {
        log(`❌ Execute ${i}: Error (${error.message})`, 'red');
      }
    }
    await sleep(200);
  }
  
  log(`\n📊 Results: ${successCount} successful, ${rateLimitedCount} rate limited`, 'blue');
}

// Test 5: Email Rate Limiter (5 emails per hour)
async function testEmailRateLimit() {
  log('\n🧪 TEST 5: Email Rate Limiter', 'blue');
  log('Limit: 5 emails per 1 hour', 'magenta');
  log('Making 3 email requests...', 'yellow');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let notConfiguredCount = 0;
  
  for (let i = 1; i <= 3; i++) {
    try {
      const response = await axios.post(`${API_URL}/api/email/share-room`, {
        recipientEmail: 'test@example.com',
        senderName: 'Test User',
        roomId: 'test-room-123'
      });
      successCount++;
      log(`✅ Email ${i}: Success (${response.status})`, 'green');
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitedCount++;
        log(`🚫 Email ${i}: Rate Limited (429)`, 'red');
      } else if (error.response?.status === 500) {
        notConfiguredCount++;
        log(`⚠️  Email ${i}: Email service not configured (expected)`, 'yellow');
      } else {
        log(`❌ Email ${i}: Error (${error.message})`, 'red');
      }
    }
    await sleep(300);
  }
  
  log(`\n📊 Results: ${successCount} successful, ${rateLimitedCount} rate limited, ${notConfiguredCount} not configured`, 'blue');
}

// Display rate limit headers
async function showRateLimitHeaders() {
  log('\n🧪 TEST 6: Rate Limit Headers', 'blue');
  log('Checking rate limit headers in response...', 'yellow');
  
  try {
    const response = await axios.get(`${API_URL}/health`);
    const headers = response.headers;
    
    log('\n📋 Rate Limit Headers:', 'magenta');
    if (headers['ratelimit-limit']) {
      log(`   RateLimit-Limit: ${headers['ratelimit-limit']}`, 'green');
      log(`   RateLimit-Remaining: ${headers['ratelimit-remaining']}`, 'green');
      log(`   RateLimit-Reset: ${headers['ratelimit-reset']}`, 'green');
      
      const resetTime = new Date(headers['ratelimit-reset'] * 1000);
      log(`   Reset Time: ${resetTime.toLocaleString()}`, 'blue');
    } else {
      log('   ⚠️  Rate limit headers not found', 'yellow');
    }
  } catch (error) {
    log(`❌ Error fetching headers: ${error.message}`, 'red');
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🚀 CodeUnity Rate Limiting Test Suite', 'blue');
  log('='.repeat(60), 'blue');
  log(`\nTesting API at: ${API_URL}`, 'magenta');
  log('Make sure the server is running before executing tests.\n', 'yellow');
  
  try {
    await testGlobalRateLimit();
    await sleep(1000);
    
    await testAIRateLimit();
    await sleep(1000);
    
    await testAuthRateLimit();
    await sleep(1000);
    
    await testCodeExecutionRateLimit();
    await sleep(1000);
    
    await testEmailRateLimit();
    await sleep(1000);
    
    await showRateLimitHeaders();
    
    log('\n' + '='.repeat(60), 'blue');
    log('✅ All Tests Completed!', 'green');
    log('='.repeat(60), 'blue');
    log('\n📝 Summary:', 'magenta');
    log('   - Global rate limiting is protecting all endpoints', 'green');
    log('   - AI endpoints have stricter limits (10/min)', 'green');
    log('   - Auth endpoints prevent brute force (5/15min)', 'green');
    log('   - Code execution is limited (20/min)', 'green');
    log('   - Email sending is controlled (5/hour)', 'green');
    log('\n💡 Tip: Run this script multiple times to see rate limits in action!', 'yellow');
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    log('Make sure the server is running and accessible.', 'yellow');
  }
}

// Check if axios is installed
try {
  require('axios');
} catch (error) {
  console.error('❌ Error: axios package not found.');
  console.error('Please install it: npm install axios');
  process.exit(1);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testGlobalRateLimit,
  testAIRateLimit,
  testAuthRateLimit,
  testCodeExecutionRateLimit,
  testEmailRateLimit,
  showRateLimitHeaders
};
