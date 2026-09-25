export function flyDrawing(c, x, y, angle, color, scale, time, resting = false, body = null) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(time * 0.003) * (resting ? 0.02 : 0.08));
  c.scale(scale, scale);
  const oval = (x, y, rx, ry, fill, stroke = '#665b64') => {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1.1;
      c.stroke();
    }
  };
  oval(0, 13, 11, 3, '#71646d20', null);
  const flap = resting ? 0 : Math.sin(time * 0.04) * 2;
  oval(-11, -3 - flap, 7, 10, '#ffffffce', '#a3c9cc');
  oval(11, -3 + flap, 7, 10, '#ffffffce', '#a3c9cc');
  oval(-5, 11, 3, 3, color);
  oval(5, 11, 3, 3, color);
  const belly = body ? (body.massRatio ?? 1) * (1 + (body.satiety ?? 0) * 0.18) : 1;
  oval(0, 3, 12 * belly, 11 * belly, '#fff9f0');
  oval(0, -2, 11, 10, '#fff9f0', null);
  oval(0, -9, 6, 3, color, null);
  c.strokeStyle = '#665b64';
  c.lineWidth = 1.3;
  c.lineCap = 'round';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 5, -10);
    c.quadraticCurveTo(side * 8, -19, side * 10, -16);
    c.stroke();
    oval(side * 10, -16, 1.7, 1.7, color, null);
    if (resting) {
      c.beginPath();
      c.moveTo(side * 4 - 2, -1);
      c.lineTo(side * 4 + 2, -1);
      c.stroke();
    } else {
      oval(side * 4, -1, 1.7, 2.3, '#514b54', null);
      oval(side * 4 - 0.4, -1.8, 0.55, 0.7, '#fff', null);
    }
    oval(side * 8, 3, 2.7, 1.5, '#efb7b4', null);
  }
  c.beginPath();
  c.moveTo(-2, 4);
  c.quadraticCurveTo(0, 7, 2, 4);
  c.stroke();

  c.restore();
}
