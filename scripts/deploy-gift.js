const fs = require('fs');
const apiKey = process.env.AGENTVERSE_API_KEY;
const AGENT_ADDR = 'agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9';

async function main() {
  console.log('Stopping agent...');
  await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/stop`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: '{}'
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Reading fixed agent code...');
  const code = fs.readFileSync('./gift-agent-updated.py', 'utf-8');
  console.log(`Code: ${code.length} bytes`);

  console.log('Uploading to Agentverse...');
  const codeArray = [{ language: 'python', name: 'agent.py', value: code }];

  const uploadRes = await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/code`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: JSON.stringify(codeArray) })
  });

  if (!uploadRes.ok) {
    console.log('Upload failed:', uploadRes.status, await uploadRes.text());
    return;
  }
  console.log('Upload success');

  console.log('Starting agent...');
  await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: '{}'
  });

  console.log('Waiting for compilation...');
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://agentverse.ai/v1/hosting/agents/${AGENT_ADDR}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const s = await statusRes.json();
    console.log(`[${(i+1)*5}s] running: ${s.running}, compiled: ${s.compiled}`);
    if (s.compiled) {
      console.log('\n✅ GIFT agent deployed successfully!');
      console.log(`\nAgent: https://agentverse.ai/agents/details/${AGENT_ADDR}`);
      console.log(`Token: https://agent-launch.ai/token/0xF7e2F77f014a5ad3C121b1942968be33BA89e03c`);
      return;
    }
  }

  console.log('\n❌ Not compiled after 60s');
}

main().catch(console.error);
