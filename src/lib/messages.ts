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

  export async function updateMessageState(messageId: string) {
    const token = localStorage.getItem('token');
  
    if (!token) {
      throw new Error('No token found');
    }
  
    const body = {
      state: "Seen",
    };
  
    const response = await fetch(
      `https://edutalk-by8w.onrender.com/api/message/state/${messageId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
  
    if (!response.ok) {
      throw new Error('Error updating message state');
    }
  
    return response.json();
  }

  export async function updateAllMessagesState(userId: string, conversation_id: string) {
    const token = localStorage.getItem('token');
  
    if (!token) {
      throw new Error('No token found');
    }
  
    const response = await fetch(
      `https://edutalk-by8w.onrender.com/api/message/mark-as-read/${userId}/${conversation_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  
    if (!response.ok) {
      throw new Error('Error updating messages state');
    }
  
    return response.json();
  }
  