/**
 * Sound Manager for handling game audio
 * Uses Web Audio API to generate sounds programmatically
 */

export class SoundManager {
    private scene: Phaser.Scene;
    private audioContext: AudioContext | null = null;
    private soundsEnabled: boolean = true;
    private volume: number = 0.3;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initAudio();
    }

    private initAudio() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported, sounds disabled');
            this.soundsEnabled = false;
        }
    }

    /**
     * Play a shooting sound
     */
    playShoot() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    /**
     * Play an explosion sound
     */
    playExplosion() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Play a hit sound
     */
    playHit() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    /**
     * Play background music (simple loop)
     */
    playBackgroundMusic() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        // Create a simple ambient tone
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 100;
        
        gainNode.gain.value = this.volume * 0.1;
        
        // Note: This is a simple implementation. For real background music,
        // you would load an audio file instead
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Enable/disable sounds
     */
    setEnabled(enabled: boolean) {
        this.soundsEnabled = enabled;
    }
}

