class ChatList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.token = localStorage.getItem('token');
        this.socket = null;
        this.chats = [];
        this.init();
    }

    async init() {
        await this.loadChats();
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
        });

        this.socket.on('new-message', (data) => {
            this.updateChatWithNewMessage(data);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
        });
    }

    async loadChats() {
        try {
            const response = await fetch('http://localhost:5000/api/chat/user/chats', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load chats');
            
            this.chats = await response.json();
            // Sort chats by last message time
            this.chats.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        } catch (error) {
            console.error('Error loading chats:', error);
            this.chats = [];
        }
    }

    updateChatWithNewMessage(data) {
        const chatIndex = this.chats.findIndex(chat => chat._id === data.chatId);
        if (chatIndex !== -1) {
            // Update last message
            this.chats[chatIndex].lastMessage = data.message;
            this.chats[chatIndex].lastMessageAt = data.message.createdAt;
            // Move chat to top
            const chat = this.chats.splice(chatIndex, 1)[0];
            this.chats.unshift(chat);
            this.render();
        }
    }

    render() {
        if (this.chats.length === 0) {
            this.container.innerHTML = `
                <div class="no-chats">
                    <h3>No conversations yet</h3>
                    <p>Start a conversation by viewing a product and clicking "Chat with Farmer"</p>
                </div>
            `;
            return;
        }

        const currentUser = JSON.parse(localStorage.getItem('user'));
        
        this.container.innerHTML = this.chats.map(chat => {
            const otherParticipant = chat.participants.find(p => p._id !== currentUser._id);
            const lastMessage = chat.messages[chat.messages.length - 1];
            const unreadCount = chat.messages.filter(m => 
                !m.read && m.sender._id !== currentUser._id
            ).length;

            return `
                <div class="chat-item ${unreadCount > 0 ? 'unread' : ''}" 
                     onclick="window.location.href='index.html?chatId=${chat._id}'">
                    <img src="${otherParticipant.profilePicture || '../assets/user-photo.jpg'}" 
                         alt="${otherParticipant.name}" 
                         class="chat-avatar">
                    <div class="chat-info">
                        <div class="chat-header">
                            <span class="chat-name">${otherParticipant.name}</span>
                            <span class="chat-time">
                                ${new Date(chat.lastMessageAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div class="chat-preview">
                            ${lastMessage ? lastMessage.content : 'No messages yet'}
                        </div>
                    </div>
                    ${chat.product ? `
                        <div class="product-info">
                            <img src="${chat.product.image}" alt="${chat.product.name}">
                            <span class="product-name">${chat.product.name}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
}

// Initialize chat list when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatList = new ChatList('chatList');
}); 