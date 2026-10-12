import React, { useEffect, useRef } from 'react';

const StarRailBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        let stars = [];
        let planets = [];
        let animationId;
        
        // Создание звёзд
        for (let i = 0; i < 400; i++) {
            stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                radius: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.6 + 0.2,
                twinkle: Math.random() * 0.05
            });
        }
        
        // Планеты из Honkai: Star Rail
        planets = [
            {
                name: 'Герта',
                x: 150,
                y: 200,
                radius: 45,
                color1: '#4a90d9',
                color2: '#2a5a9a',
                glow: '#00aaff',
                ring: false,
                speed: 0.0005,
                angle: 0
            },
            {
                name: 'Ярило-VI',
                x: 0,
                y: 0,
                radius: 55,
                color1: '#8B5CF6',
                color2: '#4a2a8a',
                glow: '#a855f7',
                ring: true,
                ringColor: '#c084fc',
                speed: 0.0003,
                angle: Math.PI / 2
            },
            {
                name: 'Пенакония',
                x: 0,
                y: 0,
                radius: 40,
                color1: '#f59e0b',
                color2: '#b45309',
                glow: '#fbbf24',
                ring: false,
                speed: 0.0004,
                angle: Math.PI / 4
            },
            {
                name: 'Лофу',
                x: 0,
                y: 0,
                radius: 50,
                color1: '#10b981',
                color2: '#047857',
                glow: '#34d399',
                ring: true,
                ringColor: '#6ee7b7',
                speed: 0.0002,
                angle: 3 * Math.PI / 2
            },
            {
                name: 'Белобог',
                x: 0,
                y: 0,
                radius: 35,
                color1: '#3b82f6',
                color2: '#1e3a8a',
                glow: '#60a5fa',
                ring: false,
                speed: 0.0006,
                angle: 5 * Math.PI / 3
            }
        ];
        
        // Функция рисования планеты
        function drawPlanet(planet, time) {
            const width = canvas.width;
            const height = canvas.height;
            
            // Орбитальное движение
            if (planet.x === 0) {
                const orbitRadiusX = width * 0.35;
                const orbitRadiusY = height * 0.3;
                planet.x = width / 2 + Math.cos(planet.angle + time * planet.speed) * orbitRadiusX;
                planet.y = height / 2 + Math.sin(planet.angle + time * planet.speed) * orbitRadiusY;
            }
            
            ctx.save();
            
            // Свечение планеты
            ctx.shadowBlur = 25;
            ctx.shadowColor = planet.glow;
            
            // Градиент планеты
            const gradient = ctx.createRadialGradient(
                planet.x - 10, planet.y - 10, 5,
                planet.x, planet.y, planet.radius
            );
            gradient.addColorStop(0, planet.color1);
            gradient.addColorStop(1, planet.color2);
            ctx.fillStyle = gradient;
            
            // Тень планеты (полумесяц)
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Блик
            ctx.beginPath();
            ctx.arc(planet.x - 8, planet.y - 8, planet.radius * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
            
            // Кольца (для Ярило-VI и Лофу)
            if (planet.ring) {
                ctx.beginPath();
                ctx.ellipse(planet.x, planet.y, planet.radius + 8, planet.radius * 0.3, Math.PI / 4, 0, Math.PI * 2);
                ctx.fillStyle = planet.ringColor;
                ctx.globalAlpha = 0.6;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            
            // Название планеты
            ctx.font = 'bold 12px "Orbitron", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 5;
            ctx.shadowColor = planet.glow;
            ctx.fillText(planet.name, planet.x - 25, planet.y - planet.radius - 8);
            
            ctx.restore();
        }
        
        // Рисование звёздного неба
        function drawStars(time) {
            stars.forEach(star => {
                ctx.beginPath();
                const twinkle = Math.sin(time * star.twinkle) * 0.2 + 0.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Рисование туманностей
        function drawNebula() {
            const width = canvas.width;
            const height = canvas.height;
            
            // Туманность слева
            const grad1 = ctx.createRadialGradient(width * 0.15, height * 0.2, 30, width * 0.15, height * 0.2, 180);
            grad1.addColorStop(0, 'rgba(100, 50, 150, 0.15)');
            grad1.addColorStop(1, 'transparent');
            ctx.fillStyle = grad1;
            ctx.fillRect(0, 0, width, height);
            
            // Туманность справа
            const grad2 = ctx.createRadialGradient(width * 0.85, height * 0.7, 40, width * 0.85, height * 0.7, 200);
            grad2.addColorStop(0, 'rgba(50, 100, 200, 0.12)');
            grad2.addColorStop(1, 'transparent');
            ctx.fillStyle = grad2;
            ctx.fillRect(0, 0, width, height);
            
            // Туманность в центре (галактика)
            const grad3 = ctx.createLinearGradient(width * 0.4, height * 0.4, width * 0.6, height * 0.6);
            grad3.addColorStop(0, 'rgba(0, 255, 255, 0.05)');
            grad3.addColorStop(1, 'rgba(255, 0, 170, 0.05)');
            ctx.fillStyle = grad3;
            ctx.fillRect(0, 0, width, height);
        }
        
        // Падающие звёзды
        let shootingStars = [];
        
        function addShootingStar() {
            if (Math.random() > 0.995) {
                shootingStars.push({
                    x: Math.random() * canvas.width,
                    y: 0,
                    length: 80,
                    speed: 8,
                    alpha: 0.8
                });
            }
        }
        
        function drawShootingStars() {
            for (let i = 0; i < shootingStars.length; i++) {
                const star = shootingStars[i];
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(star.x - star.length, star.y + star.length);
                ctx.strokeStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                star.x -= star.speed;
                star.y += star.speed;
                star.alpha -= 0.02;
                
                if (star.alpha <= 0 || star.x < 0 || star.y > canvas.height) {
                    shootingStars.splice(i, 1);
                    i--;
                }
            }
        }
        
        let time = 0;
        
        function animate() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            canvas.width = width;
            canvas.height = height;
            
            time += 0.016;
            
            // Фон космоса
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#0a0a2a');
            gradient.addColorStop(0.4, '#1a0a3a');
            gradient.addColorStop(0.7, '#0a0a1a');
            gradient.addColorStop(1, '#050510');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Туманности
            drawNebula();
            
            // Звёзды
            drawStars(time);
            
            // Падающие звёзды
            addShootingStar();
            drawShootingStars();
            
            // Обновляем позиции планет при изменении размера
            if (planets[0].x === 150) {
                planets.forEach(planet => {
                    if (planet.name !== 'Герта') {
                        planet.x = 0;
                        planet.y = 0;
                    }
                });
            }
            
            // Планеты (Герта фиксирована слева)
            planets.forEach(planet => {
                if (planet.name === 'Герта') {
                    planet.x = Math.min(width * 0.15, 200);
                    planet.y = height * 0.25;
                }
                drawPlanet(planet, time);
            });
            
            // Созвездия (соединяем яркие звёзды)
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.15)';
            ctx.lineWidth = 1;
            for (let i = 0; i < stars.length; i += 30) {
                if (stars[i + 30]) {
                    ctx.moveTo(stars[i].x, stars[i].y);
                    ctx.lineTo(stars[i + 30].x, stars[i + 30].y);
                    ctx.stroke();
                }
            }
            
            animationId = requestAnimationFrame(animate);
        }
        
        animate();
        
        return () => {
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
            }}
        />
    );
};

export default StarRailBackground;