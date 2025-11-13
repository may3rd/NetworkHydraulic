/**
 * Custom Jest test results processor for hydraulic network application
 */

module.exports = (results) => {
  // Log summary of test results
  console.log('\n📊 Test Results Summary:');
  console.log(`   Total Tests: ${results.numTotalTests}`);
  console.log(`   Passed: ${results.numPassedTests}`);
  console.log(`   Failed: ${results.numFailedTests}`);
  console.log(`   Pending: ${results.numPendingTests}`);
  console.log(`   Success Rate: ${((results.numPassedTests / results.numTotalTests) * 100).toFixed(1)}%`);
  
  // Log coverage summary if available
  if (results.coverageMap) {
    console.log('\n📈 Coverage Summary:');
    const coverageSummary = results.coverageMap.getCoverageSummary();
    
    console.log(`   Lines: ${coverageSummary.lines.pct}%`);
    console.log(`   Functions: ${coverageSummary.functions.pct}%`);
    console.log(`   Branches: ${coverageSummary.branches.pct}%`);
    console.log(`   Statements: ${coverageSummary.statements.pct}%`);
  }
  
  // Log failed tests details
  if (results.numFailedTests > 0) {
    console.log('\n❌ Failed Tests:');
    results.testResults.forEach(testResult => {
      if (testResult.numFailingTests > 0) {
        console.log(`   File: ${testResult.testFilePath}`);
        testResult.testResults.forEach(test => {
          if (test.status === 'failed') {
            console.log(`     - ${test.fullName}`);
            if (test.failureMessages.length > 0) {
              console.log(`       Error: ${test.failureMessages[0].split('\n')[0]}`);
            }
          }
        });
      }
    });
  }
  
  // Log performance metrics
  const totalTime = results.testResults.reduce((total, result) => total + result.perfStats.runtime, 0);
  console.log(`\n⏱️  Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);
  
  // Check if we should fail the build based on thresholds
  const successRate = (results.numPassedTests / results.numTotalTests) * 100;
  const minSuccessRate = 80; // Minimum success rate threshold
  
  if (successRate < minSuccessRate) {
    console.log(`\n🚨 Build would fail: Success rate ${successRate.toFixed(1)}% is below threshold ${minSuccessRate}%`);
    return false;
  }
  
  // Check coverage thresholds
  if (results.coverageMap) {
    const coverageSummary = results.coverageMap.getCoverageSummary();
    const minCoverage = 80; // Minimum coverage threshold
    
    if (coverageSummary.lines.pct < minCoverage) {
      console.log(`\n🚨 Build would fail: Line coverage ${coverageSummary.lines.pct}% is below threshold ${minCoverage}%`);
      return false;
    }
    
    if (coverageSummary.branches.pct < minCoverage) {
      console.log(`\n🚨 Build would fail: Branch coverage ${coverageSummary.branches.pct}% is below threshold ${minCoverage}%`);
      return false;
    }
  }
  
  console.log('\n✅ All tests passed and coverage thresholds met!');
  
  return results;
};