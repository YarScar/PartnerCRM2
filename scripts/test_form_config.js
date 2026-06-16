(async function(){
  try{
    const base = process.env.BASE || 'http://localhost:3000';
    const getRes = await fetch(base + '/api/form-config');
    const config = await getRes.json();
    console.log('Current config sections:', config.map(s=>s.id));

    const newSection = {
      id: 'e2e_test_section',
      label: 'E2E Test Section',
      fields: [
        { id: 'e2e_test_field', label: 'E2E Test Field', type: 'text', visible: true, required: false }
      ]
    };

    // append if not present
    const exists = config.some(s=>s.id===newSection.id);
    const next = exists ? config : [...config, newSection];

    const postRes = await fetch(base + '/api/form-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    });
    const postText = await postRes.text();
    console.log('POST status:', postRes.status);
    console.log('POST response:', postText);

    const verify = await fetch(base + '/api/form-config');
    const verifyJson = await verify.json();
    console.log('After save, sections:', verifyJson.map(s=>s.id));
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }
})();
