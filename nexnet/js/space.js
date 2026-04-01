document.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div');
    container.style = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; background:#050505;';
    document.body.prepend(container);

    const createLayer = (count, size, speed) => {
        const layer = document.createElement('div');
        layer.style = `position:absolute; inset:0; pointer-events:none; width:${size}px; height:${size}px;`;
        let s = "";
        for(let i=0; i<count; i++) s += `${Math.random()*2000}px ${Math.random()*2000}px #fff${i%2==0?',':''}`;
        layer.style.boxShadow = s.replace(/,$/, '');
        layer.animate([{transform:'translateY(0)'}, {transform:'translateY(-1000px)'}], {duration: speed, iterations: Infinity});
        container.appendChild(layer);
    };
    createLayer(600, 1, 100000);
    createLayer(200, 2, 150000);
});
