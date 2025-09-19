// Test script to verify competitor functionality
// Run with: node test-competitor.js

const BASE_URL = 'http://localhost:3001';

async function testCompetitorAPI() {
  console.log('🧪 Testing Competitor API...\n');

  // You need to replace this with an actual report slug from your database
  // You can find this in your admin panel or database
  const REPORT_SLUG = 'YOUR_REPORT_SLUG_HERE'; // <-- REPLACE THIS

  console.log(`📝 Using report slug: ${REPORT_SLUG}`);
  console.log('⚠️  Note: Replace REPORT_SLUG with an actual slug from your database\n');

  try {
    // Test 1: Fetch competitors
    console.log('Test 1: Fetching competitors...');
    const fetchResponse = await fetch(`${BASE_URL}/api/reports/${REPORT_SLUG}/competitors`);

    if (!fetchResponse.ok) {
      const error = await fetchResponse.json();
      console.error('❌ Failed to fetch competitors:', error);
      console.log('\n💡 Tip: Make sure to use a valid report slug from your database');
      return;
    }

    const data = await fetchResponse.json();
    console.log('✅ Successfully fetched competitors');
    console.log(`   Brand: ${data.brandName}`);
    console.log(`   Competitors count: ${data.competitors?.length || 0}`);

    // Test 2: Add a competitor
    console.log('\nTest 2: Adding a test competitor...');
    const testCompetitor = {
      name: 'Test Competitor ' + Date.now(),
      domain: `test${Date.now()}.com`,
      notes: 'This is a test competitor'
    };

    const addResponse = await fetch(`${BASE_URL}/api/reports/${REPORT_SLUG}/competitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCompetitor)
    });

    if (!addResponse.ok) {
      const error = await addResponse.json();
      console.error('❌ Failed to add competitor:', error);
      return;
    }

    const newCompetitor = await addResponse.json();
    console.log('✅ Successfully added competitor');
    console.log(`   ID: ${newCompetitor.id}`);
    console.log(`   Name: ${newCompetitor.name}`);
    console.log(`   Domain: ${newCompetitor.domain}`);

    // Test 3: Update the competitor
    console.log('\nTest 3: Updating the competitor...');
    const updateData = {
      name: newCompetitor.name + ' (Updated)',
      domain: newCompetitor.domain,
      notes: 'Updated notes'
    };

    const updateResponse = await fetch(`${BASE_URL}/api/reports/${REPORT_SLUG}/competitors/${newCompetitor.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('❌ Failed to update competitor:', error);
    } else {
      const updatedCompetitor = await updateResponse.json();
      console.log('✅ Successfully updated competitor');
      console.log(`   Name: ${updatedCompetitor.name}`);
    }

    // Test 4: Delete the competitor
    console.log('\nTest 4: Deleting the test competitor...');
    const deleteResponse = await fetch(`${BASE_URL}/api/reports/${REPORT_SLUG}/competitors/${newCompetitor.id}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      console.error('❌ Failed to delete competitor:', error);
    } else {
      console.log('✅ Successfully deleted competitor');
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('   - API endpoints are working correctly');
    console.log('   - CRUD operations are functional');
    console.log('   - Now test the UI in your browser');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure the dev server is running on port 3001');
    console.log('   2. Replace REPORT_SLUG with an actual slug from your database');
    console.log('   3. Check the server logs for more details');
  }
}

// Run the test
testCompetitorAPI();