// TravelOn Genie Chatbot Logic

document.addEventListener('DOMContentLoaded', () => {
    const chatBtn = document.getElementById('chatWidgetBtn');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeChatBtn');
    const sendBtn = document.getElementById('chatSendBtn');
    const chatInput = document.getElementById('chatInput');
    const messagesContainer = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');

    // Toggle Chat Window
    chatBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            chatInput.focus();
            if (messagesContainer.children.length === 1) { // Only greeting exists
                // Maybe auto greeting could be here, but HTML has default greeting
            }
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    // Send Message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // User Message
        appendMessage(message, 'user');
        chatInput.value = '';

        // Show Typing
        showTyping();

        try {
            const response = await fetch('/api/bot/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Hide Typing
            hideTyping();

            // Bot Response
            appendMessage(data.response, 'bot');

            // Render Listings if any
            if (data.listings && data.listings.length > 0) {
                appendListings(data.listings);
            }

        } catch (err) {
            hideTyping();
            appendMessage("Oops! My brain is offline. Try again later.", 'bot');
            console.error(err);
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Helper: Append Message
    function appendMessage(text, sender) {
        const div = document.createElement('div');
        div.classList.add('message', sender);
        div.textContent = text;
        messagesContainer.appendChild(div); // Append before typing indicator logic handled by layout usually, but simple append works if typing is separate
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Helper: Append Listings
    function appendListings(listings) {
        listings.forEach(l => {
            const a = document.createElement('a');
            a.href = `/listings/${l.id}`;
            a.classList.add('chat-listing-card');
            a.innerHTML = `
                <img src="${l.image}" class="chat-listing-img" alt="${l.title}">
                <div class="chat-listing-info">
                    <div class="chat-listing-title">${l.title}</div>
                    <div class="chat-listing-price">₹ ${l.price.toLocaleString("en-IN")}</div>
                </div>
            `;
            messagesContainer.appendChild(a);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTyping() {
        typingIndicator.style.display = 'flex';
        messagesContainer.appendChild(typingIndicator); // Move to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTyping() {
        typingIndicator.style.display = 'none';
    }
});
