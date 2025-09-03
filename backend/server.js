import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const DATA_FILE = './backend/graph.json';
const API_KEY = process.env.API_KEY || 'dev-secret';

let graph = { nodes: [], edges: [] };
function load() { if (fs.existsSync(DATA_FILE)) graph = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function save() { fs.writeFileSync(DATA_FILE, JSON.stringify(graph, null, 2)); }
load();

// Middleware bảo vệ admin
function admin(req,res,next){
  if (req.header('x-api-key') !== API_KEY) return res.status(401).json({error:'unauthorized'});
  next();
}

// ===== Public API =====
app.get('/api/graph', (req,res)=> res.json(graph));

// TODO: thêm A*, Dijkstra tính route phía server (mình có code sẵn, bạn muốn thì copy vào đây)

// ===== Admin API =====
app.post('/admin/nodes', admin, (req,res)=>{
  const {id,x,y,label} = req.body;
  graph.nodes.push({id,x,y,label});
  save(); res.json({ok:true});
});

app.post('/admin/edges', admin, (req,res)=>{
  const {from,to,w} = req.body;
  graph.edges.push({from,to,w});
  save(); res.json({ok:true});
});

app.get('/admin/export', admin, (req,res)=> res.json(graph));

const PORT = process.env.PORT || 5173;
app.listen(PORT, ()=> console.log(`API http://localhost:${PORT}`));
