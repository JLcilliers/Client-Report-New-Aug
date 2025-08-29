// Simple test to check the refresh endpoint
const testRefresh = async () => {
  try {
    // Test with an example slug (you'll need to replace with a real one)
    const slug = "your-test-slug-here";
    
    console.log(`Testing refresh for slug: ${slug}`);
    
    const response = await fetch(`http://localhost:3000/api/public/report/${slug}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Success:', result);
    } else {
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Run the test
testRefresh();