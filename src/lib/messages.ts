export async function getUserMessages(conversation_id: string) {
    const token = localStorage.getItem('token');
  
    if (!token) {
      throw new Error('No token found');
    }
  
    const response = await fetch(
      `https://edutalk-by8w.onrender.com/api/message/conversation/${conversation_id}`,
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