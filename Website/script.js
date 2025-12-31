// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to navigation
let lastScroll = 0;
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        nav.style.padding = '0.5rem 5%';
    } else {
        nav.style.padding = '1rem 5%';
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe project cards
document.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// OSCILLOSCOPE WAVEFORM
const canvas = document.getElementById('waveform-bg');
const ctx = canvas.getContext('2d');

// BPM Control
let currentBPM = 120; // Default BPM
const bpmSlider = document.getElementById('bpm-slider');
const bpmValue = document.getElementById('bpm-value');

if (bpmSlider && bpmValue) {
    bpmSlider.addEventListener('input', (e) => {
        currentBPM = parseInt(e.target.value);
        bpmValue.textContent = currentBPM;
    });
}

// Color variables for easy customization
const COLORS = {
    primary: '#7C6AE6',
    secondary: '#60A5FA',
    background: '#FFFFFF'
};

// Resize canvas to full window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Create grid (add this after resizeCanvas function)
function createGrid() {
    const grid = document.getElementById('grid');
    if (!grid) return;
    
    // Clear existing grid
    grid.innerHTML = '';
    
    const gridLines = 8;
    
    // Horizontal lines
    for (let i = 0; i <= gridLines; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line-h';
        line.style.top = `${(i / gridLines) * 100}%`;
        grid.appendChild(line);
    }
    
    // Vertical lines
    for (let i = 0; i <= gridLines * 2; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line-v';
        line.style.left = `${(i / (gridLines * 2)) * 100}%`;
        grid.appendChild(line);
    }
}

// Call it on load and resize
createGrid();
window.addEventListener('resize', createGrid);

// Generate realistic audio waveform data
function generateAudioWaveform(samples, offset) {
    const data = [];
    
    for (let i = 0; i < samples; i++) {
        const x = (i + offset) * 0.02;
        
        // Simulate kick drum hits (low frequency peaks)
        const kick = Math.sin(x * 0.5) * 0.9;
        const kickEnvelope = Math.pow(Math.max(0, Math.sin(x * 0.5)), 8);
        
        // Simulate snare/hi-hat (mid-high frequency)
        const snare = Math.sin(x * 2.3) * 0.4;
        const snareHits = Math.floor(x * 0.5) % 4 === 2 ? 1 : 0.3;
        
        // Bass line
        const bass = Math.sin(x * 1.2) * 0.6;
        
        // High frequency elements (hi-hats, cymbals)
        const hiFreq = Math.sin(x * 8.7) * 0.2 * (Math.sin(x * 0.25) * 0.5 + 0.5);
        
        // Combine with envelope
        let amplitude = kick * kickEnvelope * 0.5;
        amplitude += snare * snareHits * 0.3;
        amplitude += bass * 0.25;
        amplitude += hiFreq;
        
        // Use deterministic noise instead of random
        const noiseSeed = Math.floor((i + offset) * 7.919);
        const noise = Math.sin(noiseSeed * 12.9898) * 0.08;
        amplitude += noise;
        
        // Create variation in amplitude (like a real track)
        const envelope = 0.3 + Math.abs(Math.sin(x * 0.15)) * 0.7;
        amplitude *= envelope;
        
        // Clamp values
        amplitude = Math.max(-1, Math.min(1, amplitude));
        
        data.push(amplitude);
    }
    
    return data;
}

let scrollOffset = 0;
const baseSamplesPerFrame = 3;

function drawWaveform() {
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    // Responsive scale - smaller on mobile
    const isMobile = width < 768;
    const scale = isMobile ? height * 0.4 : height * 0.45;
    
    // Clear canvas completely - no background blur
    ctx.clearRect(0, 0, width, height);
    
    // Generate waveform data for current frame
    const waveformData = generateAudioWaveform(width, scrollOffset);
    
    // Smooth the waveform by averaging neighboring samples
    const smoothedData = [];
    for (let i = 0; i < waveformData.length; i++) {
        let sum = waveformData[i];
        let count = 1;
        
        // Average with neighbors
        if (i > 0) {
            sum += waveformData[i - 1];
            count++;
        }
        if (i < waveformData.length - 1) {
            sum += waveformData[i + 1];
            count++;
        }
        
        smoothedData[i] = sum / count;
    }
    
    // Draw the waveform as solid bars (clean Apple-like style)
    for (let i = 0; i < width; i++) {
        const amplitude = Math.abs(smoothedData[i]);
        const barHeight = amplitude * scale;
        
        // Color gradient from light blue to darker blue based on amplitude
        const intensity = Math.min(1, amplitude + 0.3);
        
        // Blue gradient: lighter at low amplitude, darker at high
        const r = Math.floor(96 - (intensity * 36));   // 96->60 (lighter to darker)
        const g = Math.floor(165 + (intensity * 0));   // Stay around 165
        const b = Math.floor(250);                      // Keep blue channel high
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.85})`;
        
        // Draw top half
        ctx.fillRect(i, centerY - barHeight, 1, barHeight);
        
        // Draw bottom half (mirror)
        ctx.fillRect(i, centerY, 1, barHeight);
    }
    
    // Draw subtle center line
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Calculate speed based on BPM (90 BPM = slower, 135 BPM = faster)
    const bpmMultiplier = currentBPM / 120; // 120 is the base BPM
    const samplesPerFrame = baseSamplesPerFrame * bpmMultiplier;
    
    // Increment scroll for animation
    scrollOffset += samplesPerFrame;
    
    requestAnimationFrame(drawWaveform);
}

drawWaveform();



//constact section

      const sliders = document.querySelectorAll('.djm__fader__input');
    
    sliders.forEach(slider => {
      slider.addEventListener('input', function() {
        const channel = this.dataset.channel;
        const value = parseInt(this.value);
        const button = document.getElementById(`djm__button__${channel}`);
        const led = document.getElementById(`djm__led__${channel}`);
        const channelUnit = this.closest('.djm__channel__unit');
        
        if (value > 70) {
          button.classList.add('djm__button__visible');
          led.classList.add('djm__led__active');
          channelUnit.classList.add('active');
        } else {
          button.classList.remove('djm__button__visible');
          led.classList.remove('djm__led__active');
          channelUnit.classList.remove('active');
        }
      });
    });