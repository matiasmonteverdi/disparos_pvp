import type { LeaderboardEntry, ChatMessage, GameState } from '../network/NetworkManager';

export class UIManager {
    private pingIndicator: HTMLElement | null = null;
    private pingValue: HTMLElement | null = null;
    private leaderboard: HTMLElement | null = null;
    private leaderboardHint: HTMLElement | null = null;
    private reconnectOverlay: HTMLElement | null = null;
    private reconnectMessage: HTMLElement | null = null;
    private reconnectAttempts: HTMLElement | null = null;
    private leaderboardVisible: boolean = false;
    private currentPlayerId: string = '';

    // Chat Elements
    private chatContainer: HTMLElement | null = null;
    private chatMessages: HTMLElement | null = null;
    private chatInput: HTMLInputElement | null = null;
    private chatHint: HTMLElement | null = null;
    private isChatVisible: boolean = false;
    private onMessageSendCallback: ((message: string) => void) | null = null;

    // Kill Feed Elements
    private killFeedContainer: HTMLElement | null = null;

    // Game State Elements
    private gameStateContainer: HTMLElement | null = null;
    private timerElement: HTMLElement | null = null;
    private scoreRedElement: HTMLElement | null = null;
    private scoreBlueElement: HTMLElement | null = null;
    private gameOverScreen: HTMLElement | null = null;

    constructor() {
        this.createUIElements();
        this.setupEventListeners();
    }

    private createUIElements(): void {
        // Ping Indicator
        this.pingIndicator = document.createElement('div');
        this.pingIndicator.id = 'ping-indicator';
        this.pingIndicator.innerHTML = `
            <span>PING:</span>
            <span id="ping-value">0ms</span>
        `;
        document.body.appendChild(this.pingIndicator);
        this.pingValue = document.getElementById('ping-value');

        // Leaderboard
        this.leaderboard = document.createElement('div');
        this.leaderboard.id = 'leaderboard';
        this.leaderboard.innerHTML = '<h2>LEADERBOARD</h2><div id="leaderboard-content"></div>';
        document.body.appendChild(this.leaderboard);

        // Leaderboard Hint
        this.leaderboardHint = document.createElement('div');
        this.leaderboardHint.id = 'leaderboard-hint';
        this.leaderboardHint.textContent = 'Press TAB for Leaderboard';
        document.body.appendChild(this.leaderboardHint);

        // Reconnect Overlay
        this.reconnectOverlay = document.createElement('div');
        this.reconnectOverlay.id = 'reconnect-overlay';
        this.reconnectOverlay.innerHTML = `
            <div class="reconnect-message">RECONNECTING...</div>
            <div class="reconnect-spinner"></div>
            <div class="reconnect-attempts">Attempt <span id="reconnect-attempt-number">1</span> of 5</div>
        `;
        document.body.appendChild(this.reconnectOverlay);
        this.reconnectMessage = this.reconnectOverlay.querySelector('.reconnect-message');
        this.reconnectAttempts = this.reconnectOverlay.querySelector('#reconnect-attempt-number');

        // Chat System
        this.chatContainer = document.createElement('div');
        this.chatContainer.id = 'chat-container';
        this.chatContainer.innerHTML = `
            <div id="chat-messages"></div>
            <input type="text" id="chat-input" placeholder="Type message..." maxlength="100">
            <div id="chat-hint">Press ENTER to send, ESC to cancel</div>
        `;
        document.body.appendChild(this.chatContainer);
        this.chatMessages = this.chatContainer.querySelector('#chat-messages');
        this.chatInput = this.chatContainer.querySelector('#chat-input');
        this.chatHint = this.chatContainer.querySelector('#chat-hint');

        // Kill Feed
        this.killFeedContainer = document.createElement('div');
        this.killFeedContainer.id = 'kill-feed';
        this.killFeedContainer.style.position = 'absolute';
        this.killFeedContainer.style.top = '60px'; // Below player count
        this.killFeedContainer.style.right = '20px';
        this.killFeedContainer.style.display = 'flex';
        this.killFeedContainer.style.flexDirection = 'column';
        this.killFeedContainer.style.alignItems = 'flex-end';
        this.killFeedContainer.style.gap = '5px';
        this.killFeedContainer.style.pointerEvents = 'none';
        this.killFeedContainer.style.zIndex = '15';
        document.body.appendChild(this.killFeedContainer);

        // Game State UI (Timer & Scores)
        this.gameStateContainer = document.createElement('div');
        this.gameStateContainer.id = 'game-state-ui';
        this.gameStateContainer.innerHTML = `
            <div id="score-red" class="score red-team">RED: 0</div>
            <div id="game-timer">00:00</div>
            <div id="score-blue" class="score blue-team">BLUE: 0</div>
        `;
        document.body.appendChild(this.gameStateContainer);
        this.scoreRedElement = this.gameStateContainer.querySelector('#score-red');
        this.timerElement = this.gameStateContainer.querySelector('#game-timer');
        this.scoreBlueElement = this.gameStateContainer.querySelector('#score-blue');

        // Game Over Screen
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.id = 'game-over-screen';
        this.gameOverScreen.innerHTML = `
            <h1>GAME OVER</h1>
            <div id="winner-display"></div>
            <div id="restart-countdown">New game starting soon...</div>
        `;
        document.body.appendChild(this.gameOverScreen);
    }

