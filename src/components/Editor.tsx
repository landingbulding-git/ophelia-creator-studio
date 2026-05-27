import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Node,
  type Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from '../context/AuthContext';
import StepNode from './StepNode';
import { 
  Save, 
  ChevronLeft, 
  X, 
  Info, 
  MousePointer2, 
  Type, 
  Trash2,
  ExternalLink,
  Layers
} from 'lucide-react';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const nodeTypes = {
  step: StepNode,
};

interface EditorProps {
  guideId: string;
}

export default function Editor({ guideId }: EditorProps) {
  const { user } = useAuth();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const fetchGuide = useCallback(async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`https://ophelia-gemini-worker.norbertb-consulting.workers.dev/guide/${guideId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch guide');
      const data = await res.json();
      setGuide(data);

      // Create Nodes
      const initialNodes: Node[] = data.steps.map((step: any, i: number) => ({
        id: `step-${i}`,
        type: 'step',
        position: { x: 50, y: i * 250 + 50 },
        data: { step, index: i },
      }));

      // Create Edges
      const initialEdges: Edge[] = [];
      for (let i = 0; i < data.steps.length - 1; i++) {
        initialEdges.push({
          id: `edge-${i}`,
          source: `step-${i}`,
          target: `step-${i + 1}`,
          animated: true,
          style: { stroke: '#ff7a1a', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ff7a1a' },
        });
      }

      setNodes(initialNodes);
      setEdges(initialEdges);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [guideId, user, setNodes, setEdges]);

  useEffect(() => {
    if (user) fetchGuide();
  }, [user, fetchGuide]);

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node);
  };

  const handleUpdateNarration = (newNarration: string) => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              step: { ...(node.data.step as any), narration: newNarration },
            },
          };
        }
        return node;
      })
    );
    
    // Also update locally selected node for UI sync
    setSelectedNode({
        ...selectedNode,
        data: {
            ...selectedNode.data,
            step: { ...(selectedNode.data.step as any), narration: newNarration }
        }
    });
  };

  const handleSave = async () => {
    if (!user || !guide) return;
    setSaving(true);
    
    try {
      const token = await user.getIdToken();
      // Map nodes back to steps array
      const updatedSteps = nodes
        .sort((a, b) => a.position.y - b.position.y) // Simplistic reordering check
        .map(node => (node.data.step as any));
      
      const payload = {
        id: guideId,
        name: guide.name,
        steps: updatedSteps,
        updateOnly: true
      };

      // 1. Update Cloudflare KV
      const res = await fetch(`https://ophelia-gemini-worker.norbertb-consulting.workers.dev/guide`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Worker update failed');

      // 2. Update Firestore Metadata (e.g. title, step count)
      const docRef = doc(db, 'guides', guideId);
      const docSnap = await getDoc(docRef);
      
      const metadata: any = {
        title: guide.name,
        step_count: updatedSteps.length,
        userId: user.uid,
        updated_at: serverTimestamp()
      };

      // If document doesn't exist yet, we must set created_at 
      // so it shows up in the Dashboard's ordered query.
      if (!docSnap.exists()) {
        metadata.created_at = serverTimestamp();
      }

      await setDoc(docRef, metadata, { merge: true });

      alert('Guide saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save guide.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ophelia-orange"></div>
    </div>
  );

  const activeStep = selectedNode?.data.step as any;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-4">
          <a href="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </a>
          <h1 className="font-bold text-lg truncate max-w-[200px] sm:max-w-md">
            {guide?.name}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.open(guide?.pageUrl, '_blank')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Original Page
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-ophelia-orange hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg"
          >
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#0c0c0c]"
          >
            <Background color="#222" gap={20} />
            <Controls className="!bg-[#1a1a1a] !border-white/10 !fill-white" />
            <Panel position="top-right" className="bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Canvas Instructions</p>
                <p className="text-xs text-gray-300 italic text-center">Click a node to edit details.</p>
            </Panel>
          </ReactFlow>
        </div>

        {/* Inspector Panel */}
        <div className={`
          w-[400px] border-l border-white/5 bg-[#0f0f0f] flex flex-col transition-all duration-300
          ${selectedNode ? 'translate-x-0' : 'translate-x-full fixed right-0 h-full'}
        `}>
          {selectedNode ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                  <Info className="w-4 h-4 text-ophelia-orange" />
                  Step Details
                </h2>
                <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Screenshot Section */}
                <section>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">UI Capture</label>
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black aspect-video relative group">
                    {activeStep.screenshot ? (
                      <img src={activeStep.screenshot} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 italic text-sm">No screenshot captured</div>
                    )}
                  </div>
                </section>

                {/* Narration Editor */}
                <section>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">AI Narration</label>
                  <textarea 
                    value={activeStep.narration}
                    onChange={(e) => handleUpdateNarration(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm leading-relaxed focus:border-ophelia-orange/50 outline-none h-32 resize-none transition-colors"
                    placeholder="What should Ophelia say here?"
                  />
                  <p className="text-[10px] text-gray-600 mt-2 italic">Speak for the ear, not the eye. Keep it warm and direct.</p>
                </section>

                {/* Technical Fingerprint */}
                <section>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Interaction</label>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-ophelia-orange/10 flex items-center justify-center">
                        {activeStep.action === 'type' ? <Type className="w-4 h-4 text-ophelia-orange" /> : <MousePointer2 className="w-4 h-4 text-ophelia-orange" />}
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">{activeStep.action || 'Click'}</div>
                        <div className="text-xs font-mono text-gray-300">target: {activeStep.fingerprint?.tag || 'unknown'}</div>
                      </div>
                    </div>
                    
                    {activeStep.fingerprint?.aria_label && (
                      <div className="text-[11px] text-gray-500 bg-black/40 p-2 rounded-md border border-white/5">
                        <span className="text-gray-600">aria-label:</span> {activeStep.fingerprint.aria_label}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20">
                <button 
                    className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    onClick={() => {
                        if(confirm('Delete this step?')) {
                            setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                            setSelectedNode(null);
                        }
                    }}
                >
                    <Trash2 className="w-4 h-4" />
                    Remove Step
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-600">
               <Layers className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-sm italic">Select a node on the canvas to inspect and edit its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
