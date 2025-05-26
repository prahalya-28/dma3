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
        this.socket = io('https://dma-qhwn.onrender.com', {
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
            const response = await fetch('https://dma-qhwn.onrender.com/api/chat/user/chats', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.status === 401) {
                // Token is expired or invalid, redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '../login/index.html'; // Or the correct path to your login page
                return; // Stop further execution
            }

            if (!response.ok) throw new Error('Failed to load chats');
            
            this.chats = await response.json();
            console.log('loadChats: Chats data fetched from backend:', this.chats);
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
            const otherParticipantName = otherParticipant?.name || 'Unknown User';
            const otherParticipantPic = otherParticipant?.profilePicture || '';

            const lastMessage = chat.messages[chat.messages.length - 1];
            const unreadCount = chat.messages.filter(m => 
                m && m.sender && m.sender._id && currentUser && currentUser._id && !m.read && m.sender._id.toString() !== currentUser._id.toString()
            ).length;

            return `
                <div class="chat-item ${unreadCount > 0 ? 'unread' : ''}" 
                     onclick="window.location.href='index.html?chatId=${chat._id}'">
                    <div class="chat-avatar">
                        ${otherParticipantPic ? `<img src="${otherParticipantPic}" alt="${otherParticipantName}">` : ''}
                    </div>
                    <div class="chat-info">
                        <div class="chat-header">
                            <span class="chat-name">${otherParticipantName}</span>
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
    window.chatList = new ChatList('chat-list-container');
}); 