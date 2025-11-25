import type { LeaderboardEntry } from '../network/NetworkManager';

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
        this.reconnectAttempts = document.getElementById('reconnect-attempt-number');
    }

    private setupEventListeners(): void {
        // Toggle leaderboard with TAB key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleLeaderboard();
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
    }
}
