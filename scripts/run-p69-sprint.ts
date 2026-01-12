#!/usr/bin/env npx tsx
/**
 * P69 Sprint Runner
 * Execute this to run the full sprint test suite
 *
 * Usage: npx tsx scripts/run-p69-sprint.ts
 */

import { P69Sprint, runP69Sprint } from '../src/lib/p69-sprint';

const BANNER = `
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     ██╗     ██╗   ██╗███╗   ███╗███████╗███╗   ██╗               ║
║     ██║     ██║   ██║████╗ ████║██╔════╝████╗  ██║               ║
║     ██║     ██║   ██║██╔████╔██║█████╗  ██╔██╗ ██║               ║
║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║               ║
║     ███████╗╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║               ║
║     ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝               ║
║                                                                  ║
║      ██████╗ ██████╗  ██████╗ █████╗                             ║
║     ██╔═══██╗██╔══██╗██╔════╝██╔══██╗                            ║
║     ██║   ██║██████╔╝██║     ███████║                            ║
║     ██║   ██║██╔══██╗██║     ██╔══██║                            ║
║     ╚██████╔╝██║  ██║╚██████╗██║  ██║                            ║
║      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝                            ║
║                                                                  ║
║                    P69 PROTOCOL SPRINT                           ║
║              LUNAR NEW YEAR 2026 EDITION                         ║
║                                                                  ║
║     Floor:   99.9999%  ═══════════════════════▶  100%  Ceiling   ║
║                                                                  ║
║                   "THE IMPOSSIBLE"                               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`;

async function main() {
  console.log(BANNER);

  const lunarNewYear = new Date('2026-01-29T00:00:00Z');
  const now = new Date();
  const daysRemaining = Math.ceil((lunarNewYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`📅 Today: ${now.toISOString().split('T')[0]}`);
  console.log(`🐉 Lunar New Year 2026: January 29, 2026`);
  console.log(`⏱️  Days Remaining: ${daysRemaining}`);
  console.log(`\n${'─'.repeat(66)}\n`);

  // Check command line args
  const args = process.argv.slice(2);
  const quickTest = args.includes('--quick');
  const fullSprint = args.includes('--full');

  if (quickTest) {
    console.log('🚀 Running quick test (100 iterations)...\n');
    const sprint = new P69Sprint();

    const testReqs = [
      'Build a login form with validation',
      'Create an API endpoint for user data',
      'Implement a caching layer',
    ];

    const result = await sprint.runSprintTests({
      maxRuns: 100,
      requirements: testReqs,
    });

    const status = sprint.getStatus();
    console.log(`\n📊 Quick Test Results:`);
    console.log(`   Reliability: ${status.reliability}`);
    console.log(`   F_total: ${status.fTotal}`);
    console.log(`   Progress: ${status.progress.toFixed(2)}%`);
  } else if (fullSprint) {
    console.log('🔥 Running FULL P69 Sprint (may take a while)...\n');
    await runP69Sprint();
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/run-p69-sprint.ts --quick   # Run 100 test iterations');
    console.log('  npx tsx scripts/run-p69-sprint.ts --full    # Run full sprint to 100%');
    console.log('\nThe full sprint will continue until 100% reliability is achieved');
    console.log('or the maximum iteration count is reached.');
  }
}

main().catch(console.error);
