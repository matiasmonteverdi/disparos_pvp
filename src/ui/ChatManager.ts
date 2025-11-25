export interface ChatMessage {
    playerId: string;
    playerName: string;
    message: string;
    timestamp: number;
}

export class ChatManager {
    private messages: ChatMessage[] = [];
    private maxMessages: number = 50;
    private chatContainer: HTMLElement;
    private chatInput: HTMLInputElement;
    private chatMessages: HTMLElement;
    private isOpen: boolean = false;
    private onSendCallback?: (message: string) => void;

    constructor() {
        this.chatContainer = document.getElementById('chat-container')!;
        this.chatInput = document.getElementById('chat-input') as HTMLInputElement;
        this.chatMessages = document.getElementById('chat-messages')!;

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Toggle chat with 'T' key
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyT' && !this.isOpen) {
                e.preventDefault();
                this.open();
            } else if (e.code === 'Escape' && this.isOpen) {
                e.preventDefault();
                this.close();
            }
        });

        // Send message on Enter
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            } else if (e.code === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });

        // Prevent input from affecting game controls
        this.chatInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
    }

    public open(): void {
        this.isOpen = true;
        this.chatContainer.classList.add('chat-open');
        this.chatInput.focus();
    }

    public close(): void {
        this.isOpen = false;
        this.chatContainer.classList.remove('chat-open');
        this.chatInput.value = '';
        this.chatInput.blur();
    }

    private sendMessage(): void {
        const message = this.chatInput.value.trim();
        if (message.length > 0 && this.onSendCallback) {
            this.onSendCallback(message);
            this.chatInput.value = '';
        }
        this.close();
    }

    public addMessage(chatMessage: ChatMessage): void {
        this.messages.push(chatMessage);

        // Limit message history
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }

        this.renderMessages();
    }

    private renderMessages(): void {
        // Clear existing messages
        this.chatMessages.innerHTML = '';

        // Show last 10 messages
        const recentMessages = this.messages.slice(-10);

        recentMessages.forEach((msg) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';

            if (msg.playerId === 'system') {
                messageElement.classList.add('system-message');
                messageElement.textContent = msg.message;
            } else {
                const nameSpan = document.createElement('span');
                nameSpan.className = 'chat-name';
                nameSpan.textContent = `${msg.playerName}: `;

                const textSpan = document.createElement('span');
                textSpan.className = 'chat-text';
                textSpan.textContent = msg.message;

                messageElement.appendChild(nameSpan);
                messageElement.appendChild(textSpan);
            }

            this.chatMessages.appendChild(messageElement);
        });

        // Auto-scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    public onSend(callback: (message: string) => void): void {
        this.onSendCallback = callback;
    }

    public isInputActive(): boolean {
        return this.isOpen;
    }
}
