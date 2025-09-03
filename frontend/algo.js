function dijkstra(graph, start, goal) {
  const dist=new Map(), prev=new Map(), Q=new Set([...graph.nodes.keys()]);
  graph.nodes.forEach((_,id)=>dist.set(id,Infinity));
  dist.set(start,0);
  while(Q.size){
    let u=null,best=Infinity;
    for(const id of Q){const d=dist.get(id); if(d<best){best=d;u=id;}}
    if(u===null) break;
    Q.delete(u);
    if(u===goal) break;
    for(const {to,w} of graph.adj.get(u)||[]){
      if(!Q.has(to)) continue;
      const alt=dist.get(u)+w;
      if(alt<dist.get(to)){dist.set(to,alt);prev.set(to,u);}
    }
  }
  return reconstruct(prev,start,goal);
}

function astar(graph, start, goal) {
  const open=new Set([start]), came=new Map();
  const g=new Map(), f=new Map();
  graph.nodes.forEach((_,id)=>{g.set(id,Infinity);f.set(id,Infinity);});
  g.set(start,0); f.set(start,heuristic(graph,start,goal));
  while(open.size){
    let cur=null,best=Infinity;
    for(const id of open){const val=f.get(id); if(val<best){best=val;cur=id;}}
    if(cur===goal) return pathOf(came,cur);
    open.delete(cur);
    for(const {to,w} of graph.adj.get(cur)||[]){
      const tentative=g.get(cur)+w;
      if(tentative<g.get(to)){
        came.set(to,cur); g.set(to,tentative);
        f.set(to,tentative+heuristic(graph,to,goal)); open.add(to);
      }
    }
  }
  return [];
}

function heuristic(graph,a,b){
  const A=graph.nodes.get(a), B=graph.nodes.get(b);
  return Math.hypot(A.x-B.x,A.y-B.y);
}
function pathOf(came,cur){const out=[cur];while(came.has(cur)){cur=came.get(cur);out.push(cur);}return out.reverse();}
function reconstruct(prev,start,goal){const out=[];let u=goal;if(!prev.has(u)&&u!==start)return out;while(u){out.unshift(u);if(u===start)break;u=prev.get(u);}return out;}
