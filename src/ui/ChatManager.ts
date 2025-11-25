import type { ChatMessage } from '../network/NetworkManager';

export type { ChatMessage };

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
                // Only open if not typing in another input (like name input)
                if (document.activeElement?.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.open();
                }
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
        // Scroll to bottom when opening to see history
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
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

        // Limit message history in memory
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }

        // Create and append element
        const element = this.createMessageElement(chatMessage);
        this.chatMessages.appendChild(element);

        // Limit DOM elements
        while (this.chatMessages.children.length > this.maxMessages) {
            if (this.chatMessages.firstChild) {
                this.chatMessages.removeChild(this.chatMessages.firstChild);
            }
        }

        // Auto-scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        // Fade out after 5 seconds
        // We use a timeout to add the class. 
        // If chat is open, CSS will keep it partially visible.
        // If chat is closed, CSS will hide it.
        setTimeout(() => {
            if (element.isConnected) {
                element.classList.add('faded');
            }
        }, 5000);
    }

    private createMessageElement(msg: ChatMessage): HTMLElement {
        const div = document.createElement('div');
        div.className = 'chat-message';

        // Timestamp
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
        const timeSpan = document.createElement('span');
        timeSpan.className = 'chat-timestamp';
        timeSpan.textContent = `[${time}]`;
        div.appendChild(timeSpan);

        if (msg.type === 'system') {
            div.classList.add('system-message');
            const text = document.createElement('span');
            text.textContent = msg.message;
            div.appendChild(text);
        } else if (msg.type === 'kill') {
            div.classList.add('kill-message');
            const text = document.createElement('span');
            text.textContent = msg.message;
            div.appendChild(text);
        } else {
            const name = document.createElement('span');
            name.className = 'chat-name';
            name.textContent = `${msg.playerName}: `;
            div.appendChild(name);

            const text = document.createElement('span');
            text.className = 'chat-text';
            text.textContent = msg.message;
            div.appendChild(text);
        }

        return div;
    }

    public onSend(callback: (message: string) => void): void {
        this.onSendCallback = callback;
    }

    public isInputActive(): boolean {
        return this.isOpen;
    }
}
