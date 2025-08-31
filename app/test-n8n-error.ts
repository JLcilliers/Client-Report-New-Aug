// Test file for N8n automation workflow
// This file contains a deliberate syntax error to test error handling
const testObject = {
  name: "N8n Test",
  purpose: "Testing error detection",
  timestamp: new Date().toISOString(),
  missing: "closing brace"
}; // FIXED: Added missing closing brace

export default testObject;
