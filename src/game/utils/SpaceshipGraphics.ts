/**
 * Utility functions for creating detailed spaceship graphics
 */

export class SpaceshipGraphics {
    /**
     * Create a detailed player spaceship
     */
    static createPlayerShip(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
        const ship = scene.add.container(x, y);
        
        // Main body (blue fighter)
        const body = scene.add.graphics();
        body.fillStyle(0x4a9eff, 1);
        body.fillTriangle(0, -25, -12, 8, 12, 8);
        body.lineStyle(2, 0xffffff, 1);
        body.strokeTriangle(0, -25, -12, 8, 12, 8);
        ship.add(body);
        
        // Cockpit window
        const cockpit = scene.add.graphics();
        cockpit.fillStyle(0x00d4ff, 0.8);
        cockpit.fillCircle(0, -5, 6);
        ship.add(cockpit);
        
        // Wing details
        const wing1 = scene.add.graphics();
        wing1.fillStyle(0x2a7fcf, 1);
        wing1.fillRect(-15, 5, 8, 3);
        ship.add(wing1);
        
        const wing2 = scene.add.graphics();
        wing2.fillStyle(0x2a7fcf, 1);
        wing2.fillRect(7, 5, 8, 3);
        ship.add(wing2);
        
        // Engine glow
        const engineGlow = scene.add.graphics();
        engineGlow.fillStyle(0x00ffff, 0.6);
        engineGlow.fillCircle(-6, 12, 4);
        engineGlow.fillCircle(6, 12, 4);
        ship.add(engineGlow);
        
        ship.setDepth(20);
        return ship;
    }
    
    /**
     * Create a small fast enemy ship (red)
     */
    static createSmallEnemy(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
        const ship = scene.add.container(x, y);
        
        // Main body
        const body = scene.add.graphics();
        body.fillStyle(0xff6b6b, 1);
        body.fillTriangle(0, -12, -8, 8, 8, 8);
        body.lineStyle(2, 0xffffff, 1);
        body.strokeTriangle(0, -12, -8, 8, 8, 8);
        ship.add(body);
        
        // Red glow
        const glow = scene.add.graphics();
        glow.fillStyle(0xff0000, 0.4);
        glow.fillCircle(0, 0, 10);
        ship.add(glow);
        glow.setDepth(-1);
        
        ship.setDepth(10);
        return ship;
    }
    
    /**
     * Create a medium enemy ship (orange)
     */
    static createMediumEnemy(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
        const ship = scene.add.container(x, y);
        
        // Main body
        const body = scene.add.graphics();
        body.fillStyle(0xffa500, 1);
        body.fillTriangle(0, -18, -12, 12, 12, 12);
        body.lineStyle(2, 0xffffff, 1);
        body.strokeTriangle(0, -18, -12, 12, 12, 12);
        ship.add(body);
        
        // Wing details
        const wing1 = scene.add.graphics();
        wing1.fillStyle(0xff8800, 1);
        wing1.fillRect(-14, 8, 6, 4);
        ship.add(wing1);
        
        const wing2 = scene.add.graphics();
        wing2.fillStyle(0xff8800, 1);
        wing2.fillRect(8, 8, 6, 4);
        ship.add(wing2);
        
        // Orange glow
        const glow = scene.add.graphics();
        glow.fillStyle(0xff6600, 0.4);
        glow.fillCircle(0, 0, 15);
        ship.add(glow);
        glow.setDepth(-1);
        
        ship.setDepth(10);
        return ship;
    }
    
    /**
     * Create a large enemy ship (purple)
     */
    static createLargeEnemy(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
        const ship = scene.add.container(x, y);
        
        // Main body
        const body = scene.add.graphics();
        body.fillStyle(0x9b59b6, 1);
        body.fillTriangle(0, -22, -16, 16, 16, 16);
        body.lineStyle(2, 0xffffff, 1);
        body.strokeTriangle(0, -22, -16, 16, 16, 16);
        ship.add(body);
        
        // Wing details
        const wing1 = scene.add.graphics();
        wing1.fillStyle(0x7d3c98, 1);
        wing1.fillRect(-18, 12, 8, 4);
        ship.add(wing1);
        
        const wing2 = scene.add.graphics();
        wing2.fillStyle(0x7d3c98, 1);
        wing2.fillRect(10, 12, 8, 4);
        ship.add(wing2);
        
        // Cockpit
        const cockpit = scene.add.graphics();
        cockpit.fillStyle(0x6c3483, 0.8);
        cockpit.fillCircle(0, -8, 5);
        ship.add(cockpit);
        
        // Purple glow
        const glow = scene.add.graphics();
        glow.fillStyle(0x8e44ad, 0.4);
        glow.fillCircle(0, 0, 20);
        ship.add(glow);
        glow.setDepth(-1);
        
        ship.setDepth(10);
        return ship;
    }
    
    /**
     * Create engine trail effect
     */
    static createEngineTrail(scene: Phaser.Scene, x: number, y: number, color: number = 0x00ffff): Phaser.GameObjects.Graphics {
        const trail = scene.add.graphics();
        trail.fillStyle(color, 0.8);
        trail.fillCircle(0, 0, 3);
        trail.setPosition(x, y);
        trail.setDepth(5);
        return trail;
    }
}

