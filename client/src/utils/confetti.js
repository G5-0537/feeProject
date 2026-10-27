export function triggerConfettiBurst() {
  if (typeof window === "undefined") return;
  const count = 45;
  const colors = ["#0f8f83", "#14b8a6", "#38bdf8", "#f59e0b", "#10b981", "#ec4899"];
  const container = document.createElement("div");
  container.className = "confetti-container-burst";
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.animationDuration = `${1.2 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);
  }

  setTimeout(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, 3200);
}