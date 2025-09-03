// Dữ liệu demo để chạy offline
function mockGraph() {
  const nodes = [
    { id:'G1', x: 90,  y:360, label:'Cổng chính' },
    { id:'L1', x:190,  y:300, label:'Lối 1' },
    { id:'L2', x:300,  y:280, label:'Lối 2' },
    { id:'H1', x:420,  y:250, label:'Hồ nước' },
    { id:'K1', x:520,  y:220, label:'Khu trò chơi' }
  ];
  const id = v => nodes.find(n=>n.id===v);
  const dist = (a,b)=>Math.hypot(a.x-b.x, a.y-b.y);
  const e = (a,b)=>({from:a,to:b,w:dist(id(a),id(b))});
  const edges = [ e('G1','L1'), e('L1','L2'), e('L2','H1'), e('H1','K1') ];
  return { nodes, edges };
}

function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }

class Graph {
  constructor(data) {
    this.nodes = new Map();
    this.adj = new Map();
    (data.nodes||[]).forEach(n => this.nodes.set(n.id, n));
    (data.edges||[]).forEach(({from,to,w}) => {
      if(!this.adj.has(from)) this.adj.set(from, []);
      if(!this.adj.has(to))   this.adj.set(to,   []);
      const A = this.nodes.get(from), B = this.nodes.get(to);
      const weight = (typeof w === 'number') ? w : dist(A,B);   // auto weight nếu thiếu
      this.adj.get(from).push({ to, w: weight });
      this.adj.get(to).push({ to: from, w: weight });
    });
  }
}
