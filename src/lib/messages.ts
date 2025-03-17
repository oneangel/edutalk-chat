export async function getUserMessages() {
    const token = localStorage.getItem('token');
  
    if (!token) {
      throw new Error('No token found');
    }
  
    const response = await fetch(
      'https://edutalk-by8w.onrender.com/api/message/conversation/af72a86f-f097-4d46-8415-60df848a0520',
      {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });
  
    if (!response.ok) {
      throw new Error('Error getting messages');
    }
  
    return response.json();
  }