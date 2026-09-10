async function runTest() {
  console.log('--- Starting Pocket Mentor E2E API Verification ---');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5001/api/health');
  const healthData = await healthRes.json();
  console.log('1. Health Check:', healthData.status === 'ok' ? 'PASSED ✅' : 'FAILED ❌');

  // 2. Guest Login
  const loginRes = await fetch('http://localhost:5001/api/auth/guest', { method: 'POST' });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('2. Guest Auth:', token ? 'PASSED ✅ (Token received)' : 'FAILED ❌');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Generate Study Kit
  const noteText = `Operating Systems: Process Synchronization and Deadlocks
Mutual Exclusion: Only one process can enter the critical section at any time.
Hold and Wait: Process holds resources while requesting additional ones.
No Preemption: Resources cannot be forcibly taken away from processes.
Circular Wait: A closed chain of processes each waiting for resource held by next.
Banker's Algorithm: An avoidance technique developed by Dijkstra to evaluate safe states.`;

  const studyRes = await fetch('http://localhost:5001/api/study/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Operating Systems Revision',
      subject: 'Computer Science',
      text: noteText,
      difficulty: 'Medium',
      questionCount: 3
    })
  });
  const studyData = await studyRes.json();
  console.log('3. Study Kit Generation:', studyData.sessionId && studyData.flashcards?.length > 0 ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   - Flashcards count:', studyData.flashcards?.length);
  console.log('   - Quiz questions count:', studyData.quiz?.questions?.length);
  console.log('   - 60-Second Takeaway:', studyData.session?.sixtySecondSummary?.memorableTakeaway);

  // 4. Submit Quiz with answers
  const quizId = studyData.quiz._id;
  const q1 = studyData.quiz.questions[0];
  const answers = {};
  // Intentionally pick option 1 (might be wrong or right, we test diagnostic calculation)
  studyData.quiz.questions.forEach((q, idx) => {
    answers[q.id] = (idx % 2 === 0) ? 0 : 1;
  });

  const submitRes = await fetch(`http://localhost:5001/api/quiz/${quizId}/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ answers })
  });
  const submitData = await submitRes.json();
  console.log('4. Quiz Scoring & Diagnostics:', submitData.accuracy !== undefined ? `PASSED ✅ (Score: ${submitData.score}/${submitData.total}, Accuracy: ${submitData.accuracy}%)` : 'FAILED ❌');
  console.log('   - Weak concepts identified:', submitData.weakConcepts);

  // 5. Revise Again (Core SRS Differentiator)
  const reviseRes = await fetch(`http://localhost:5001/api/quiz/${quizId}/revise`, {
    method: 'POST',
    headers
  });
  const reviseData = await reviseRes.json();
  console.log('5. Revise Again Loop:', reviseData.revisionQuizId && reviseData.quiz?.questions?.length > 0 ? 'PASSED ✅ (Targeted revision mini-quiz built)' : 'FAILED ❌');

  // 6. Ask My Notes (RAG Grounded Q&A)
  const askRes = await fetch(`http://localhost:5001/api/study/${studyData.sessionId}/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: 'What is the Banker\'s algorithm?' })
  });
  const askData = await askRes.json();
  console.log('6. Ask My Notes (Grounded Q&A):', askData.isFoundInNotes && askData.sourceExcerpt ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   - Excerpt:', askData.sourceExcerpt);

  // 7. Dashboard metrics
  const dashRes = await fetch('http://localhost:5001/api/dashboard', { headers });
  const dashData = await dashRes.json();
  console.log('7. Dashboard & Mastery Analytics:', dashData.totalKits > 0 ? 'PASSED ✅' : 'FAILED ❌');

  console.log('--- Pocket Mentor Full-Stack Verification Complete! ---');
}

runTest().catch(console.error);
