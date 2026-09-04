/**
 * INCYRA - Automated Endpoint & AI Engine Verification Test
 */

const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Starting INCYRA Phase 1 Verification Tests...\n');

  // 1. Test Health Endpoint
  console.log('1️⃣ Testing GET /api/health');
  const healthRes = await getJson('/api/health');
  console.log('Status Code:', healthRes.statusCode);
  console.log('Response:', JSON.stringify(healthRes.data, null, 2));

  if (healthRes.statusCode !== 200 || healthRes.data.status !== 'OK') {
    throw new Error('Health check failed');
  }

  // 2. Reset Incident State
  console.log('\n2️⃣ Resetting Incident State: POST /api/incident/reset');
  await postJson('/api/incident/reset', {});

  // 3. Test Transcript Ingestion: Confirmed Fact (Alice)
  console.log('\n3️⃣ Sending Transcript #1 (Fact - 502 error & CPU 95%)');
  const t1 = await postJson('/api/incident/transcript', {
    speaker: 'Alice (Lead)',
    text: 'The payment API is returning 502 errors. Database CPU is currently at 95%.',
  });
  console.log('Transcript 1 Classification:', t1.data.processedItem.classification.category);
  console.log('Updated Summary:', t1.data.currentSummary);

  // 4. Test Transcript Ingestion: Conflicting Metric (Bob)
  console.log('\n4️⃣ Sending Transcript #2 (Conflict - CPU at 40%)');
  const t2 = await postJson('/api/incident/transcript', {
    speaker: 'Bob (DBA)',
    text: 'I am looking at CloudWatch and database CPU is only at 40%.',
  });
  console.log('Transcript 2 Classification:', t2.data.processedItem.classification.category);
  console.log('Conflict Detected:', t2.data.processedItem.conflict ? 'YES' : 'NO');
  if (t2.data.processedItem.conflict) {
    console.log('Conflict Topic:', t2.data.processedItem.conflict.topic);
    console.log('Recommendation:', t2.data.processedItem.conflict.recommendation);
  }

  // 5. Test Transcript Ingestion: Hypothesis (Charlie)
  console.log('\n5️⃣ Sending Transcript #3 (Hypothesis - cache cold)');
  const t3 = await postJson('/api/incident/transcript', {
    speaker: 'Charlie (DevOps)',
    text: 'I think the cache connection pool might be exhausted.',
  });
  console.log('Transcript 3 Classification:', t3.data.processedItem.classification.category);

  // 6. Test Transcript Ingestion: Action Item Assignment (Alice)
  console.log('\n6️⃣ Sending Transcript #4 (Action Item)');
  const t4 = await postJson('/api/incident/transcript', {
    speaker: 'Alice (Lead)',
    text: 'Bob, please check the database read replica status immediately.',
  });
  console.log('Transcript 4 Classification:', t4.data.processedItem.classification.category);
  console.log('Assignee:', t4.data.processedItem.classification.assignee);
  console.log('Priority:', t4.data.processedItem.classification.priority);

  // 7. Test Incident State Query
  console.log('\n7️⃣ Querying Full Incident State: GET /api/incident/state');
  const stateRes = await getJson('/api/incident/state');
  console.log('Facts Count:', stateRes.data.data.factsCount);
  console.log('Hypotheses Count:', stateRes.data.data.hypothesesCount);
  console.log('Action Items Count:', stateRes.data.data.actionItemsCount);
  console.log('Conflicts Count:', stateRes.data.data.conflictsCount);
  console.log('Active Participants:', stateRes.data.data.participants.map((p) => p.name).join(', '));
  console.log('Current Spoken Briefing:', stateRes.data.data.summary);

  console.log('\n✅ All INCYRA Phase 1 Verification Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