    private setupEventListeners(): void {
        // Toggle leaderboard with TAB key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleLeaderboard();
            }

            // Chat controls
            if (e.key === 't' || e.key === 'T') {
                if (!this.isChatVisible && document.activeElement !== this.chatInput) {
                    e.preventDefault();
                    this.openChat();
                }
            }

            if (e.key === 'Enter') {
                if (this.isChatVisible) {
                    this.sendMessage();
                } else {
                    this.openChat();
                }
            }

            if (e.key === 'Escape') {
                if (this.isChatVisible) {
                    this.closeChat();
                }
            }
        });
    }

    public setCurrentPlayerId(playerId: string): void {
        this.currentPlayerId = playerId;
    }

    public updatePing(ping: number): void {
        if (!this.pingValue) return;

        this.pingValue.textContent = `${ping}ms`;

        // Remove all classes
        this.pingValue.classList.remove('high', 'critical');

        // Add appropriate class based on ping
        if (ping > 200) {
            this.pingValue.classList.add('critical');
        } else if (ping > 100) {
            this.pingValue.classList.add('high');
        }
    }

    public updateLeaderboard(entries: LeaderboardEntry[]): void {
        const content = document.getElementById('leaderboard-content');
        if (!content) return;

        content.innerHTML = '';

        entries.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';

            // Add team class
            if (entry.team === 'red') {
                entryDiv.classList.add('red-team');
            } else {
                entryDiv.classList.add('blue-team');
            }

            // Highlight current player
            if (entry.id === this.currentPlayerId) {
                entryDiv.classList.add('current-player');
            }

            // Rank
            const rank = document.createElement('div');
            rank.className = 'leaderboard-rank';
            rank.textContent = `#${index + 1}`;
            entryDiv.appendChild(rank);

            // Name
            const name = document.createElement('div');
            name.className = 'leaderboard-name';
            name.textContent = entry.name;
            entryDiv.appendChild(name);

            // Kills
            const kills = document.createElement('div');
            kills.className = 'leaderboard-kills';
            kills.textContent = `${entry.kills}K`;
            entryDiv.appendChild(kills);

            // Deaths
            const deaths = document.createElement('div');
            deaths.className = 'leaderboard-deaths';
            deaths.textContent = `${entry.deaths}D`;
            entryDiv.appendChild(deaths);

            // Ping
            const ping = document.createElement('div');
            ping.className = 'leaderboard-ping';
            ping.textContent = `${entry.ping}ms`;

            if (entry.ping > 200) {
                ping.classList.add('critical');
            } else if (entry.ping > 100) {
                ping.classList.add('high');
            }

            entryDiv.appendChild(ping);

            content.appendChild(entryDiv);
        });
    }

    public toggleLeaderboard(): void {
        if (!this.leaderboard) return;

        this.leaderboardVisible = !this.leaderboardVisible;

        if (this.leaderboardVisible) {
            this.leaderboard.classList.add('visible');
        } else {
            this.leaderboard.classList.remove('visible');
        }
    }

    public showLeaderboard(): void {
        if (!this.leaderboard) return;
        this.leaderboardVisible = true;
        this.leaderboard.classList.add('visible');
    }

    public hideLeaderboard(): void {
        if (!this.leaderboard) return;
        this.leaderboardVisible = false;
        this.leaderboard.classList.remove('visible');
    }

    public showReconnecting(attemptNumber: number = 1): void {
        if (!this.reconnectOverlay || !this.reconnectAttempts) return;

        this.reconnectOverlay.classList.add('visible');
        this.reconnectAttempts.textContent = attemptNumber.toString();
    }

    public hideReconnecting(): void {
        if (!this.reconnectOverlay) return;
        this.reconnectOverlay.classList.remove('visible');
    }

    public showReconnectFailed(): void {
        if (!this.reconnectMessage) return;
        this.reconnectMessage.textContent = 'RECONNECTION FAILED';
        this.reconnectMessage.style.color = 'var(--doom-red)';
    }

    public updatePlayerNameLabel(element: HTMLElement, team: 'red' | 'blue' | undefined): void {
        if (!team) return;

        element.classList.remove('red-team', 'blue-team');
        element.classList.add(`${team}-team`);
    }

    public destroy(): void {
        this.pingIndicator?.remove();
        this.leaderboard?.remove();
        this.leaderboardHint?.remove();
        this.reconnectOverlay?.remove();
        this.chatContainer?.remove();
        this.killFeedContainer?.remove();
        this.gameStateContainer?.remove();
        this.gameOverScreen?.remove();
    }

    public updateGameState(state: GameState): void {
        // Update Timer
        if (this.timerElement) {
            const minutes = Math.floor(state.timeRemaining / 60);
            const seconds = Math.floor(state.timeRemaining % 60);
            this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (state.timeRemaining <= 10 && state.status === 'playing') {
                this.timerElement.classList.add('critical');
            } else {
                this.timerElement.classList.remove('critical');
            }
        }

        // Update Scores
        if (this.scoreRedElement) {
            this.scoreRedElement.textContent = `RED: ${state.scores.red}`;
        }
        if (this.scoreBlueElement) {
            this.scoreBlueElement.textContent = `BLUE: ${state.scores.blue}`;
        }

        // Handle Game Over Screen
        if (this.gameOverScreen) {
            if (state.status === 'ended') {
                this.gameOverScreen.classList.add('visible');
                const winnerDisplay = this.gameOverScreen.querySelector('#winner-display');
                if (winnerDisplay) {
                    if (state.winningTeam === 'draw') {
                        winnerDisplay.textContent = 'DRAW!';
                        winnerDisplay.className = '';
                    } else if (state.winningTeam) {
                        winnerDisplay.textContent = `${state.winningTeam.toUpperCase()} WINS!`;
                        winnerDisplay.className = `${state.winningTeam}-team-text`;
                    }
                }
                this.showLeaderboard(); // Auto show leaderboard at end
            } else {
                this.gameOverScreen.classList.remove('visible');
                if (state.status === 'playing') {
                    this.hideLeaderboard();
                }
            }
        }
    }

    // Chat Methods
    public openChat(): void {
        if (!this.chatContainer || !this.chatInput) return;

        this.isChatVisible = true;
        this.chatContainer.classList.add('chat-open');
        this.chatInput.style.display = 'block';
        this.chatInput.focus();

        // Prevent game inputs while typing
        // This should be handled by checking isChatOpen() in Game.ts
    }

    public closeChat(): void {
        if (!this.chatContainer || !this.chatInput) return;

        this.isChatVisible = false;
        this.chatContainer.classList.remove('chat-open');
        this.chatInput.style.display = 'none';
        this.chatInput.value = '';
        this.chatInput.blur();

        // Refocus game canvas if needed
        document.getElementById('game-canvas')?.focus();
    }

    public isChatOpen(): boolean {
        return this.isChatVisible;
    }

    public onMessageSend(callback: (message: string) => void): void {
        this.onMessageSendCallback = callback;
    }

    private sendMessage(): void {
        if (!this.chatInput) return;

        const message = this.chatInput.value.trim();
        if (message && this.onMessageSendCallback) {
            this.onMessageSendCallback(message);
        }

        this.closeChat();
    }

    public addChatMessage(message: ChatMessage): void {
        if (!this.chatMessages) return;

        const msgElement = document.createElement('div');
        msgElement.className = 'chat-message';

        if (message.type === 'system') {
            msgElement.classList.add('system-message');
            msgElement.innerHTML = `<span class="chat-text">${message.message}</span>`;
        } else if (message.type === 'kill') {
            msgElement.classList.add('kill-message');
            msgElement.innerHTML = `<span class="chat-text">${message.message}</span>`;
            // Also add to kill feed
            this.addKillFeedEntry(message.message);
        } else {
            const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            msgElement.innerHTML = `
                <span class="chat-timestamp">[${time}]</span>
                <span class="chat-name">${message.playerName}:</span>
                <span class="chat-text">${message.message}</span>
            `;
        }

        this.chatMessages.appendChild(msgElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        // Auto-fade after 10 seconds if chat is closed
        setTimeout(() => {
            if (!this.isChatVisible) {
                msgElement.classList.add('faded');
            }
        }, 10000);
    }

    public addKillFeedEntry(message: string): void {
        if (!this.killFeedContainer) return;

        const entry = document.createElement('div');
        entry.className = 'kill-feed-entry';
        entry.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        entry.style.border = '1px solid var(--doom-red)';
        entry.style.padding = '5px 10px';
        entry.style.color = '#fff';
        entry.style.fontSize = '12px';
        entry.style.fontFamily = "'Press Start 2P', monospace";
        entry.style.textShadow = '1px 1px 0 #000';
        entry.style.animation = 'slideIn 0.3s ease-out';

        entry.textContent = message;

        this.killFeedContainer.appendChild(entry);

        // Remove after 5 seconds
        setTimeout(() => {
            entry.style.opacity = '0';
            entry.style.transition = 'opacity 0.5s';
            setTimeout(() => entry.remove(), 500);
        }, 5000);
    }
}
