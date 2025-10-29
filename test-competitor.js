// Test script to verify competitor functionality
// Run with: node test-competitor.js

const BASE_URL = 'http://localhost:3001';

async function testCompetitorAPI() {
  

  // You need to replace this with an actual report slug from your database
  // You can find this in your admin panel or database
  const REPORT_SLUG = 'YOUR_REPORT_SLUG_HERE'; // <-- REPLACE THIS

  
  

  try {
    // Test 1: Fetch competitors
    
    const fetchResponse = await fetch(`${BASE_URL}/api/reports/${REPORT_SLUG}/competitors`);

    if (!fetchResponse.ok) {
      const error = await fetchResponse.json();
      
      
      return;
    }

    const data = await fetchResponse.json();
    
    
    

    // Test 2: Add a competitor
    
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
      
      return;
    }

    const newCompetitor = await addResponse.json();
    
    
    
    

    // Test 3: Update the competitor
    
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
      
    } else {
      const updatedCompetitor = await updateResponse.json();
      
      
    }

    // Test 4: Delete the competitor
    
    const deleteResponse = await fetch(`${BASE_URL}/api/reports/${REPORT_SLUG}/competitors/${newCompetitor.id}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      
    } else {
      
    }

    
    
    
    
    

  } catch (error) {
    
    
    
    
    
  }
}

// Run the test
testCompetitorAPI();