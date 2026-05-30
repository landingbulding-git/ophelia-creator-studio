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
import DelayNode from './DelayNode';
import VideoNode from './VideoNode';
import AddStepEdge from './AddStepEdge';
import { 
  Save, 
  ChevronLeft, 
  X, 
  Info, 
  MousePointer2, 
  Type, 
  Trash2,
  ExternalLink,
  Layers,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  Plus,
  Link
} from 'lucide-react';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nodeTypes = {
  step: StepNode,
  delay: DelayNode,
  video: VideoNode,
};

const edgeTypes = {
  addStep: AddStepEdge,
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
  const [generatingVars, setGeneratingVars] = useState(false);

  // Add step menu state
  const [addStepMenu, setAddStepMenu] = useState<{ edgeId: string; x: number; y: number } | null>(null);

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
        type: step.action === 'delay' ? 'delay' : (step.action === 'video' ? 'video' : 'step'),
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
          type: 'addStep',
          animated: true,
          style: { stroke: '#ff7a1a', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ff7a1a' },
          data: { onAddStep: (id: string, evt: React.MouseEvent) => handleAddStepClick(id, evt) }
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

  const onConnect = useCallback(
    (params: any) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'addStep',
        animated: true,
        style: { stroke: '#ff7a1a', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ff7a1a' },
        data: { onAddStep: (id: string, evt: React.MouseEvent) => handleAddStepClick(id, evt) }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleAddStepClick = (edgeId: string, evt: React.MouseEvent) => {
    // Get the container element's bounding rect
    const flowContainer = document.querySelector('.flex-1.relative');
    if (!flowContainer) return;
    
    const rect = flowContainer.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    setAddStepMenu({ edgeId, x, y });
  };

  const handleAddDelay = () => {
    if (!addStepMenu) return;
    const { edgeId } = addStepMenu;
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const insertY = (sourceNode.position.y + targetNode.position.y) / 2;
    const shiftAmount = 250;

    // Shift all nodes below insertY down
    setNodes(nds => nds.map(node => {
        if (node.position.y > insertY) {
            return { ...node, position: { ...node.position, y: node.position.y + shiftAmount } };
        }
        return node;
    }));

    const newStep = {
        action: 'delay',
        duration: 1,
        narration: 'Waiting for a moment...',
    };

    const newNodeId = `step-${Date.now()}`;
    const newNode: Node = {
        id: newNodeId,
        type: 'delay',
        position: { x: sourceNode.position.x, y: insertY },
        data: { step: newStep, index: -1 }
    };

    setNodes(nds => [...nds, newNode]);
    
    // Update edges
    setEdges(eds => {
        const filtered = eds.filter(e => e.id !== edgeId);
        return [
            ...filtered,
            {
                id: `edge-pre-${newNodeId}`,
                source: edge.source,
                target: newNodeId,
                type: 'addStep',
                animated: true,
                style: { stroke: '#ff7a1a', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#ff7a1a' },
                data: { onAddStep: (id: string, evt: React.MouseEvent) => handleAddStepClick(id, evt) }
            },
            {
                id: `edge-post-${newNodeId}`,
                source: newNodeId,
                target: edge.target,
                type: 'addStep',
                animated: true,
                style: { stroke: '#ff7a1a', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#ff7a1a' },
                data: { onAddStep: (id: string, evt: React.MouseEvent) => handleAddStepClick(id, evt) }
            }
        ];
    });

    setAddStepMenu(null);
  };

  const handleAddVideo = () => {
    if (!addStepMenu) return;
    const { edgeId } = addStepMenu;
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const insertY = (sourceNode.position.y + targetNode.position.y) / 2;
    const shiftAmount = 250;

    // Shift nodes
    setNodes(nds => nds.map(node => {
        if (node.position.y > insertY) {
            return { ...node, position: { ...node.position, y: node.position.y + shiftAmount } };
        }
        return node;
    }));

    const newStep = {
        action: 'video',
        url: '',
        narration: 'Watch this quick video...',
    };

    const newNodeId = `step-${Date.now()}`;
    const newNode: Node = {
        id: newNodeId,
        type: 'video',
        position: { x: sourceNode.position.x, y: insertY },
        data: { step: newStep, index: -1 }
    };

    setNodes(nds => [...nds, newNode]);
    
    setEdges(eds => {
        const filtered = eds.filter(e => e.id !== edgeId);
        return [
            ...filtered,
            {
                id: `edge-pre-${newNodeId}`,
                source: edge.source,
                target: newNodeId,
                type: 'addStep',
                animated: true,
                style: { stroke: '#ff7a1a', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#ff7a1a' },
                data: { onAddStep: (id: string, evt: React.MouseEvent) => handleAddStepClick(id, evt) }
            },
            {
                id: `edge-post-${newNodeId}`,
                source: newNodeId,
                target: edge.target,
                type: 'addStep',
                animated: true,
                style: { stroke: '#ff7a1a', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#ff7a1a' },
                data: { onAddStep: (id: string, evt: React.MouseEvent) => handleAddStepClick(id, evt) }
            }
        ];
    });

    setAddStepMenu(null);
  };

  const handleAddAtStart = () => {
    if (nodes.length === 0) return;
    
    // Find first node
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
    const firstNode = sortedNodes[0];

    const shiftAmount = 250;
    const insertY = firstNode.position.y - 125;

    // Shift ALL nodes down
    setNodes(nds => nds.map(node => ({
        ...node,
        position: { ...node.position, y: node.position.y + shiftAmount }
    })));

    const newStep = {
        action: 'video',
        url: '',
        narration: 'Before we begin, watch this quick video...',
    };

    const newNodeId = `step-${Date.now()}`;
    const newNode: Node = {
        id: newNodeId,
        type: 'video',
        position: { x: firstNode.position.x, y: insertY + 125 }, // It will be at the original first node's position roughly
        data: { step: newStep, index: -1 }
    };

    setNodes(nds => [...nds, newNode]);
    
    // Create edge from new node to the old first node
    setEdges(eds => [
        {
            id: `edge-start-${newNodeId}`,
            source: newNodeId,
            target: firstNode.id,
            type: 'addStep',
            animated: true,
            style: { stroke: '#ff7a1a', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ff7a1a' },
            data: { onAddStep: (id: string, evt: React.MouseEvent) => handleAddStepClick(id, evt) }
        },
        ...eds
    ]);

    setAddStepMenu(null);
  };

  const handleAddAtStartClick = (evt: React.MouseEvent) => {
    const flowContainer = document.querySelector('.flex-1.relative');
    if (!flowContainer) return;
    const rect = flowContainer.getBoundingClientRect();
    setAddStepMenu({ edgeId: 'START', x: evt.clientX - rect.left, y: evt.clientY - rect.top });
  };

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

  const handleUpdatePrompt = (newPrompt: string) => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              step: { ...(node.data.step as any), prompt: newPrompt },
            },
          };
        }
        return node;
      })
    );
    
    setSelectedNode({
        ...selectedNode,
        data: {
            ...selectedNode.data,
            step: { ...(selectedNode.data.step as any), prompt: newPrompt }
        }
    });
  };

  const handleUpdateDuration = (newDuration: number) => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              step: { ...(node.data.step as any), duration: newDuration },
            },
          };
        }
        return node;
      })
    );
    
    setSelectedNode({
        ...selectedNode,
        data: {
            ...selectedNode.data,
            step: { ...(selectedNode.data.step as any), duration: newDuration }
        }
    });
  };

  const handleUpdateUrl = (newUrl: string) => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              step: { ...(node.data.step as any), url: newUrl },
            },
          };
        }
        return node;
      })
    );
    
    setSelectedNode({
        ...selectedNode,
        data: {
            ...selectedNode.data,
            step: { ...(selectedNode.data.step as any), url: newUrl }
        }
    });
  };

  const handleParseVariables = async () => {
    const activeStep = selectedNode?.data.step as any;
    if (!selectedNode || !activeStep.prompt) return;
    
    const matches = Array.from(activeStep.prompt.matchAll(/<([^>]+)>/g));
    const vars = matches.map(m => m[1]);
    
    if (vars.length === 0) {
        alert("No variables found. Use <variable_name> syntax.");
        return;
    }
    
    setGeneratingVars(true);
    try {
        const token = await user?.getIdToken();
        const res = await fetch(`https://ophelia-gemini-worker.norbertb-consulting.workers.dev/claude`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                system: "You are a UX assistant. Given a prompt containing dynamic variables in <brackets>, generate a brief, clear question for EACH variable to ask the user for its value. Respond with ONLY a JSON object where keys are the variable names (without brackets) and values are the questions.",
                messages: [{ role: 'user', content: `Prompt: "${activeStep.prompt}"` }]
            })
        });
        
        if (!res.ok) throw new Error('AI call failed');
        const data = await res.json();
        const aiText = data.content?.find((c: any) => c.type === 'text')?.text || '{}';
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        // Update step data
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === selectedNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  step: { ...(node.data.step as any), variables: questions },
                },
              };
            }
            return node;
          })
        );
        
        setSelectedNode({
            ...selectedNode,
            data: {
                ...selectedNode.data,
                step: { ...(selectedNode.data.step as any), variables: questions }
            }
        });

    } catch (err) {
        console.error(err);
        alert('Failed to generate questions.');
    } finally {
        setGeneratingVars(false);
    }
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
      
      const firstStep = updatedSteps[0];
      let domain = guide.domain;
      let pageUrl = guide.pageUrl;
      if (firstStep?.url) {
          pageUrl = firstStep.url;
          try { domain = new URL(firstStep.url).hostname; } catch(_) {}
      }

      const metadata: any = {
        title: guide.name,
        domain: domain,
        pageUrl: pageUrl,
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

  const getScreenshotSrc = (src: string) => {
    if (!src) return '';
    if (src.startsWith('data:')) return src;
    return `data:image/jpeg;base64,${src}`;
  };

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
          {guide?.steps?.length > 0 && (<button onClick={() => { const targetUrl = guide.steps[guide.steps.length - 1].url || guide.pageUrl || 'https://'+guide.domain; window.open(targetUrl + '?opheliaContinueRecording=' + guide.id, '_blank'); }} className='bg-[#222] border border-ophelia-orange/30 hover:border-ophelia-orange text-ophelia-orange px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg'><div className='w-2 h-2 rounded-full bg-red-500 animate-pulse'></div>Continue Recording</button>)}<button 
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
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
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

          {/* Add Step Menu */}
          {/* Add Step Menu */}
          {addStepMenu && (
            <div 
                className="absolute z-50 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 w-48 animate-in fade-in zoom-in-95 duration-200"
                style={{ left: addStepMenu.x, top: addStepMenu.y, transform: 'translate(-50%, -100%)' }}
            >
                <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Insert Step</span>
                    <button onClick={() => setAddStepMenu(null)} className="text-gray-500 hover:text-white">
                        <X className="w-3 h-3" />
                    </button>
                </div>
                <div className="space-y-1">
                    <button 
                        onClick={addStepMenu.edgeId === 'START' ? undefined : handleAddDelay}
                        disabled={addStepMenu.edgeId === 'START'}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left group",
                            addStepMenu.edgeId === 'START' ? "opacity-20 cursor-not-allowed" : "hover:bg-ophelia-orange/10 text-gray-300 hover:text-ophelia-orange"
                        )}
                    >
                        <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">Delay</span>
                            <span className="text-[9px] opacity-60">Wait for X minutes</span>
                        </div>
                    </button>
                    <button 
                        onClick={addStepMenu.edgeId === 'START' ? handleAddAtStart : handleAddVideo}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ophelia-orange/10 text-gray-300 hover:text-ophelia-orange transition-colors text-left group"
                    >
                        <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">Video</span>
                            <span className="text-[9px] opacity-60">Play cursor-following video</span>
                        </div>
                    </button>
                </div>
            </div>
          )}

          {/* Add at Start Button (Floating over canvas) */}
          {!addStepMenu && nodes.length > 0 && (
             <Panel position="top-center" style={{ marginTop: '20px' }}>
                <button
                    onClick={handleAddAtStartClick}
                    className="w-8 h-8 bg-[#1a1a1a] border border-white/10 hover:border-ophelia-orange hover:text-ophelia-orange text-gray-400 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl group"
                    title="Insert Video at Start"
                >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
             </Panel>
          )}
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
                      <img src={getScreenshotSrc(activeStep.screenshot)} className="w-full h-full object-contain" />
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

                {/* Delay Duration */}
                {activeStep.action === 'delay' && (
                  <section className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Wait Duration</label>
                    <div className="bg-ophelia-orange/5 border border-ophelia-orange/20 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-ophelia-orange/10 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-ophelia-orange" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-white">{activeStep.duration || 1} Minutes</span>
                                <span className="text-[10px] text-gray-500 font-medium">Wait time</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="60" 
                                value={activeStep.duration || 1}
                                onChange={(e) => handleUpdateDuration(parseInt(e.target.value))}
                                className="w-full accent-ophelia-orange h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2 italic">How long should Ophelia wait before the next step?</p>
                  </section>
                )}

                {/* Step URL */}
                <section>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">
                        {activeStep.action === 'video' ? 'Video Source' : 'Target URL'}
                    </label>
                    <div className={cn(
                        "rounded-xl p-4 flex flex-col gap-3 border transition-colors",
                        activeStep.action === 'video' ? "bg-ophelia-orange/5 border-ophelia-orange/20" : "bg-white/[0.02] border-white/5"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                activeStep.action === 'video' ? "bg-ophelia-orange/10" : "bg-blue-500/10"
                            )}>
                                {activeStep.action === 'video' ? (
                                    <Video className="w-4 h-4 text-ophelia-orange" />
                                ) : (
                                    <Link className="w-4 h-4 text-blue-400" />
                                )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium leading-tight">
                                {activeStep.action === 'video' 
                                    ? "Enter a direct video link or YouTube/Vimeo URL." 
                                    : "The browser will navigate to this URL before this step if it's different from the current page."
                                }
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder={activeStep.action === 'video' ? "https://example.com/video.mp4" : "Same as previous step"}
                            value={activeStep.url || ''}
                            onChange={(e) => handleUpdateUrl(e.target.value)}
                            className={cn(
                                "w-full bg-black/40 border rounded-lg p-3 text-xs text-white outline-none transition-colors font-mono",
                                activeStep.action === 'video' ? "border-white/10 focus:border-ophelia-orange/50" : "border-white/10 focus:border-blue-500/50"
                            )}
                        />
                    </div>
                </section>

                {/* Technical Fingerprint */}                {activeStep.action !== 'delay' && (
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
                )}

                {/* AI Prompt Extension */}
                {activeStep.action === 'type' && (
                  <section className="animate-in fade-in slide-in-from-top-2 duration-300">
                    {activeStep.variables && Object.keys(activeStep.variables).length > 0 && (
                      <div className="mb-4 space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Generated Questions</label>
                        <div className="space-y-2">
                          {Object.entries(activeStep.variables).map(([key, question]: [string, any]) => (
                            <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="text-[9px] text-ophelia-orange font-bold uppercase mb-1">{key}</div>
                              <div className="text-xs text-gray-300 leading-relaxed">{question}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">AI Prompt / Auto-Paste</label>
                        <button 
                          onClick={handleParseVariables}
                          disabled={generatingVars}
                          className="p-1 hover:bg-white/10 rounded text-green-500 disabled:opacity-50 transition-colors flex items-center justify-center"
                          title="Parse variables and generate questions"
                        >
                          {generatingVars ? <div className="animate-spin h-3 w-3 border-b-2 border-green-500 rounded-full" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20">NEW</div>
                    </div>
                    <textarea 
                      value={activeStep.prompt || ''}
                      onChange={(e) => handleUpdatePrompt(e.target.value)}
                      className="w-full bg-blue-500/[0.03] border border-blue-500/20 rounded-xl p-4 text-sm leading-relaxed focus:border-blue-500/50 outline-none h-24 resize-none transition-colors text-blue-100"
                      placeholder="Paste text or use <variable> syntax..."
                    />
                    <p className="text-[10px] text-gray-600 mt-2 italic">If set, Ophelia will automatically paste this text into the field during playback.</p>
                  </section>
                )}
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
