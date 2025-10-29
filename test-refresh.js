// Simple test to check the refresh endpoint
const testRefresh = async () => {
  try {
    // Test with an example slug (you'll need to replace with a real one)
    const slug = "your-test-slug-here";
    
    
    
    const response = await fetch(`http://localhost:3000/api/public/report/${slug}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    
    
    if (response.ok) {
      const result = await response.json();
      
    } else {
      const error = await response.text();
      
    }
  } catch (error) {
    
  }
};

// Run the test
testRefresh();