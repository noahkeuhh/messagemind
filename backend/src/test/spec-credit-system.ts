import { calculateDynamicCredits, determineMode } from '../services/credit-scaling.service.js';

function assertEqual(actual: any, expected: any, msg: string) {
  if (actual !== expected) {
    throw new Error(`${msg} | expected=${expected}, actual=${actual}`);
  }
}

async function runSpecTests() {
  console.log('Running credit + analysis spec tests...');

  // Mode selection tests
  assertEqual(determineMode('free', 'hi', false), 'snapshot', 'FREE should use snapshot');
  assertEqual(determineMode('pro', 'hello', false, false), 'snapshot', 'PRO default snapshot');
  assertEqual(determineMode('pro', 'hello', false, true), 'expanded', 'PRO expanded when toggle true');
  assertEqual(determineMode('plus', 'a'.repeat(200), false), 'snapshot', 'PLUS short text snapshot');
  assertEqual(determineMode('plus', 'a'.repeat(201), false), 'expanded', 'PLUS long text expanded');
  assertEqual(determineMode('max', 'hello', true), 'deep', 'MAX images => deep');
  assertEqual(determineMode('max', 'a'.repeat(150), false), 'expanded', 'MAX short text no image => expanded');
  assertEqual(determineMode('max', 'a'.repeat(250), false), 'deep', 'MAX long text => deep');

  // Credit calculations - base costs
  let r = calculateDynamicCredits({ mode: 'snapshot', tier: 'pro', inputText: 'hello', images: [] });
  assertEqual(r.baseTextCredits, 5, 'Short text base = 5');
  assertEqual(r.baseImageCredits, 0, 'No images');
  assertEqual(r.inputExtraCredits, 0, 'No extra penalty');

  r = calculateDynamicCredits({ mode: 'snapshot', tier: 'pro', inputText: 'a'.repeat(201), images: [] });
  assertEqual(r.baseTextCredits, 12, 'Long text base = 12');

  r = calculateDynamicCredits({ mode: 'snapshot', tier: 'pro', inputText: '', images: ['img'] });
  assertEqual(r.baseImageCredits, 30, 'One image = 30');

  r = calculateDynamicCredits({ mode: 'snapshot', tier: 'pro', inputText: 'a'.repeat(1000), images: [] });
  assertEqual(r.inputExtraCredits, 2, 'floor(1000/500)=2');

  // PRO surcharges
  r = calculateDynamicCredits({ mode: 'expanded', tier: 'pro', inputText: 'hi', images: [], expandedToggle: true, explanationToggle: true });
  assertEqual(r.totalCreditsRequired, r.baseTextCredits + r.inputExtraCredits + 12 + 4, 'PRO expanded+explanation add 16');

  // PLUS surcharges (EnhancedExplanation removed)
  r = calculateDynamicCredits({ mode: 'expanded', tier: 'plus', inputText: 'hi', images: [], explanationToggle: true });
  assertEqual(r.totalCreditsRequired, r.baseTextCredits + r.inputExtraCredits, 'PLUS explanation has no surcharge');

  // MAX deep multiplier
  r = calculateDynamicCredits({ mode: 'deep', tier: 'max', inputText: 'hi', images: ['img1'] });
  const base = r.baseTextCredits + r.baseImageCredits + r.inputExtraCredits;
  assertEqual(r.totalCreditsRequired, Math.ceil(base * 1.2), 'MAX deep applies ceil(base*1.2)');

  console.log('All spec tests passed.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSpecTests().catch(err => {
    console.error('Spec tests failed:', err.message);
    process.exit(1);
  });
}
