class Chat {
  constructor(containerId, chatId) {
    this.container = document.getElementById(containerId);
    this.chatId = chatId;
    this.token = localStorage.getItem('token');
    this.socket = null;
    this.messages = [];
    this.init();
  }

  async init() {
    await this.loadChatHistory();
    this.connectSocket();
    this.render();
  }

  connectSocket() {
    this.socket = io('http://localhost:5000', {
      auth: {
        token: this.token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.socket.emit('join-chat', this.chatId);
    });

    this.socket.on('new-message', (data) => {
      if (data.chatId === this.chatId) {
        this.messages.push(data.message);
        this.render();
        this.scrollToBottom();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });
  }

  async loadChatHistory() {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/${this.chatId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load chat history');
      
      const chat = await response.json();
      console.log('loadChatHistory: Chat data fetched from backend:', chat);
      console.log('loadChatHistory: Participants:', chat.participants);
      this.messages = chat.messages;
      this.participants = chat.participants;
      this.product = chat.product;
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.messages = [];
    }
  }

  async sendMessage(content) {
    if (!content.trim()) return;

    try {
      this.socket.emit('send-message', {
        chatId: this.chatId,
        content,
        senderId: JSON.parse(localStorage.getItem('user'))._id
      });

      // Clear input
      document.getElementById('messageInput').value = '';
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  render() {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    this.container.innerHTML = `
      <div class="chat-container">
        <div class="chat-header">
          <h3>Chat with ${this.getOtherParticipantName(currentUser._id)}</h3>
          ${this.product ? `
            <div class="product-info">
              <img src="${this.product.image}" alt="${this.product.name}">
              <span>${this.product.name}</span>
            </div>
          ` : ''}
        </div>

        <div class="messages-container">
          ${this.messages.map(msg => this.renderMessage(msg)).join('')}
        </div>

        <div class="message-input">
          <input type="text" id="messageInput" placeholder="Type your message...">
          <button onclick="chat.sendMessage(document.getElementById('messageInput').value)">
            Send
          </button>
        </div>
      </div>
    `;

    this.scrollToBottom();
  }

  renderMessage(message) {
    // Get current user ID inside the function for reliability
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser ? currentUser._id : null;

    // Ensure both IDs are strings for comparison
    const isCurrentUserSender = message.sender && message.sender._id && currentUserId 
                                  ? message.sender._id.toString() === currentUserId.toString()
                                  : false;

    const messageClass = isCurrentUserSender ? 'sent' : 'received';
    return `
      <div class="message ${messageClass} ${message.paid ? 'paid' : ''}">
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">${message.sender?.name || 'Unknown Sender'}</span>
            <span class="message-time">
              ${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p>${message.content}</p>
        </div>
      </div>
    `;
  }

  getOtherParticipantName(currentUserId) {
    if (!this.participants || this.participants.length < 2) return 'Unknown User'; // Ensure there are at least two participants

    // Filter out the current user
    const otherParticipants = this.participants.filter(p => 
      p && p._id && p._id.toString() !== currentUserId.toString()
    );

    // If there is at least one other participant, return their name
    if (otherParticipants.length > 0) {
      return otherParticipants[0].name || 'Unknown User';
    } else {
      // This case should ideally not happen in a valid two-person chat
      return 'Unknown User';
    }
  }

  scrollToBottom() {
    const messagesContainer = this.container.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }

  .chat-header {
    padding: 15px;
    background: #4CAF50;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .product-info {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.1);
    padding: 5px 10px;
    border-radius: 4px;
  }

  .product-info img {
    width: 30px;
    height: 30px;
    object-fit: cover;
    border-radius: 4px;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .message {
    max-width: 70%;
    display: flex;
    flex-direction: column;
  }

  .message.sent {
    align-self: flex-end;
  }

  .message.received {
    align-self: flex-start;
  }

  .message-content {
    padding: 10px 15px;
    border-radius: 15px;
    background: #f0f0f0;
  }

  .message.sent .message-content {
    background: #4CAF50;
    color: white;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    font-size: 0.8em;
  }

  .sender-name {
    font-weight: bold;
  }

  .message-time {
    color: #666;
  }

  .message-time {
    color: rgba(255,255,255,0.8);
  }

  .message-input {
    padding: 15px;
    background: #f8f8f8;
    display: flex;
    gap: 10px;
  }

  .message-input input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    outline: none;
  }

  .message-input button {
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .message-input button:hover {
    background: #45a049;
  }

  /* New styles for received messages */
  .message.received {
    align-self: flex-start;
  }

  .message.received .message-content {
    background: #f0f0f0;
    color: #333;
  }

  .message.received .message-time {
    color: #666;
  }
`;

document.head.appendChild(style);

// Export for use in other files
window.Chat = Chat; 